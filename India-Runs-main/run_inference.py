import os
import numpy as np
import pandas as pd
import torch

# Optimize PyTorch CPU inference speed by setting thread limit
torch.set_num_threads(4)

from sentence_transformers import SentenceTransformer

# Target search query matching Track 01 Intelligent Candidate Discovery focus
TARGET_JOB_DESCRIPTION = (
    "Looking for a Senior AI/ML Engineer and LLM Practitioner. "
    "Must have deep expertise in Python, NLP systems, Vector Databases, and Information Retrieval."
)

def main():
    print("--- Starting NLP Semantic Inference with pre-filtering optimization ---")
    
    metadata_path = "dataset/metadata.parquet"
    features_path = "dataset/features.parquet"
    
    if not os.path.exists(metadata_path) or not os.path.exists(features_path):
        raise FileNotFoundError("Could not find metadata or features parquet files!")
        
    print("Loading datasets...")
    df_meta = pd.read_parquet(metadata_path, engine='fastparquet')
    df_feat = pd.read_parquet(features_path, engine='fastparquet')
    
    # Merge datasets
    df = df_meta.merge(df_feat, on="candidate_id", suffixes=('', '_dup'))
    df = df.loc[:, ~df.columns.str.endswith('_dup')]
    print(f"Total candidates loaded: {len(df)}")
    
    # Aggressive pre-filtering: Only encode candidates who:
    # 1. Have at least one core or strong skill (excludes 78% of irrelevant candidates)
    # 2. Are within a realistic experience window (2-15 years)
    # 3. Are not flagged as honeypot suspects
    # 4. Have not spent their entire career at consulting/services firms (TCS, Infosys, etc.)
    df_filtered = df[
        ((df['core_skill_score'] > 0.0) | (df['strong_skill_score'] > 0.0)) &
        (df['years_of_experience'] >= 2.0) &
        (df['years_of_experience'] <= 15.0) &
        (~df['is_honeypot_suspect']) &
        (~df['is_services_only'])
    ].copy()
    
    print(f"Filtered candidates to encode: {len(df_filtered)} ({len(df_filtered)/len(df)*100:.2f}%)")
    
    if len(df_filtered) == 0:
        print("Warning: No candidates passed pre-filtering. Encoding full list...")
        df_filtered = df.copy()
        
    # Synthesize unified resume text
    df_filtered['unified_resume_text'] = (
        "Current Title: " + df_filtered['current_title'].fillna("Unknown/Not Provided").astype(str) + ". " +
        "Professional Headline: " + df_filtered['headline'].fillna("None").astype(str) + ". " +
        "Location Details: " + df_filtered['location'].fillna("Unknown").astype(str) + "."
    )
    
    model_path = "submission_files/fine_tuned_recruiter_transformer"
    if not os.path.exists(model_path):
        raise FileNotFoundError(f"Could not find fine-tuned transformer at {model_path}")
        
    device = "cuda" if torch.cuda.is_available() else "cpu"
    print(f"Loading fine-tuned model onto {device}...")
    model = SentenceTransformer(model_path, device=device)
    
    print(f"Encoding {len(df_filtered)} sentences on CPU (Thread limit: {torch.get_num_threads()})...")
    # Batch size 256 is optimal for throughput on CPU
    resume_embeddings = model.encode(
        df_filtered['unified_resume_text'].tolist(), 
        batch_size=256, 
        show_progress_bar=True, 
        convert_to_numpy=True
    )
    
    print("Vectorizing target Job Description...")
    jd_embedding = model.encode(TARGET_JOB_DESCRIPTION, convert_to_numpy=True)
    
    print("Calculating Cosine Similarities...")
    dot_products = np.dot(resume_embeddings, jd_embedding)
    resume_norms = np.linalg.norm(resume_embeddings, axis=1)
    jd_norm = np.linalg.norm(jd_embedding)
    final_scores = dot_products / (resume_norms * jd_norm + 1e-8)
    
    df_filtered['trained_nlp_match_score'] = final_scores
    
    # Map scores back to the original candidates list (fill missing with 0.0)
    scores_map = dict(zip(df_filtered['candidate_id'], df_filtered['trained_nlp_match_score']))
    df['trained_nlp_match_score'] = df['candidate_id'].map(scores_map).fillna(0.0)
    
    # Export features
    nlp_features_output = pd.DataFrame({
        'candidate_id': df['candidate_id'],
        'trained_nlp_match_score': df['trained_nlp_match_score']
    })
    
    output_filename = "dataset/nlp_semantic_features.parquet"
    print(f"Saving scores to {output_filename}...")
    os.makedirs(os.path.dirname(os.path.abspath(output_filename)), exist_ok=True)
    nlp_features_output.to_parquet(output_filename, engine='fastparquet', index=False)
    print("--- NLP Semantic Inference Completed Successfully ---")

if __name__ == '__main__':
    main()
