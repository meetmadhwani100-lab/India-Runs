import { useState } from 'react';

const PIPELINE_STAGES = [
  {
    num: '01',
    icon: '🗄️',
    title: 'Data Synthesis',
    subtitle: 'preprocess.py',
    desc: 'Parses 100K+ candidate profiles from JSONL, engineers 20+ structured features: skill scores, career signals, honeypot detection flags, and availability metrics.',
    color: 'indigo',
    stats: ['100K candidates', '20+ features', 'Fraud detection'],
  },
  {
    num: '02',
    icon: '🤖',
    title: 'Contrastive Fine-Tuning',
    subtitle: 'train.py',
    desc: 'Fine-tunes a Siamese Transformer (bge-base / MiniLM) using CosineSimilarityLoss against continuous 0.0–1.0 fitness labels. Learns to embed JD and profiles into a shared semantic space.',
    color: 'violet',
    stats: ['Bi-Encoder model', 'CosineSimilarityLoss', '80/20 train split'],
  },
  {
    num: '03',
    icon: '⚡',
    title: 'Semantic Retrieval',
    subtitle: 'run_inference.py',
    desc: 'Encodes entire candidate corpus into a dense vector matrix. Computes rapid cosine similarity between the JD embedding and all candidate embeddings via matrix dot products.',
    color: 'teal',
    stats: ['Matrix dot products', 'TF-IDF fallback', 'Sub-second retrieval'],
  },
  {
    num: '04',
    icon: '🏆',
    title: 'Hybrid Ranking',
    subtitle: 'rank.py',
    desc: 'Combines 45% NLP semantic score with 55% engineered features (skills, seniority, availability, location, salary fit). Applies hard filters for honeypots and soft multipliers for logistics.',
    color: 'amber',
    stats: ['45% NLP + 55% features', 'Multiplier filters', 'Top-100 shortlist'],
  },
];

const colorMap = {
  indigo: { bg: 'rgba(10,102,194,0.08)', border: 'rgba(10,102,194,0.25)', accent: '#0A66C2', num: '#0A66C2' },
  violet: { bg: 'rgba(109,40,217,0.08)', border: 'rgba(109,40,217,0.25)', accent: '#7C3AED', num: '#7C3AED' },
  teal:   { bg: 'rgba(29,158,117,0.08)', border: 'rgba(29,158,117,0.25)', accent: '#1D9E75', num: '#1D9E75' },
  amber:  { bg: 'rgba(239,159,39,0.08)', border: 'rgba(239,159,39,0.3)',  accent: '#EF9F27', num: '#D97706' },
};

export default function PipelineView() {
  const [hovered, setHovered] = useState(null);

  return (
    <section className="pipeline-section" aria-label="AI Pipeline Overview">
      <div className="pipeline-header">
        <div className="pipeline-badge">HOW IT WORKS</div>
        <h2 className="pipeline-title">4-Stage AI Ranking Engine</h2>
        <p className="pipeline-sub">
          From raw candidate data to an expertly ranked shortlist — powered by Transformer semantics and domain-engineered signals.
        </p>
      </div>

      <div className="pipeline-grid">
        {PIPELINE_STAGES.map((stage, i) => {
          const c = colorMap[stage.color];
          const isHovered = hovered === i;
          return (
            <div
              key={stage.num}
              className="pipeline-card"
              style={{
                background: isHovered ? c.bg : 'var(--bg-surface)',
                borderColor: isHovered ? c.border : 'var(--border-subtle)',
                transform: isHovered ? 'translateY(-4px)' : 'translateY(0)',
              }}
              onMouseEnter={() => setHovered(i)}
              onMouseLeave={() => setHovered(null)}
            >
              {/* Connector line */}
              {i < PIPELINE_STAGES.length - 1 && (
                <div className="pipeline-connector" aria-hidden="true">›</div>
              )}

              <div className="pipeline-num" style={{ color: c.num }}>{stage.num}</div>
              <div className="pipeline-icon">{stage.icon}</div>
              <div className="pipeline-card-title">{stage.title}</div>
              <div className="pipeline-card-sub">{stage.subtitle}</div>
              <p className="pipeline-card-desc">{stage.desc}</p>

              <div className="pipeline-stats">
                {stage.stats.map(s => (
                  <span
                    key={s}
                    className="pipeline-stat-chip"
                    style={{ borderColor: c.border, color: c.accent, background: c.bg }}
                  >
                    {s}
                  </span>
                ))}
              </div>
            </div>
          );
        })}
      </div>

      {/* Formula bar */}
      <div className="formula-bar">
        <span className="formula-label">Final Score =</span>
        <span className="formula-part formula-nlp">0.45 × NLP Match</span>
        <span className="formula-op">+</span>
        <span className="formula-part formula-skills">0.20 × Core Skills</span>
        <span className="formula-op">+</span>
        <span className="formula-part formula-relevance">0.10 × AI Relevance</span>
        <span className="formula-op">+</span>
        <span className="formula-part formula-bonus">Bonus & Filters</span>
      </div>
    </section>
  );
}
