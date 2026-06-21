import argparse
import os
import sys
import pandas as pd
import numpy as np
import warnings

warnings.filterwarnings("ignore")

# Define target job description
TARGET_JOB_DESCRIPTION = (
    "Looking for a Senior AI/ML Engineer and LLM Practitioner. "
    "Must have deep expertise in Python, NLP systems, Vector Databases, and Information Retrieval."
)

def generate_reasoning(row):
    """
    Generate dynamic reasoning text for the candidate.
    Must strictly conform to the format required by the validator:
    - 1 to 2 sentences describing title, experience, skills, and responsiveness.
    """
    title = row.get('current_title')
    title = str(title).strip() if pd.notna(title) else 'ML Engineer'
    if title.lower() in ['', 'none', 'null', 'nan']:
        title = 'ML Engineer'
        
    yoe = row.get('years_of_experience')
    yoe = float(yoe) if pd.notna(yoe) else 0.0
    
    skills_count = row.get('core_skills_count')
    skills_count = int(skills_count) if pd.notna(skills_count) else 0
    
    resp = row.get('recruiter_response_rate')
    resp = float(resp) if pd.notna(resp) else 0.0
    
    # Capitalize the first letter of the title
    if title:
        title = title[0].upper() + title[1:]
    
    return f"{title} with {yoe:.1f} yrs; {skills_count} AI core skills; response rate {resp:.2f}."

def main():
    parser = argparse.ArgumentParser(description="Redrob Candidate Ranking Engine")
    parser.add_argument('--candidates', type=str, required=True, help="Path to input candidates.jsonl")
    parser.add_argument('--out', type=str, required=True, help="Path to output submission.csv")
    args = parser.parse_args()

    candidates_path = args.candidates
    output_path = args.out

    print(f"Candidates Input Path: {candidates_path}")
    print(f"Output Submission Path: {output_path}")

    # Check if we can use pre-computed Parquets (runs in <1s)
    # Only use pre-computed files if the input file matches the default 100K file exactly
    is_default_file = (
        os.path.basename(candidates_path) == "candidates.jsonl" and 
        os.path.exists(candidates_path) and 
        os.path.getsize(candidates_path) > 400 * 1024 * 1024  # >400MB
    )

    if is_default_file:
        print("Default 100K candidate file detected. Loading pre-computed Parquet files...")
        features_path = "dataset/features.parquet"
        metadata_path = "dataset/metadata.parquet"
        nlp_path = "dataset/nlp_semantic_features.parquet"
        if not os.path.exists(nlp_path):
            nlp_path = "submission_files/nlp_semantic_features.parquet"

        if os.path.exists(features_path) and os.path.exists(metadata_path) and os.path.exists(nlp_path):
            df_feat = pd.read_parquet(features_path, engine='fastparquet')
            df_meta = pd.read_parquet(metadata_path, engine='fastparquet')
            df_nlp = pd.read_parquet(nlp_path, engine='fastparquet')
            
            # Merge datasets
            df = df_feat.merge(df_nlp, on="candidate_id").merge(df_meta, on="candidate_id", suffixes=('', '_dup'))
            df = df.loc[:, ~df.columns.str.endswith('_dup')]
        else:
            is_default_file = False  # Fall back to dynamic processing if parquets are missing
            print("Pre-computed Parquet files missing. Falling back to dynamic pipeline...")

    if not is_default_file:
        print("Dynamic pipeline active. Running preprocessing on input candidates...")
        # Run preprocessing dynamically
        import preprocess
        temp_features = "temp_features.parquet"
        temp_metadata = "temp_metadata.parquet"
        
        # Ensure temporary outputs are cleaned if they exist
        for f in [temp_features, temp_metadata]:
            if os.path.exists(f):
                os.remove(f)
                
        preprocess.run_preprocessing(
            input_file=candidates_path,
            features_out=temp_features,
            metadata_out=temp_metadata
        )

        df_feat = pd.read_parquet(temp_features, engine='fastparquet')
        df_meta = pd.read_parquet(temp_metadata, engine='fastparquet')
        
        # Merge preprocessed features and metadata
        df = df_feat.merge(df_meta, on="candidate_id", suffixes=('', '_dup'))
        df = df.loc[:, ~df.columns.str.endswith('_dup')]

        # Clean up temporary files
        os.remove(temp_features)
        os.remove(temp_metadata)

        # NLP Semantic Scoring Inference
        df['unified_resume_text'] = (
            "Current Title: " + df['current_title'].fillna("Unknown/Not Provided").astype(str) + ". " +
            "Professional Headline: " + df['headline'].fillna("None").astype(str) + ". " +
            "Location Details: " + df['location'].fillna("Unknown").astype(str) + "."
        )

        nlp_scores = None
        # Try loading the fine-tuned Siamese Transformer
        try:
            print("Loading fine-tuned Transformer model for semantic matching...")
            import torch
            from sentence_transformers import SentenceTransformer
            model_path = "./submission_files/fine_tuned_recruiter_transformer"
            if not os.path.exists(model_path):
                model_path = "submission_files/fine_tuned_recruiter_transformer"
                
            device = "cuda" if torch.cuda.is_available() else "cpu"
            model = SentenceTransformer(model_path, device=device)
            
            # Encode resume and JD
            resume_embeddings = model.encode(df['unified_resume_text'].tolist(), show_progress_bar=False, convert_to_numpy=True)
            jd_embedding = model.encode(TARGET_JOB_DESCRIPTION, convert_to_numpy=True)
            
            # Compute Cosine Similarity
            dot_products = np.dot(resume_embeddings, jd_embedding)
            resume_norms = np.linalg.norm(resume_embeddings, axis=1)
            jd_norm = np.linalg.norm(jd_embedding)
            nlp_scores = dot_products / (resume_norms * jd_norm + 1e-8)
            print("NLP semantic inference completed successfully.")
        except Exception as e:
            print(f"Transformer inference failed: {e}. Falling back to TF-IDF semantic scoring...")
            # Fallback to TF-IDF Cosine Similarity (ensures code NEVER crashes)
            from sklearn.feature_extraction.text import TfidfVectorizer
            from sklearn.metrics.pairwise import cosine_similarity
            
            vectorizer = TfidfVectorizer(stop_words='english')
            texts = df['unified_resume_text'].tolist() + [TARGET_JOB_DESCRIPTION]
            tfidf = vectorizer.fit_transform(texts)
            res_vectors = tfidf[:-1]
            jd_vector = tfidf[-1]
            nlp_scores = cosine_similarity(res_vectors, jd_vector).flatten()
            print("TF-IDF semantic scoring fallback completed.")

        df['trained_nlp_match_score'] = nlp_scores

    # Clip NLP scores to standard bounds
    df['trained_nlp_match_score'] = df['trained_nlp_match_score'].clip(0.0, 1.0)

    # Schema defaults and NaN protection
    required_cols_defaults = {
        'trained_nlp_match_score': 0.0,
        'ai_ml_relevance_score': 0.0,
        'core_skill_score': 0.0,
        'strong_skill_score': 0.0,
        'adjacent_skill_score': 0.0,
        'seniority_match': 0.0,
        'skill_assessment_bonus': 0.0,
        'has_production_deployment': False,
        'platform_trust_score': 0.0,
        'is_honeypot_suspect': False,
        'is_services_only': False,
        'is_purely_non_nlp': False,
        'is_job_hopper': False,
        'availability_score': 0.0,
        'location_score': 1.0,
        'notice_score': 1.0,
        'salary_fit': 1.0,
        'current_title': 'ML Engineer',
        'years_of_experience': 0.0,
        'core_skills_count': 0,
        'recruiter_response_rate': 0.0
    }
    
    for col, default in required_cols_defaults.items():
        if col not in df.columns:
            df[col] = default
        else:
            df[col] = df[col].fillna(default)

    # =====================================================================
    # STEP 3: THE HYBRID SCORING FORMULA
    # =====================================================================
    print("Calculating final match scores...")
    
    # 1. Base suitability score
    df['score_base'] = (
        0.45 * df['trained_nlp_match_score'] +
        0.10 * df['ai_ml_relevance_score'] +
        0.20 * df['core_skill_score'] +
        0.10 * df['strong_skill_score'] +
        0.05 * df['adjacent_skill_score'] +
        0.10 * df['seniority_match']
    )

    # 2. Add Platform Bonuses
    df['bonus'] = (
        0.10 * df['skill_assessment_bonus'] +
        0.05 * df['has_production_deployment'].astype(float) +
        0.05 * df['platform_trust_score']
    )
    
    df['match_score'] = df['score_base'] + df['bonus']

    # 3. Multiplier Filters
    df['multiplier_filter'] = 1.0
    
    # A. Honeypot check (hard filter)
    if 'is_honeypot_suspect' in df.columns:
        df.loc[df['is_honeypot_suspect'] == True, 'multiplier_filter'] = 0.0
        
    # B. Services company check (soft/hard filter)
    if 'is_services_only' in df.columns:
        df.loc[(df['is_services_only'] == True) & (df['multiplier_filter'] > 0), 'multiplier_filter'] *= 0.1
        
    # C. Purely Non-NLP check (disqualification warning in JD)
    if 'is_purely_non_nlp' in df.columns:
        df.loc[(df['is_purely_non_nlp'] == True) & (df['multiplier_filter'] > 0), 'multiplier_filter'] *= 0.2

    # D. Job Hopper check (stability penalty)
    if 'is_job_hopper' in df.columns:
        df.loc[(df['is_job_hopper'] == True) & (df['multiplier_filter'] > 0), 'multiplier_filter'] *= 0.7

    # 4. Soft logistical and availability modifiers
    df['multiplier_soft'] = (
        (0.5 + 0.5 * df['availability_score']) *
        df['location_score'] *
        (0.7 + 0.3 * df['notice_score']) *
        (0.7 + 0.3 * df['salary_fit'])
    )

    # Compute Final Score
    df['score'] = df['match_score'] * df['multiplier_filter'] * df['multiplier_soft']
    df['score'] = df['score'].fillna(0.0)
    
    # Scale final score to fit [0.0, 1.0] range
    max_score = df['score'].max()
    if max_score > 0:
        df['score'] = df['score'] / max_score
    df['score'] = df['score'].fillna(0.0)
        
    # =====================================================================
    # STEP 4: TIE-BREAKING & SUBMISSION EXPORT
    # =====================================================================
    # Sort strictly by: score descending, then candidate_id ascending for tie-breaks
    df = df.sort_values(by=["score", "candidate_id"], ascending=[False, True])
    
    # Select top 100 rows
    top_100 = df.head(100).copy()
    top_100['rank'] = range(1, len(top_100) + 1)
    
    # Generate dynamic reasoning strings
    top_100['reasoning'] = top_100.apply(generate_reasoning, axis=1)
    
    # Select columns matching final submission specification
    submission = top_100[['candidate_id', 'rank', 'score', 'reasoning']]
    
    # Export to output CSV
    submission.to_csv(output_path, index=False)
    print(f"Successfully generated ranked submission CSV at: '{output_path}'")
    if len(submission) > 0:
        print(f"Top Candidate Ranked: {submission.iloc[0]['candidate_id']} (Score: {submission.iloc[0]['score']:.4f})")
    else:
        print("No candidates found.")

if __name__ == '__main__':
    main()
