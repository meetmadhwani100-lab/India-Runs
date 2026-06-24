import { useState, useEffect, useCallback, useRef } from 'react'
import './App.css'
import { CANDIDATES, DATASET_STATS, JOB_DESCRIPTION } from './data/candidates.js'
import { scoreAndRank } from './data/jdScorer.js'
import PipelineView from './components/PipelineView.jsx'
import ScoreHistogram from './components/ScoreHistogram.jsx'

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
  const map = { top: 'Elite', strong: 'Strong', potential: 'Potential', review: 'Review' };
  return map[tag] || tag;
}

function getTagClass(tag) {
  const map = { top: 'tag-top', strong: 'tag-strong', potential: 'tag-potential', review: 'tag-review' };
  return map[tag] || '';
}

function getBarColor(score) {
  if (score >= 85) return 'linear-gradient(90deg, #059669, #34D399)';
  if (score >= 70) return 'linear-gradient(90deg, #0A66C2, #3385D6)';
  if (score >= 55) return 'linear-gradient(90deg, #D97706, #FBBF24)';
  return 'linear-gradient(90deg, #C2410C, #FB923C)';
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

function CandidateCard({ candidate, isSelected, onClick, prevRank }) {
  const [animated, setAnimated] = useState(false);
  const overall = getOverallScore(candidate.scores);
  const rankDelta = prevRank != null ? prevRank - candidate.rank : 0; // positive = moved up

  useEffect(() => {
    const t = setTimeout(() => setAnimated(true), 80 + candidate.rank * 20);
    return () => clearTimeout(t);
  }, [candidate.rank]);

  return (
    <div
      className={`candidate-card ${candidate.rank === 1 ? 'top-ranked' : ''} ${isSelected ? 'selected' : ''}`}
      onClick={onClick}
      style={{ cursor: 'pointer' }}
      role="button"
      aria-selected={isSelected}
      tabIndex={0}
      onKeyDown={e => e.key === 'Enter' && onClick()}
    >
      <div className="flex items-center gap-3">
        <div className="rank-number-wrap">
          <div className="rank-number">#{candidate.rank}</div>
          {rankDelta !== 0 && (
            <div className={`rank-delta ${rankDelta > 0 ? 'rank-up' : 'rank-down'}`}>
              {rankDelta > 0 ? `▲${rankDelta}` : `▼${Math.abs(rankDelta)}`}
            </div>
          )}
        </div>
        <div className={`avatar avatar-${candidate.avatarVariant}`}>
          {candidate.initials}
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-primary font-600 candidate-id">{candidate.id}</p>
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

      <div className="card-meta mt-2">
        <span className="meta-chip-sm">{candidate.exp} exp</span>
        <span className="meta-chip-sm">{candidate.coreSkillsCount} AI skills</span>
        <span className="meta-chip-sm">Response: {(candidate.responseRate * 100).toFixed(0)}%</span>
      </div>

      <div className="flex flex-wrap gap-1 mt-2">
        {candidate.skills.slice(0, 5).map(s => (
          <SkillBadge key={s.name} name={s.name} type={s.type} />
        ))}
      </div>
    </div>
  );
}

function CandidateDetail({ candidate, onShortlist, shortlisted }) {
  const [animated, setAnimated] = useState(false);
  const overall = getOverallScore(candidate.scores);

  useEffect(() => {
    setAnimated(false);
    const t = setTimeout(() => setAnimated(true), 100);
    return () => clearTimeout(t);
  }, [candidate.id]);

  if (!candidate) return null;

  // Parse reasoning for display
  const isShortlisted = shortlisted.includes(candidate.id);

  return (
    <div className="detail-panel">
      <div className="detail-header">
        <div className="flex items-center gap-4">
          <div className={`avatar avatar-${candidate.avatarVariant} avatar-lg`}>
            {candidate.initials}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="rank-badge-lg">#{candidate.rank}</span>
              <span className={`tag ${getTagClass(candidate.tag)}`}>{getTagLabel(candidate.tag)}</span>
            </div>
            <h3 className="candidate-title-lg mt-1">{candidate.id}</h3>
            <p className="text-secondary">{candidate.role}</p>
            <div className="flex flex-wrap gap-2 mt-2">
              <span className="meta-chip">{candidate.exp} experience</span>
              <span className="meta-chip">{candidate.coreSkillsCount} AI core skills</span>
              <span className="meta-chip">Response: {(candidate.responseRate * 100).toFixed(0)}%</span>
            </div>
          </div>
        </div>
        <div className="overall-score-circle">
          <div className="score-ring" style={{
            background: overall >= 85
              ? 'conic-gradient(#059669 0deg, #34D399 ' + (overall * 3.6) + 'deg, #E5E7EB ' + (overall * 3.6) + 'deg)'
              : overall >= 70
              ? 'conic-gradient(#0A66C2 0deg, #3385D6 ' + (overall * 3.6) + 'deg, #E5E7EB ' + (overall * 3.6) + 'deg)'
              : 'conic-gradient(#D97706 0deg, #FBBF24 ' + (overall * 3.6) + 'deg, #E5E7EB ' + (overall * 3.6) + 'deg)',
          }}>
            <div className="score-ring-inner">
              <span className="score-number">{overall}</span>
              <span className="score-unit">%</span>
            </div>
          </div>
          <p className="text-muted text-xs" style={{ textAlign: 'center', marginTop: 6 }}>Overall Score</p>
        </div>
      </div>

      <hr className="divider" />

      {/* AI Reasoning */}
      <div className="detail-section">
        <h4 className="section-title">AI Reasoning</h4>
        <div className="reasoning-box">
          <span className="reasoning-icon">🤖</span>
          <p className="reasoning-text">{candidate.summary}</p>
        </div>
        <div className="raw-score-row">
          <span className="raw-score-label">Raw ML Score</span>
          <div className="raw-score-bar-wrap">
            <div className="raw-score-bar" style={{
              width: animated ? `${candidate.rawScore * 100}%` : '0%',
              background: getBarColor(candidate.rawScore * 100),
              transition: 'width 1.2s cubic-bezier(0.4,0,0.2,1)',
            }} />
          </div>
          <span className="raw-score-val">{(candidate.rawScore * 100).toFixed(1)}%</span>
        </div>
      </div>

      <hr className="divider" />

      <div className="detail-section">
        <h4 className="section-title">Score Breakdown</h4>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          <ScoreBar label="Semantic fit" value={candidate.scores.semantic} animated={animated} />
          <ScoreBar label="Skill match" value={candidate.scores.skills} animated={animated} />
          <ScoreBar label="Signal / Reach" value={candidate.scores.signal} animated={animated} />
        </div>
      </div>

      <hr className="divider" />

      <div className="detail-section">
        <h4 className="section-title">Skills vs JD</h4>
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
        <button
          className={`btn ${isShortlisted ? 'btn-shortlisted' : 'btn-primary'}`}
          id={`shortlist-${candidate.id}`}
          onClick={() => onShortlist(candidate.id)}
        >
          {isShortlisted ? '✓ In Shortlist' : 'Move to Shortlist'}
        </button>
        <button className="btn btn-ghost" id={`contact-${candidate.id}`}>
          Send a Message
        </button>
        <button className="btn btn-ghost" id={`notes-${candidate.id}`}>
          Add a Note
        </button>
      </div>
    </div>
  );
}

// ── Stats Strip ───────────────────────────────────────────────────────────────

function ProofBar({ rankedCandidates, jd, lastScoredJD }) {
  const top = rankedCandidates[0];
  const topScore = top ? Math.round(top.rawScore * 100) : 0;
  const shortlisted = rankedCandidates.filter(c => c.tag === 'top' || c.tag === 'strong').length;
  const avgScore = rankedCandidates.length
    ? Math.round(rankedCandidates.reduce((a, c) => a + c.rawScore, 0) / rankedCandidates.length * 100)
    : 0;
  const jdChanged = jd.trim() !== lastScoredJD.trim();

  const stats = [
    {
      number: `${topScore}%`,
      label: 'Top Candidate Score',
      detail: top
        ? `${top.id} — ${top.role} — ranked #1 with a score of ${(top.rawScore * 100).toFixed(1)}%.`
        : 'No candidates scored yet.',
    },
    {
      number: `${shortlisted}`,
      label: 'Elite + Strong Candidates',
      detail: `Out of ${rankedCandidates.length} ranked candidates, ${shortlisted} crossed the quality threshold (score ≥ 75%) for immediate consideration.`,
    },
    {
      number: `${avgScore}%`,
      label: 'Average Match Score',
      detail: jdChanged
        ? '⚡ JD has changed — click "Score Candidates" to re-rank against the new job description.'
        : 'Hybrid scoring: 45% semantic NLP + 20% core skills + 10% AI relevance + 25% logistical signals.',
    },
  ];

  return (
    <div className="proof-bar">
      {stats.map((s, i) => (
        <div key={i} className={`proof-item ${i === 2 && jdChanged ? 'proof-item-alert' : ''}`}>
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
  // rankedCandidates is the live, re-scored list — starts from ML pipeline output
  const [rankedCandidates, setRankedCandidates] = useState(CANDIDATES);
  // Track previous ranks so we can show rank-change deltas on cards
  const prevRanksRef = useRef(Object.fromEntries(CANDIDATES.map(c => [c.id, c.rank])));
  const [selectedId, setSelectedId] = useState(CANDIDATES[0].id);
  const [sortBy, setSortBy] = useState('rank');
  const [filterTag, setFilterTag] = useState('all');
  const [rankLimit, setRankLimit] = useState(100);
  const [searchQuery, setSearchQuery] = useState('');
  const [darkMode, setDarkMode] = useState(true);
  const [showPipeline, setShowPipeline] = useState(false);
  const [shortlisted, setShortlisted] = useState([]);
  const [lastScoredJD, setLastScoredJD] = useState(JOB_DESCRIPTION);

  const selectedCandidate = rankedCandidates.find(c => c.id === selectedId);

  // Dark mode effect
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', darkMode ? 'dark' : 'light');
  }, [darkMode]);

  const filtered = rankedCandidates
    .filter(c => rankLimit === 100 ? true : c.rank <= rankLimit)
    .filter(c => filterTag === 'all' || c.tag === filterTag)
    .filter(c => {
      if (!searchQuery.trim()) return true;
      const q = searchQuery.toLowerCase();
      return c.id.toLowerCase().includes(q) || c.role.toLowerCase().includes(q);
    })
    .sort((a, b) => {
      if (sortBy === 'semantic') return b.scores.semantic - a.scores.semantic;
      if (sortBy === 'skills') return b.scores.skills - a.scores.skills;
      if (sortBy === 'overall') return getOverallScore(b.scores) - getOverallScore(a.scores);
      return a.rank - b.rank; // default: rank
    });

  function handleAnalyze() {
    if (!jd.trim()) return;
    setIsAnalyzing(true);
    setAnalyzed(false);

    // Snapshot current ranks for delta display
    prevRanksRef.current = Object.fromEntries(rankedCandidates.map(c => [c.id, c.rank]));

    // Run scoring in a timeout so spinner renders first
    setTimeout(() => {
      const newRanking = scoreAndRank(CANDIDATES, jd);
      setRankedCandidates(newRanking);
      // Keep selected candidate if still in list, else pick new #1
      setSelectedId(prev =>
        newRanking.find(c => c.id === prev) ? prev : newRanking[0].id
      );
      setLastScoredJD(jd);
      setIsAnalyzing(false);
      setAnalyzed(true);

      // Sync the new ranking to submission.csv via our Vite plugin
      fetch('/api/save-submission', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ candidates: newRanking })
      }).catch(err => console.error("Failed to sync submission.csv", err));
    }, 600);
  }

  const handleShortlist = useCallback((id) => {
    setShortlisted(prev =>
      prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
    );
  }, []);

  // Export shortlist as CSV
  function handleExport() {
    const rows = CANDIDATES.filter(c => shortlisted.includes(c.id));
    if (rows.length === 0) return;
    const csv = [
      'candidate_id,rank,role,score,reasoning',
      ...rows.map(c => `${c.id},${c.rank},"${c.role}",${c.rawScore.toFixed(4)},"${c.summary}"`)
    ].join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = 'shortlisted_candidates.csv';
    a.click(); URL.revokeObjectURL(url);
  }

  return (
    <div className="app-root">
      {/* ── Navbar ── */}
      <header className="navbar">
        <div className="navbar-brand">
          <div className="brand-icon">R</div>
          <span className="brand-name">Redrob <span className="brand-ai">AI</span></span>
        </div>
        <div className="navbar-center">
          <span className="nav-tag">India Runs Hackathon 2026</span>
        </div>
        <div className="navbar-right">
          <button
            className="pipeline-toggle-btn"
            id="pipeline-toggle"
            onClick={() => setShowPipeline(v => !v)}
            title="Toggle AI Pipeline View"
          >
            {showPipeline ? '← Hide Pipeline' : '⚙ AI Pipeline'}
          </button>
          {shortlisted.length > 0 && (
            <button className="export-btn" id="export-btn" onClick={handleExport} title="Export shortlist as CSV">
              ↓ Export ({shortlisted.length})
            </button>
          )}
          <button
            className="theme-toggle"
            id="theme-toggle"
            onClick={() => setDarkMode(v => !v)}
            title={darkMode ? 'Switch to light mode' : 'Switch to dark mode'}
            aria-label="Toggle dark mode"
          >
            {darkMode ? '☀' : '🌙'}
          </button>
          <div className="status-bar">
            <span className="pulse-dot" />
            <span>Live</span>
          </div>
          <div className="avatar avatar-indigo" style={{ width: 32, height: 32, fontSize: 12 }}>ME</div>
        </div>
      </header>

      {/* ── Stats Bar ── */}
      <ProofBar rankedCandidates={rankedCandidates} jd={jd} lastScoredJD={lastScoredJD} />

      {/* ── Pipeline View (collapsible) ── */}
      {showPipeline && (
        <div className="pipeline-wrapper">
          <PipelineView />
        </div>
      )}

      <div className="page-layout">
        {/* ── Left Sidebar: JD Input + Filters ── */}
        <aside className="sidebar">
          <div className="sidebar-section">
            <h4 className="section-title">Job Description</h4>
            <p className="text-muted text-sm mb-2">Paste or edit the JD to re-score candidates against it.</p>
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
                <><span className="spinner" /> Scoring candidates…</>
              ) : (
                <>⚡ Score Candidates</>
              )}
            </button>
          </div>

          {/* Search */}
          <div className="sidebar-section">
            <h4 className="section-title">Search</h4>
            <input
              id="search-input"
              className="search-input"
              type="text"
              placeholder="Candidate ID or role…"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
            />
          </div>

          {/* Rank Limit */}
          <div className="sidebar-section">
            <h4 className="section-title">Show Top N</h4>
            <div className="filter-pills">
              {[10, 25, 50, 100].map(n => (
                <button
                  key={n}
                  id={`limit-${n}`}
                  className={`pill ${rankLimit === n ? 'pill-active' : ''}`}
                  onClick={() => setRankLimit(n)}
                >
                  Top {n}
                </button>
              ))}
            </div>
          </div>

          {/* Filter by tier */}
          <div className="sidebar-section">
            <h4 className="section-title">Filter by Tier</h4>
            <div className="filter-pills">
              {['all', 'top', 'strong', 'potential', 'review'].map(t => (
                <button
                  key={t}
                  id={`filter-${t}`}
                  className={`pill ${filterTag === t ? 'pill-active' : ''}`}
                  onClick={() => setFilterTag(t)}
                >
                  {t === 'all' ? 'All' : getTagLabel(t)}
                </button>
              ))}
            </div>
          </div>

          {/* Sort */}
          <div className="sidebar-section">
            <h4 className="section-title">Sort By</h4>
            <div className="filter-pills">
              {[
                { key: 'rank', label: 'ML Rank' },
                { key: 'overall', label: 'Overall' },
                { key: 'semantic', label: 'Semantic' },
                { key: 'skills', label: 'Skills' },
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

          {/* Histogram */}
          <div className="sidebar-section">
            <ScoreHistogram candidates={rankedCandidates} />
          </div>
        </aside>

        {/* ── Center: Candidate List ── */}
        <main className="candidates-panel">
          <div className="panel-header">
            <div>
              <h2 className="panel-title">Candidates</h2>
              <p className="text-muted text-sm">
                {filtered.length} result{filtered.length !== 1 ? 's' : ''} ·{' '}
                sorted by {sortBy === 'rank' ? 'ML rank' : sortBy === 'overall' ? 'overall score' : sortBy === 'semantic' ? 'semantic match' : 'skill match'}
                {searchQuery ? ` · "${searchQuery}"` : ''}
              </p>
            </div>
            <div className="flex gap-2 items-center">
              {shortlisted.length > 0 && (
                <span className="shortlist-count">{shortlisted.length} shortlisted</span>
              )}
              {isAnalyzing && (
                <div className="analyzing-badge">
                  <span className="spinner spinner-sm" />
                  <span>Updating scores…</span>
                </div>
              )}
            </div>
          </div>

          <div className="candidates-list">
            {filtered.length === 0 ? (
              <div className="empty-state">
                <div className="empty-icon">🔍</div>
                <p>No candidates match your current filters.</p>
              </div>
            ) : (
              filtered.map(c => (
                <CandidateCard
                  key={c.id}
                  candidate={c}
                  isSelected={selectedId === c.id}
                  onClick={() => setSelectedId(c.id)}
                  prevRank={prevRanksRef.current[c.id]}
                />
              ))
            )}
          </div>
        </main>

        {/* ── Right: Detail Panel ── */}
        <aside className="detail-sidebar">
          {selectedCandidate && (
            <CandidateDetail
              candidate={selectedCandidate}
              onShortlist={handleShortlist}
              shortlisted={shortlisted}
            />
          )}
        </aside>
      </div>
    </div>
  );
}
