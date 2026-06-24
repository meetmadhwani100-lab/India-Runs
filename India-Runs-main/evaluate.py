import pandas as pd
import os

def evaluate():
    try:
        df_meta = pd.read_parquet('dataset/metadata.parquet')
        df_feat = pd.read_parquet('dataset/features.parquet')
        
        nlp_path = 'dataset/nlp_semantic_features.parquet'
        if not os.path.exists(nlp_path):
            nlp_path = 'submission_files/nlp_semantic_features.parquet'
        df_nlp = pd.read_parquet(nlp_path)
    except Exception as e:
        print("Error loading parquet files:", e)
        return

    # Merge all data
    df = df_feat.merge(df_meta, on='candidate_id', how='inner')
    df = df.merge(df_nlp, on='candidate_id', how='left')
    
    # NLP scores might be string, convert to float and fill missing with 0
    df['trained_nlp_match_score'] = pd.to_numeric(df['trained_nlp_match_score'], errors='coerce').fillna(0.0)
    
    # Define Ground Truth
    df['target_fit_relevance'] = (
        df['core_skill_score'] * 0.5 + 
        df['ai_ml_relevance_score'] * 0.3 + 
        df['seniority_match'] * 0.2
    )
    if 'is_honeypot_suspect' in df.columns:
        df.loc[df['is_honeypot_suspect'] == True, 'target_fit_relevance'] = 0.0
        
    # Baseline 1: Pure ML Model (Sorting only by objective features)
    df_ml = df.sort_values('target_fit_relevance', ascending=False)
    
    # Baseline 2: Pure NLP Model (Sorting only by Semantic Cosine Similarity)
    df_nlp_only = df.sort_values('trained_nlp_match_score', ascending=False)
    
    # Baseline 3: Hybrid (What we submitted)
    df['hybrid_score'] = (
        df['trained_nlp_match_score'] * 0.45 + 
        df['core_skill_score'] * 0.20 + 
        df['ai_ml_relevance_score'] * 0.10 + 
        df['seniority_match'] * 0.10
    )
    df_hybrid = df.sort_values('hybrid_score', ascending=False)

    threshold = 0.60
    relevant_candidates = df[df['target_fit_relevance'] >= threshold]
    total_relevant = len(relevant_candidates)
    
    k_values = [10, 50, 100]
    
    models = {
        "ML Model (Objective Features)": df_ml,
        "NLP Model (Semantic Similarity)": df_nlp_only,
        "Hybrid Model (Our Submission)": df_hybrid
    }

    print("="*80)
    print("MODEL COMPARISON: PRECISION & RECALL")
    print("="*80)
    print(f"Ground Truth Threshold: Target Fit >= {threshold:.2f} ({total_relevant} total relevant)")
    print("-" * 80)
    
    for name, sorted_df in models.items():
        print(f"\nEvaluating: {name}")
        print(f"{'K':<5} | {'Precision@K':<15} | {'Recall@K':<15} | {'F1-Score':<15}")
        print("-" * 65)
        
        for k in k_values:
            top_k = sorted_df.head(k)
            retrieved_relevant = top_k[top_k['candidate_id'].isin(relevant_candidates['candidate_id'])]
            num_rr = len(retrieved_relevant)
            
            precision = num_rr / k if k > 0 else 0
            recall = num_rr / total_relevant if total_relevant > 0 else 0
            f1 = 2 * (precision * recall) / (precision + recall) if (precision + recall) > 0 else 0
            
            print(f"{k:<5} | {precision:.4f} ({precision*100:4.1f}%) | {recall:.4f} ({recall*100:4.1f}%) | {f1:.4f}")

if __name__ == '__main__':
    evaluate()
