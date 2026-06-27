<div align="center">

<img src="https://img.shields.io/badge/India%20Runs-Hackathon%202026-0A66C2?style=for-the-badge&logo=rocket&logoColor=white" />
<img src="https://img.shields.io/badge/Track-Intelligent%20Candidate%20Discovery-1D9E75?style=for-the-badge" />
<img src="https://img.shields.io/badge/Model-Siamese%20Transformer-7C3AED?style=for-the-badge&logo=huggingface&logoColor=white" />

# 🤖 Redrob AI — Intelligent Candidate Ranking Engine

**An end-to-end ML pipeline that moves beyond keyword filters to deeply understand semantic fit, career intent, and behavioral signals — delivering a lightning-fast, expertly ranked shortlist from a pool of 100,000+ candidates.**

[Live Demo](#-quick-start) · [Architecture](#-system-architecture) · [Scoring Formula](#-the-hybrid-scoring-formula) · [Results](#-results)

---

</div>

## 📌 The Problem

Recruiters drowning in candidate profiles face a fundamental flaw in traditional systems: **keyword matching misses context**. A candidate who spent 5 years building production NLP pipelines at a product startup will be ranked the same as someone who listed "NLP" as a beginner skill.

We built a system that actually understands the difference.

---

## ✨ What Makes This Different

| Traditional ATS | Redrob AI |
|---|---|
| Keyword count | Semantic embedding similarity |
| Boolean filters | Continuous 0.0 → 1.0 fitness scores |
| Static rules | Fine-tuned domain-specific model |
| Ignores signals | Integrates 20+ behavioral features |
| Misses fraud | Multi-signal honeypot detection |

---

## 🏗 System Architecture

```
candidates.jsonl (100K profiles)
        │
        ▼
┌───────────────────────────────────────────────────────────────┐
│  STAGE 1 — Feature Engineering          preprocess.py         │
│                                                               │
│  • Skill normalization & proficiency scoring                  │
│  • Career timeline reconstruction & gap detection             │
│  • Honeypot / fraud signal identification (8 heuristics)      │
│  • Engagement, availability, and location signals             │
│  • Output: features.parquet + metadata.parquet                │
└───────────────────────────────────────────────────────────────┘
        │
        ▼
┌───────────────────────────────────────────────────────────────┐
│  STAGE 2 — Contrastive Fine-Tuning      train.py              │
│                                                               │
│  • Base model: BAAI/bge-base-en-v1.5 (GPU) / MiniLM (CPU)    │
│  • Architecture: Siamese Bi-Encoder Network                   │
│  • Loss: CosineSimilarityLoss on continuous [0.0, 1.0] labels │
│  • Labels derived from: core_skill × 0.5 + ai_relevance × 0.3│
│    + seniority_match × 0.2 (honeypots zeroed out)             │
│  • Output: fine_tuned_recruiter_transformer/                  │
└───────────────────────────────────────────────────────────────┘
        │
        ▼
┌───────────────────────────────────────────────────────────────┐
│  STAGE 3 — Semantic Retrieval           run_inference.py       │
│                                                               │
│  • Encodes all candidate text into dense vector matrix        │
│  • Computes cosine similarity: dot(resume, JD) / (‖r‖·‖JD‖)  │
│  • Fallback: TF-IDF cosine similarity (never crashes)         │
│  • Output: nlp_semantic_features.parquet                      │
└───────────────────────────────────────────────────────────────┘
        │
        ▼
┌───────────────────────────────────────────────────────────────┐
│  STAGE 4 — Hybrid Ranking               rank.py               │
│                                                               │
│  • Combines NLP score with 12+ engineered features            │
│  • Hard multipliers for fraud, CV-only, services-only         │
│  • Soft multipliers for availability, location, notice, salary│
│  • Outputs top-100 ranked candidates to submission.csv        │
└───────────────────────────────────────────────────────────────┘
        │
        ▼
┌───────────────────────────────────────────────────────────────┐
│  STAGE 5 — Recruiter UI                 recruiter-ui/          │
│                                                               │
│  • React 19 + Vite dashboard with real submission data        │
│  • Dark / Light theme, score bars, skill match badges         │
│  • 4-stage pipeline viewer, score histogram                   │
│  • Shortlist builder + CSV export                             │
└───────────────────────────────────────────────────────────────┘
```

---

## 📁 Project Structure

```
India-Runs/
│
├── 📄 preprocess.py              Feature engineering pipeline (552 lines)
├── 📄 train.py                   Transformer fine-tuning script
├── 📄 rank.py                    Hybrid scoring & submission generator
├── 📄 run_inference.py           Standalone inference runner
├── 📄 validate_bugs.py           Submission format validator
├── 📄 submission.csv             Final output — Top 100 ranked candidates
│
├── 📂 dataset/
│   ├── features.parquet          Pre-computed engineered features (100K rows)
│   └── metadata.parquet          Candidate metadata (100K rows)
│
├── 📂 submission_files/
│   ├── features.parquet          Submission-time features
│   ├── metadata.parquet          Submission-time metadata
│   ├── nlp_semantic_features.parquet   Transformer similarity scores
│   ├── checkpoints/              Training checkpoints
│   └── fine_tuned_recruiter_transformer/   Saved model weights
│
└── 📂 recruiter-ui/              React dashboard
    ├── src/
    │   ├── App.jsx               Main application (dark mode, filters, shortlist)
    │   ├── index.css             Design token system (light + dark themes)
    │   ├── App.css               All component styles
    │   ├── data/
    │   │   └── candidates.js     Real submission data as JS module
    │   └── components/
    │       ├── PipelineView.jsx  4-stage pipeline visualizer
    │       └── ScoreHistogram.jsx Score distribution chart
    └── package.json
```

---

## 🧠 The Hybrid Scoring Formula

```
Final Score = Base Score × Multiplier (Hard) × Multiplier (Soft)
```

### Base Score (weights sum to 1.0)

| Component | Weight | Source |
|---|---|---|
| NLP Semantic Match | **45%** | Fine-tuned Transformer cosine similarity |
| Core Skill Score | **20%** | Python, embeddings, vector DB, NLP, transformers, FAISS... |
| AI/ML Relevance | **10%** | Time-decay weighted career relevance score |
| Strong Skill Score | **10%** | LLMs, fine-tuning, LoRA, learning-to-rank, XGBoost... |
| Seniority Match | **10%** | Peak at 5–9 yrs; ramps from 2, falls after 9 |
| Adjacent Skills | **5%** | Recommendation systems, Spark, deep learning... |

### Bonus Signals (+0.0 to +0.2)

| Signal | Max Bonus |
|---|---|
| Skill Assessment Score > 70 on core skills | +10% |
| Production deployment in career history | +5% |
| Platform trust (verified email/phone/LinkedIn) | +5% |

### Hard Multiplier Filters (disqualifying)

| Condition | Multiplier |
|---|---|
| 🚨 Honeypot / Fraud Detected | **× 0.0** (eliminated) |
| 🔴 Purely Non-NLP (CV/Robotics only) | **× 0.2** |
| 🟡 Services Company Only | **× 0.1** |
| 🟠 Job Hopper (≥2 consecutive tenures < 18 months) | **× 0.7** |

### Soft Logistical Multipliers

```python
multiplier_soft = (
    (0.5 + 0.5 × availability_score) ×
    location_score ×
    (0.7 + 0.3 × notice_score) ×
    (0.7 + 0.3 × salary_fit)
)
```

---

## 🕵️ Fraud Detection System

Eight independent signals that flag a candidate as a honeypot (score → 0):

1. **Impossible founding date** — Company size "1–10" with >10 years tenure
2. **Future start dates** — Career role begins in the future
3. **Suspicious skill claims** — ≥4 advanced/expert skills with 0 months duration
4. **Title/experience mismatch** — "Senior/Lead" title with < 2 years experience
5. **Endorsement anomaly** — >500 endorsements received with <10 connections
6. **Perfect signal syndrome** — All platform metrics at exact maximum (100%)
7. **Impossible career dates** — End date before start date, or start date in future
8. **Experience mismatch** — Claimed YoE vs actual career months differ by >3 years

---

## 🤗 NLP Model Details

### Architecture: Siamese Bi-Encoder

```
JD Text ──► [Transformer Encoder] ──► JD Embedding (768-dim)
                                              │
                                    cosine_similarity()  ──► Score [0,1]
                                              │
Resume ──► [Transformer Encoder] ──► Resume Embedding (768-dim)
```

### Training Configuration

| Parameter | Value |
|---|---|
| Base Model (GPU) | `BAAI/bge-base-en-v1.5` |
| Base Model (CPU) | `sentence-transformers/all-MiniLM-L6-v2` |
| Loss Function | `CosineSimilarityLoss` |
| Epochs | 2 |
| Batch Size | 16 |
| Train / Val Split | 80 / 20 |
| Label Range | Continuous [0.0, 1.0] |

### Unified Resume Text Format

```
Current Title: Senior ML Engineer. Professional Headline: NLP & Search @Flipkart. Location Details: Bengaluru, India.
```

### Target Job Description (Track 01)

```
Looking for a Senior AI/ML Engineer and LLM Practitioner. Must have deep expertise in 
Python, NLP systems, Vector Databases, and Information Retrieval.
```

---

## 📊 Feature Engineering Deep Dive (`preprocess.py`)

### Skill Taxonomy

| Tier | Skills |
|---|---|
| **Core** | `python`, `embeddings`, `vector-database`, `retrieval`, `ranking`, `information-retrieval`, `nlp`, `transformers`, `sentence-transformers`, `faiss`, `pinecone`, `weaviate`, `qdrant`, `elasticsearch`, `opensearch` |
| **Strong** | `llm`, `fine-tuning`, `lora`, `learning-to-rank`, `xgboost`, `a/b testing`, `evaluation-frameworks`, `ndcg`, `mlflow`, `hugging face` |
| **Adjacent** | `recommendation-systems`, `search`, `data-pipelines`, `spark`, `deep-learning`, `pytorch`, `tensorflow` |

### Skill Score Formula

```python
skill_score(skill_set) = Σ proficiency × log1p(duration_months + 1) × log1p(endorsements + 1)
```

Rewards depth (proficiency) + experience length (duration) + social proof (endorsements).

### Career Features Extracted

- `ai_ml_relevance_score` — time-decayed weight: `exp(-log(2) × months_ago / 24)`
- `product_company_ratio` — months at product companies / total career months
- `avg_tenure_score` — average tenure capped at 36 months, normalized
- `has_production_deployment` — scans role descriptions for: *production, deployed, prod, shipped, launched*

---

## 📈 Results

### Top 10 Ranked Candidates

| Rank | Candidate ID | Score | Role | YoE | AI Core Skills |
|---|---|---|---|---|---|
| 1 | `CAND_0018499` | **100.0%** | Senior Machine Learning Engineer | 7.2 yrs | 4 |
| 2 | `CAND_0027691` | 96.1% | NLP Engineer | 6.5 yrs | 3 |
| 3 | `CAND_0045250` | 94.9% | Applied ML Engineer | 6.6 yrs | 4 |
| 4 | `CAND_0037566` | 92.9% | Machine Learning Engineer | 6.9 yrs | 3 |
| 5 | `CAND_0066999` | 89.2% | Recommendation Systems Engineer | 5.9 yrs | 5 |
| 6 | `CAND_0068811` | 86.9% | Applied ML Engineer | 8.0 yrs | 5 |
| 7 | `CAND_0042029` | 86.0% | Senior Data Scientist | 6.5 yrs | 5 |
| 8 | `CAND_0050454` | 83.0% | AI Engineer | 6.8 yrs | 3 |
| 9 | `CAND_0041669` | 80.4% | Recommendation Systems Engineer | 8.0 yrs | 4 |
| 10 | `CAND_0046525` | 79.8% | Senior Machine Learning Engineer | 6.1 yrs | 5 |

### Shortlist Distribution

| Tier | Score Range | Count |
|---|---|---|
| 🔵 Elite | ≥ 90% | 4 |
| 🟢 Strong | 75–90% | 11 |
| 🟣 Potential | 60–75% | 51 |
| 🟡 Review | 55–60% | 34 |

---

## ⚡ Quick Start

### 1. Generate Rankings (Python Pipeline)

```bash
# Install dependencies
pip install sentence-transformers pandas numpy scikit-learn fastparquet python-dateutil torch

# Run the full ranking pipeline on any candidates file
python rank.py --candidates candidates.jsonl --out submission.csv

# The pipeline auto-detects:
# → If candidates.jsonl is the 100K competition file + pre-computed parquets exist → loads parquets (< 1 second)
# → Otherwise → runs full preprocessing + TF-IDF semantic fallback dynamically
```

### 2. Fine-tune the Transformer (optional, GPU recommended)

```bash
# On Kaggle (GPU T4/P100) or locally with CUDA
# Set DATASET_FOLDER_NAME in train.py to your Kaggle dataset path, then:
python train.py

# Outputs: fine_tuned_recruiter_transformer/
# Also saves: nlp_semantic_features.parquet (pre-computed for fast ranking)
```

### 3. Launch the Recruiter Dashboard

```bash
cd recruiter-ui
npm install
npm run dev
# → http://localhost:5173
```

---

## 🖥 Recruiter Dashboard Features

The dashboard at `recruiter-ui/` is a fully integrated React 19 + Vite application powered by the real `submission.csv` output.

### Controls

| Feature | Description |
|---|---|
| ⚙ AI Pipeline | Collapsible 4-stage pipeline diagram (click to expand) |
| 🌙 / ☀ Theme | One-click dark ↔ light mode toggle |
| 🔍 Search | Filter by Candidate ID or role title |
| Top N | Show Top 10 / 25 / 50 / 100 candidates |
| Tier Filter | Elite / Strong / Potential / Review |
| Sort | By ML Rank, Overall Score, Semantic Match, Skill Match |
| Shortlist | Mark candidates + export as CSV with one click |

### Candidate Detail Panel

Each candidate card expands to show:
- Conic gradient score ring (color changes by tier)
- Verbatim AI reasoning from the ML pipeline
- Raw ML score bar animation
- Three sub-score breakdowns (Semantic / Skills / Signal)
- Skill match badges: `Matched` · `Partial` · `Missing`

---

## 🔧 Tech Stack

### ML Pipeline

| Layer | Technology |
|---|---|
| Language | Python 3.10+ |
| Transformer | `sentence-transformers` (bge-base / MiniLM) |
| Training | PyTorch + CosineSimilarityLoss |
| Data | Pandas, NumPy, FastParquet |
| Fallback NLP | scikit-learn TF-IDF |
| Date parsing | `python-dateutil` |

### Frontend

| Layer | Technology |
|---|---|
| Framework | React 19 + Vite 8 |
| Styling | Vanilla CSS + CSS Custom Properties |
| Typography | Inter + JetBrains Mono (Google Fonts) |
| Data | Embedded JS module from `submission.csv` |
| Build | ESBuild (via Vite) |

---

## 📋 Submission Format

```csv
candidate_id,rank,score,reasoning
CAND_0018499,1,1.0,"Senior Machine Learning Engineer with 7.2 yrs; 4 AI core skills; response rate 0.61."
CAND_0027691,2,0.9613,"NLP Engineer with 6.5 yrs; 3 AI core skills; response rate 0.68."
...
```

- **100 rows** (top candidates from 100K pool)
- `score` normalized to [0.0, 1.0] (max = 1.0)
- `reasoning` follows the exact validator format: `{Title} with {X.X} yrs; {N} AI core skills; response rate {R.RR}.`

---

## 🧪 Validation

```bash
python validate_bugs.py
```

Checks:
- ✅ Exactly 100 rows
- ✅ Ranks are 1–100 sequential
- ✅ Scores in [0.0, 1.0]
- ✅ Reasoning matches the required regex pattern
- ✅ No duplicate candidate IDs

---

## 🏆 Key Design Decisions

**Why Siamese Bi-Encoder over Cross-Encoder?**
Bi-encoders allow pre-computing the entire candidate embedding corpus (O(n) once), then scoring a new JD in milliseconds via dot products. Cross-encoders require O(n) inference at query time — prohibitively slow at 100K scale.

**Why Contrastive Fine-tuning over Zero-Shot?**
Off-the-shelf sentence transformers optimize for general semantic similarity. Fine-tuning on domain-specific labels (weighted by actual recruiter-relevant features) aligns the model to the specific meaning of "good fit for an AI/ML role" — not just textual similarity.

**Why TF-IDF as a Fallback?**
Zero crashes. The pipeline degrades gracefully. If the GPU model fails to load, TF-IDF still produces meaningful cosine similarities based on keyword overlap — ensuring the ranking always runs.

**Why Hard Multipliers for Fraud?**
Soft penalties allow fraudulent profiles to still appear in the shortlist. Setting the multiplier to 0.0 guarantees they are eliminated regardless of how high their semantic score is — protecting recruiters from wasting time on fake profiles.

---

## 👥 Team

**Neurobyte**
**India-runs Hackathon 2026**
Built for the Redrob Challenge: *AI and Data Challenge* (Track 01)

---

<div align="center">

Made with ☕ and PyTorch · India Runs Hackathon 2026

</div>
