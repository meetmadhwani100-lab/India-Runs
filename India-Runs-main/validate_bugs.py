import pandas as pd
import numpy as np

feat = pd.read_parquet("features.parquet")

print("=== BUG 1: Honeypot detection ===")
n = feat['is_honeypot_suspect'].sum()
print(f"  is_honeypot_suspect=True: {n} ({n/len(feat)*100:.2f}%)")
print(f"  Expected: > 0, ideally 50–150 candidates flagged")

print("\n=== BUG 2: ai_ml_relevance_score bounds ===")
over = (feat['ai_ml_relevance_score'] > 1.0).sum()
print(f"  Values > 1.0: {over}  (expected: 0)")
print(f"  Max: {feat['ai_ml_relevance_score'].max():.4f}  (expected: <= 1.0)")

print("\n=== BUG 3: location_score distribution ===")
print(feat['location_score'].value_counts().sort_index())
print("  Expected: three buckets — 0.2, 0.5, 1.0")

print("\n=== BUG 4: skill_assessment_bonus bounds ===")
over2 = (feat['skill_assessment_bonus'] > 1.0).sum()
print(f"  Values > 1.0: {over2}  (expected: 0)")
print(f"  Max: {feat['skill_assessment_bonus'].max():.4f}  (expected: <= 1.0)")

print("\n=== Sanity: no nulls or infs ===")
print(f"  Nulls: {feat.isnull().sum().sum()}")
numeric = feat.select_dtypes(include=[np.number])
print(f"  Infs: {np.isinf(numeric).sum().sum()}")
print(f"  Shape: {feat.shape}  (expected: (100000, 23))")
