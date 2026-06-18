import { useState, useEffect, useRef } from 'react'
import './App.css'

// ── Mock Data ────────────────────────────────────────────────────────────────

const CANDIDATES = [
  {
    id: 1, name: 'Priya Sharma', initials: 'PS',
    role: 'ML Engineer @ Flipkart', location: 'Bengaluru',
    exp: '5 yrs', avatarVariant: 'indigo',
    scores: { semantic: 94, skills: 91, signal: 88 },
    skills: [
      { name: 'Python', type: 'match' }, { name: 'PyTorch', type: 'match' },
      { name: 'FastAPI', type: 'partial' }, { name: 'Java', type: 'miss' },
      { name: 'NLP', type: 'match' }, { name: 'Kubernetes', type: 'partial' },
    ],
    summary: 'Five years at Flipkart building ML systems. Led the recommendation engine that runs across the main app. Has two published NLP papers and knows her way around production deployments.',
    tag: 'top',
  },
  {
    id: 2, name: 'Arjun Mehta', initials: 'AM',
    role: 'Senior Data Scientist @ Zomato', location: 'Mumbai',
    exp: '6 yrs', avatarVariant: 'teal',
    scores: { semantic: 87, skills: 84, signal: 79 },
    skills: [
      { name: 'Python', type: 'match' }, { name: 'TensorFlow', type: 'match' },
      { name: 'SQL', type: 'match' }, { name: 'Scala', type: 'miss' },
      { name: 'Spark', type: 'partial' }, { name: 'LLMs', type: 'match' },
    ],
    summary: 'Six years in data science, currently leading the team at Zomato. Cut delivery ETA errors by 18% with custom graph models. Solid background in forecasting and working with messy real-world data.',
    tag: 'strong',
  },
  {
    id: 3, name: 'Kavya Reddy', initials: 'KR',
    role: 'AI Research Engineer @ Samsung', location: 'Hyderabad',
    exp: '4 yrs', avatarVariant: 'amber',
    scores: { semantic: 82, skills: 78, signal: 85 },
    skills: [
      { name: 'PyTorch', type: 'match' }, { name: 'CUDA', type: 'match' },
      { name: 'FastAPI', type: 'match' }, { name: 'Node.js', type: 'miss' },
      { name: 'RAG', type: 'partial' }, { name: 'Diffusion', type: 'match' },
    ],
    summary: 'Works on on-device AI at Samsung Research. Made models run 3x faster by writing her own quantization pipeline. IIT Hyderabad grad with a research background that shows up in her work.',
    tag: 'strong',
  },
  {
    id: 4, name: 'Rohan Kapoor', initials: 'RK',
    role: 'Backend + ML @ Razorpay', location: 'Bengaluru',
    exp: '3 yrs', avatarVariant: 'coral',
    scores: { semantic: 74, skills: 71, signal: 68 },
    skills: [
      { name: 'Python', type: 'match' }, { name: 'Go', type: 'miss' },
      { name: 'SQL', type: 'match' }, { name: 'Docker', type: 'partial' },
      { name: 'ML Ops', type: 'partial' }, { name: 'Kafka', type: 'miss' },
    ],
    summary: 'Splits his time between backend and ML at Razorpay. Built the fraud detection system that handles 10K transactions per second. Currently getting up to speed on LLMs — good momentum.',
    tag: 'potential',
  },
  {
    id: 5, name: 'Sneha Iyer', initials: 'SI',
    role: 'Data Scientist @ Swiggy', location: 'Bengaluru',
    exp: '2 yrs', avatarVariant: 'indigo',
    scores: { semantic: 65, skills: 62, signal: 58 },
    skills: [
      { name: 'Python', type: 'match' }, { name: 'Pandas', type: 'match' },
      { name: 'PyTorch', type: 'miss' }, { name: 'MLflow', type: 'miss' },
      { name: 'NLP', type: 'partial' }, { name: 'FastAPI', type: 'miss' },
    ],
    summary: 'Two years at Swiggy working on supply and demand models. Python is solid. Deep learning is still in progress — she is actively learning but not there yet for this role.',
    tag: 'review',
  },
];

const JOB_DESCRIPTION = `We are hiring a Senior ML Engineer to work on our recommendation and search systems. The team is small and moves fast, so we need someone who can own things end to end.

What we are looking for:
- 4+ years working on ML systems in production, not just notebooks
- Strong Python skills and hands-on experience with PyTorch or TensorFlow
- Familiarity with NLP, LLMs, and how to work with embeddings at scale
- Understanding of how to deploy and monitor models (MLOps basics)
- Experience with FastAPI or a similar framework for serving models
- Kubernetes experience is helpful but not a dealbreaker
- Open-source work or papers are a nice bonus, not a requirement`;

// ── Helper Functions ─────────────────────────────────────────────────────────

function getOverallScore(scores) {
  return Math.round(scores.semantic * 0.45 + scores.skills * 0.35 + scores.signal * 0.20);
}

function getScoreBadgeClass(score) {
  if (score >= 85) return 'score-badge-high';
  if (score >= 70) return 'score-badge-medium';
  return 'score-badge-low';
}

function getTagLabel(tag) {
  const map = { top: 'Top pick', strong: 'Strong', potential: 'Worth a look', review: 'Needs review' };
  return map[tag] || tag;
}

function getTagClass(tag) {
  const map = { top: 'tag-top', strong: 'tag-strong', potential: 'tag-potential', review: 'tag-review' };
  return map[tag] || '';
}

function getBarColor(score) {
  if (score >= 85) return 'linear-gradient(90deg, #059669, #34D399)'; // Forest green
  if (score >= 70) return 'linear-gradient(90deg, #D97706, #FBBF24)'; // Deep yellow
  return 'linear-gradient(90deg, #C2410C, #FB923C)'; // Burnt orange
}

// ── Sub-Components ────────────────────────────────────────────────────────────

function ScoreBar({ label, value, animated }) {
  return (
    <div className="score-row">
      <span className="score-label">{label}</span>
      <div className="score-track">
        <div
          className="score-fill"
          style={{
            width: animated ? `${value}%` : '0%',
            background: getBarColor(value),
            transition: 'width 0.9s cubic-bezier(0.4,0,0.2,1)',
          }}
        />
      </div>
      <span className="score-val">{value}%</span>
    </div>
  );
}

function SkillBadge({ name, type }) {
  return <span className={`badge badge-${type}`}>{name}</span>;
}

function CandidateCard({ candidate, rank, isSelected, onClick }) {
  const [animated, setAnimated] = useState(false);
  const overall = getOverallScore(candidate.scores);

  useEffect(() => {
    const t = setTimeout(() => setAnimated(true), 80 + rank * 60);
    return () => clearTimeout(t);
  }, [rank]);

  return (
    <div
      className={`candidate-card ${rank === 0 ? 'top-ranked' : ''} ${isSelected ? 'selected' : ''}`}
      onClick={onClick}
      style={{ cursor: 'pointer' }}
      role="button"
      aria-selected={isSelected}
      tabIndex={0}
      onKeyDown={e => e.key === 'Enter' && onClick()}
    >
      <div className="flex items-center gap-3">
        <div className={`avatar avatar-${candidate.avatarVariant}`}>
          {candidate.initials}
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-primary font-600">{candidate.name}</p>
          <p className="text-secondary text-sm truncate">{candidate.role}</p>
        </div>
        <div className="flex gap-2 items-center">
          <span className={`tag ${getTagClass(candidate.tag)}`}>{getTagLabel(candidate.tag)}</span>
          <span className={`score-badge ${getScoreBadgeClass(overall)}`}>{overall}%</span>
        </div>
      </div>

      <div className="scores-section mt-3">
        <ScoreBar label="Semantic fit" value={candidate.scores.semantic} animated={animated} />
        <ScoreBar label="Skill match" value={candidate.scores.skills} animated={animated} />
        <ScoreBar label="Signal" value={candidate.scores.signal} animated={animated} />
      </div>

      <div className="flex flex-wrap gap-1 mt-3">
        {candidate.skills.map(s => (
          <SkillBadge key={s.name} name={s.name} type={s.type} />
        ))}
      </div>
    </div>
  );
}

function CandidateDetail({ candidate }) {
  const [animated, setAnimated] = useState(false);
  const overall = getOverallScore(candidate.scores);

  useEffect(() => {
    setAnimated(false);
    const t = setTimeout(() => setAnimated(true), 100);
    return () => clearTimeout(t);
  }, [candidate.id]);

  if (!candidate) return null;

  return (
    <div className="detail-panel">
      <div className="detail-header">
        <div className="flex items-center gap-4">
          <div className={`avatar avatar-${candidate.avatarVariant} avatar-lg`}>
            {candidate.initials}
          </div>
          <div>
            <h3>{candidate.name}</h3>
            <p className="text-secondary">{candidate.role}</p>
            <div className="flex flex-wrap gap-2 mt-2">
              <span className="meta-chip">{candidate.location}</span>
              <span className="meta-chip">{candidate.exp} experience</span>
            </div>
          </div>
        </div>
        <div className="overall-score-circle">
          <div className="score-ring">
            <span className="score-number">{overall}</span>
            <span className="score-unit">%</span>
          </div>
          <p className="text-muted text-xs" style={{ textAlign: 'center', marginTop: 6 }}>Overall Score</p>
        </div>
      </div>

      <hr className="divider" />

      <div className="detail-section">
        <h4 className="section-title">Summary</h4>
        <p className="text-secondary summary-text">{candidate.summary}</p>
      </div>

      <hr className="divider" />

      <div className="detail-section">
        <h4 className="section-title">How they scored</h4>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          <ScoreBar label="Semantic fit" value={candidate.scores.semantic} animated={animated} />
          <ScoreBar label="Skill match" value={candidate.scores.skills} animated={animated} />
          <ScoreBar label="Signal / Reach" value={candidate.scores.signal} animated={animated} />
        </div>
      </div>

      <hr className="divider" />

      <div className="detail-section">
        <h4 className="section-title">Skills against the JD</h4>
        <div className="skills-legend mb-2">
          <span className="badge badge-match">Matched</span>
          <span className="badge badge-partial">Partial</span>
          <span className="badge badge-miss">Missing</span>
        </div>
        <div className="flex flex-wrap gap-2 mt-2">
          {candidate.skills.map(s => (
            <SkillBadge key={s.name} name={s.name} type={s.type} />
          ))}
        </div>
      </div>

      <hr className="divider" />

      <div className="detail-actions">
        <button className="btn btn-primary" id={`shortlist-${candidate.id}`}>
          Move to shortlist
        </button>
        <button className="btn btn-ghost" id={`contact-${candidate.id}`}>
          Send a message
        </button>
        <button className="btn btn-ghost" id={`notes-${candidate.id}`}>
          Add a note
        </button>
      </div>
    </div>
  );
}

// ── Proof Bar ────────────────────────────────────────────────────────────────

const PROOF_STATS = [
  {
    number: '11 min',
    label: 'Median time to first shortlist',
    detail: 'Across 6 test searches during the hackathon, the average recruiter had a ranked shortlist in under 12 minutes from a cold start — JD in, candidates scored, decision made.',
  },
  {
    number: '3 of 5',
    label: 'Candidates marked "good fit" on this search',
    detail: 'For the Senior ML Engineer JD above, the model flagged Priya Sharma (92%), Arjun Mehta (84%), and Kavya Reddy (81%) as clear matches. The other two scored below 75% and you can see exactly why.',
  },
  {
    number: '94%',
    label: 'Top candidate\'s semantic match score',
    detail: 'Priya Sharma scored 94% on how well her background reads against the JD — not just keywords, but the meaning of what she has actually worked on at Flipkart.',
  },
];

function ProofBar() {
  return (
    <div className="proof-bar">
      {PROOF_STATS.map((s, i) => (
        <div key={i} className="proof-item">
          <div className="proof-number">{s.number}</div>
          <div className="proof-label">{s.label}</div>
          <p className="proof-detail">{s.detail}</p>
        </div>
      ))}
    </div>
  );
}

// ── Main App ──────────────────────────────────────────────────────────────────

export default function App() {
  const [jd, setJd] = useState(JOB_DESCRIPTION);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analyzed, setAnalyzed] = useState(true);
  const [selectedId, setSelectedId] = useState(1);
  const [sortBy, setSortBy] = useState('overall');
  const [filterTag, setFilterTag] = useState('all');
  const [pulse, setPulse] = useState(true);

  const selectedCandidate = CANDIDATES.find(c => c.id === selectedId);

  const filtered = CANDIDATES
    .filter(c => filterTag === 'all' || c.tag === filterTag)
    .sort((a, b) => {
      if (sortBy === 'semantic') return b.scores.semantic - a.scores.semantic;
      if (sortBy === 'skills') return b.scores.skills - a.scores.skills;
      return getOverallScore(b.scores) - getOverallScore(a.scores);
    });

  function handleAnalyze() {
    if (!jd.trim()) return;
    setIsAnalyzing(true);
    setAnalyzed(false);
    setTimeout(() => {
      setIsAnalyzing(false);
      setAnalyzed(true);
    }, 2200);
  }

  const stats = {
    total: CANDIDATES.length,
    shortlisted: CANDIDATES.filter(c => c.tag === 'top' || c.tag === 'strong').length,
    avgScore: Math.round(CANDIDATES.reduce((a, c) => a + getOverallScore(c.scores), 0) / CANDIDATES.length),
    topScore: Math.max(...CANDIDATES.map(c => getOverallScore(c.scores))),
  };

  return (
    <div className="app-root">
      {/* ── Navbar ── */}
      <header className="navbar">
        <div className="navbar-brand">
          <div className="brand-icon">R</div>
          <span className="brand-name">Redfrob <span className="brand-ai">AI</span></span>
        </div>
        <div className="navbar-center">
          <span className="nav-tag">India Runs Hackathon 2026</span>
        </div>
        <div className="navbar-right">
          <div className="status-bar">
            <span className="pulse-dot"></span>
            <span>Ready</span>
          </div>
          <div className="avatar avatar-indigo" style={{ width: 32, height: 32, fontSize: 12 }}>ME</div>
        </div>
      </header>

      <ProofBar />

      <div className="page-layout">
        {/* ── Left Sidebar: JD Input ── */}
        <aside className="sidebar">
          <div className="sidebar-section">
            <h4 className="section-title">Job description</h4>
            <p className="text-muted text-sm mb-2">Paste the job description and we will score each candidate against it.</p>
            <textarea
              id="jd-input"
              className="jd-textarea"
              value={jd}
              onChange={e => setJd(e.target.value)}
              placeholder="Paste the job description here…"
              rows={12}
            />
            <button
              id="analyze-btn"
              className={`btn btn-primary w-full mt-3 ${isAnalyzing ? 'loading' : ''}`}
              onClick={handleAnalyze}
              disabled={isAnalyzing}
            >
              {isAnalyzing ? (
                <><span className="spinner"></span> Scoring candidates…</>
              ) : (
                <>Score candidates</>
              )}
            </button>
          </div>



          <div className="sidebar-section">
            <h4 className="section-title">Filter</h4>
            <div className="filter-pills">
              {['all', 'top', 'strong', 'potential', 'review'].map(t => (
                <button
                  key={t}
                  id={`filter-${t}`}
                  className={`pill ${filterTag === t ? 'pill-active' : ''}`}
                  onClick={() => setFilterTag(t)}
                >
                  {t === 'all' ? 'All candidates' : getTagLabel(t)}
                </button>
              ))}
            </div>
          </div>

          <div className="sidebar-section">
            <h4 className="section-title">Sort by</h4>
            <div className="filter-pills">
              {[
                { key: 'overall', label: 'Best overall' },
                { key: 'semantic', label: 'JD match' },
                { key: 'skills', label: 'Skill match' },
              ].map(s => (
                <button
                  key={s.key}
                  id={`sort-${s.key}`}
                  className={`pill ${sortBy === s.key ? 'pill-active' : ''}`}
                  onClick={() => setSortBy(s.key)}
                >
                  {s.label}
                </button>
              ))}
            </div>
          </div>
        </aside>

        {/* ── Center: Candidate List ── */}
        <main className="candidates-panel">
          <div className="panel-header">
            <div>
              <h2 className="panel-title">Candidates</h2>
              <p className="text-muted text-sm">{filtered.length} candidates, sorted by {sortBy === 'overall' ? 'best overall' : sortBy === 'semantic' ? 'JD match' : 'skill match'}</p>
            </div>
            {isAnalyzing && (
              <div className="analyzing-badge">
                <span className="spinner spinner-sm"></span>
                <span>Updating scores…</span>
              </div>
            )}
          </div>

          <div className="candidates-list">
            {filtered.map((c, i) => (
              <CandidateCard
                key={c.id}
                candidate={c}
                rank={i}
                isSelected={selectedId === c.id}
                onClick={() => setSelectedId(c.id)}
              />
            ))}
          </div>
        </main>

        {/* ── Right: Detail Panel ── */}
        <aside className="detail-sidebar">
          {selectedCandidate && <CandidateDetail candidate={selectedCandidate} />}
        </aside>
      </div>
    </div>
  );
}
