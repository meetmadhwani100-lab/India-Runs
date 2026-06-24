# =====================================================================
# STEP 0: INSTALL DEPENDENCIES 
# =====================================================================
!pip install -q sentence-transformers pyarrow openpyxl python-dateutil

import os
import re
import torch
import numpy as np
import pandas as pd
from torch.utils.data import DataLoader
from sentence_transformers import SentenceTransformer, InputExample, losses, evaluation

print("--- Environment Verification ---")
print(f"CUDA (GPU) Available: {torch.cuda.is_available()}")
if torch.cuda.is_available():
    print(f"Training Active on GPU: {torch.cuda.get_device_name(0)}")
else:
    print("WARNING: GPU not detected. Training will run on CPU and be significantly slower!")

# =====================================================================
# STEP 1: REAL COMPETITION DATASET ROUTING & LOADING
# =====================================================================
# ⚠️ ACTION REQUIRED: Change the folder name string below to match your exact Kaggle Input folder name
DATASET_FOLDER_NAME = "+datasets/kashviporwal/data123" 

# Defining Kaggle standard input mount paths
metadata_path = f"../input/{DATASET_FOLDER_NAME}/metadata.parquet"
features_path = f"../input/{DATASET_FOLDER_NAME}/features.parquet"

# Fallback checking loop to prevent crash if data is placed in the local workspace directory instead
if not os.path.exists(metadata_path):
    print("Kaggle input path not found. Falling back to local working directory pathing...")
    metadata_path = "dataset/metadata.parquet"
    features_path = "dataset/features.parquet"

if not os.path.exists(metadata_path) or not os.path.exists(features_path):
    raise FileNotFoundError(
        f"Could not locate your dataset parquet files! Check your spelling in DATASET_FOLDER_NAME. "
        f"Looked inside: {metadata_path}"
    )

print(f"Successfully located files.\n -> Reading Metadata from: {metadata_path}\n -> Reading Features from: {features_path}")
df_meta = pd.read_parquet(metadata_path, engine='fastparquet')
df_feat = pd.read_parquet(features_path, engine='fastparquet')

print(f"Loaded Metadata Shape: {df_meta.shape}")
print(f"Loaded Features Shape: {df_feat.shape}")

# =====================================================================
# STEP 2: DATA ALIGNMENT & UNIFIED PROFILE SYNTHESIS
# =====================================================================
print("\nAligning and merging datasets on 'candidate_id'...")
# Merge dataframes cleanly while dropping duplicated columns
df = pd.merge(df_meta, df_feat, on="candidate_id", suffixes=('', '_dup'))
df = df.loc[:, ~df.columns.str.endswith('_dup')]

print("Synthesizing unified text descriptions for Transformer text attention mechanisms...")
# We build a natural language layout out of individual data points to optimize self-attention layers
df['unified_resume_text'] = (
    "Current Title: " + df['current_title'].fillna("Unknown/Not Provided").astype(str) + ". " +
    "Professional Headline: " + df['headline'].fillna("None").astype(str) + ". " +
    "Location Details: " + df['location'].fillna("Unknown").astype(str) + "."
)

# Target search query matching Track 01 Intelligent Candidate Discovery focus
target_job_description = (
    "Looking for a Senior AI/ML Engineer and LLM Practitioner. "
    "Must have deep expertise in Python, NLP systems, Vector Databases, and Information Retrieval."
)

# =====================================================================
# STEP 3: COMPUTING SUPERVISION LABELS & ACCURACY ENHANCEMENT
# =====================================================================
print("Generating continuous supervision labels from Person 1's engineered components...")

# Map feature columns engineered by Person 1 directly to generate a combined target fitness scale
df['target_fit_relevance'] = (
    df['core_skill_score'] * 0.5 + 
    df['ai_ml_relevance_score'] * 0.3 + 
    df['seniority_match'] * 0.2
)

# SECURITY LAYER: Drop the relevance score of honeypot suspect profiles strictly to 0.0
# This trains the transformer attention heads to reject malicious or heavily faked application text
if 'is_honeypot_suspect' in df.columns:
    honeypots_count = df['is_honeypot_suspect'].sum()
    print(f"Fraud Detection: Penalizing {honeypots_count} honeypot suspect profiles to 0.0 relevance.")
    df.loc[df['is_honeypot_suspect'] == True, 'target_fit_relevance'] = 0.0

df['target_fit_relevance'] = df['target_fit_relevance'].clip(0.0, 1.0)

# Build training input pairs
print("Packaging inputs into Siamese Network Example tuples...")
train_examples = []
for _, row in df.iterrows():
    train_examples.append(InputExample(
        texts=[target_job_description, row['unified_resume_text']], 
        label=float(row['target_fit_relevance'])
    ))

# 80/20 Train/Validation Split for pipeline diagnostic verification
split_idx = int(len(train_examples) * 0.8)
train_data = train_examples[:split_idx]
val_data = train_examples[split_idx:]

train_dataloader = DataLoader(train_data, shuffle=True, batch_size=16)

# =====================================================================
# STEP 4: MODEL CONFIGURATION & CONTRASTIVE TRAINING
# =====================================================================
device = "cuda" if torch.cuda.is_available() else "cpu"

# Automatically choose lightweight architecture if accelerator wasn't switched on in Kaggle
base_model = "BAAI/bge-base-en-v1.5" if device == "cuda" else "sentence-transformers/all-MiniLM-L6-v2"
print(f"Loading Base Encoder Model: {base_model} onto {device}")
model = SentenceTransformer(base_model, device=device)

# Using CosineSimilarityLoss to map semantic metrics onto continuous scales
train_loss = losses.CosineSimilarityLoss(model=model)

# Validation evaluation engine
val_sentences1 = [x.texts[0] for x in val_data]
val_sentences2 = [x.texts[1] for x in val_data]
val_labels = [x.label for x in val_data]
evaluator = evaluation.EmbeddingSimilarityEvaluator(val_sentences1, val_sentences2, val_labels)

print("\n🤖 Initiating Fine-Tuning Phase. Training model attention weights...")
model.fit(
    train_objectives=[(train_dataloader, train_loss)],
    evaluator=evaluator,
    epochs=2,
    evaluation_steps=20,
    warmup_steps=int(len(train_dataloader) * 0.1),
    output_path="./fine_tuned_recruiter_transformer"
)

# =====================================================================
# STEP 5: OPTIMIZED RETRIEVAL EXTRACTION & EXPORT
# =====================================================================
print("\nTraining complete! Loading customized transformer weight vectors...")
trained_model = SentenceTransformer("./fine_tuned_recruiter_transformer", device=device)

print("Vectorizing complete candidate text space matrix blocks...")
resume_embeddings = trained_model.encode(df['unified_resume_text'].tolist(), show_progress_bar=True, convert_to_numpy=True)
jd_embedding = trained_model.encode(target_job_description, convert_to_numpy=True)

print("Calculating vectorized Cosine Similarities across continuous latent space...")
# Computes matrix dot product across the dimensions
dot_products = np.dot(resume_embeddings, jd_embedding)
resume_norms = np.linalg.norm(resume_embeddings, axis=1)
jd_norm = np.linalg.norm(jd_embedding)

# Avoid divide-by-zero occurrences if unexpected blank strings exist
final_scores = dot_products / (resume_norms * jd_norm + 1e-8)

# Output isolated features to parquet format
nlp_features_output = pd.DataFrame({
    'candidate_id': df['candidate_id'],
    'trained_nlp_match_score': final_scores
})

output_filename = "nlp_semantic_features.parquet"
nlp_features_output.to_parquet(output_filename, engine='fastparquet', index=False)
local_dataset_path = "dataset/nlp_semantic_features.parquet"
if os.path.exists("dataset"):
    os.makedirs(os.path.dirname(local_dataset_path), exist_ok=True)
    nlp_features_output.to_parquet(local_dataset_path, engine='fastparquet', index=False)
    print(f"Also saved local copy to: '{local_dataset_path}'")

print(f"\n🎯 SUCCESS! Custom NLP model has been trained and evaluated.")
print(f"💾 Feature file exported as: '{output_filename}' in your Kaggle working directory.")
print("\n--- Top 10 High-Relevance Candidates Extracted via Your Custom NLP Module ---")
print(nlp_features_output.sort_values(by='trained_nlp_match_score', ascending=False).head(10).to_string(index=False))