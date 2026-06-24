import { useMemo } from 'react';

const BUCKETS = [
  { label: '55–60%', min: 0.55, max: 0.60 },
  { label: '60–65%', min: 0.60, max: 0.65 },
  { label: '65–70%', min: 0.65, max: 0.70 },
  { label: '70–75%', min: 0.70, max: 0.75 },
  { label: '75–80%', min: 0.75, max: 0.80 },
  { label: '80–85%', min: 0.80, max: 0.85 },
  { label: '85–90%', min: 0.85, max: 0.90 },
  { label: '90–100%', min: 0.90, max: 1.01 },
];

function getBucketColor(min) {
  if (min >= 0.90) return 'linear-gradient(180deg, #059669, #34D399)';
  if (min >= 0.80) return 'linear-gradient(180deg, #0A66C2, #3385D6)';
  if (min >= 0.70) return 'linear-gradient(180deg, #7C3AED, #A78BFA)';
  if (min >= 0.60) return 'linear-gradient(180deg, #D97706, #FBBF24)';
  return 'linear-gradient(180deg, #6B7280, #9CA3AF)';
}

export default function ScoreHistogram({ candidates }) {
  const buckets = useMemo(() => {
    return BUCKETS.map(b => ({
      ...b,
      count: candidates.filter(c => c.rawScore >= b.min && c.rawScore < b.max).length,
    }));
  }, [candidates]);

  const maxCount = Math.max(...buckets.map(b => b.count), 1);

  return (
    <div className="histogram-section" aria-label="Score distribution histogram">
      <div className="histogram-header">
        <h4 className="section-title">Score Distribution</h4>
        <span className="histogram-total">{candidates.length} candidates ranked</span>
      </div>
      <div className="histogram-bars">
        {buckets.map(b => {
          const heightPct = Math.max(4, (b.count / maxCount) * 100);
          return (
            <div key={b.label} className="histogram-col" title={`${b.label}: ${b.count} candidates`}>
              <div className="histogram-count">{b.count > 0 ? b.count : ''}</div>
              <div className="histogram-bar-wrap">
                <div
                  className="histogram-bar"
                  style={{
                    height: `${heightPct}%`,
                    background: getBucketColor(b.min),
                  }}
                />
              </div>
              <div className="histogram-label">{b.label}</div>
            </div>
          );
        })}
      </div>
      <div className="histogram-legend">
        <span className="hist-leg-item"><span style={{ background: '#34D399', width: 8, height: 8, borderRadius: 2, display: 'inline-block', marginRight: 4 }} />Elite (90%+)</span>
        <span className="hist-leg-item"><span style={{ background: '#3385D6', width: 8, height: 8, borderRadius: 2, display: 'inline-block', marginRight: 4 }} />Strong (80–90%)</span>
        <span className="hist-leg-item"><span style={{ background: '#A78BFA', width: 8, height: 8, borderRadius: 2, display: 'inline-block', marginRight: 4 }} />Potential (70–80%)</span>
        <span className="hist-leg-item"><span style={{ background: '#FBBF24', width: 8, height: 8, borderRadius: 2, display: 'inline-block', marginRight: 4 }} />Review (60–70%)</span>
      </div>
    </div>
  );
}
