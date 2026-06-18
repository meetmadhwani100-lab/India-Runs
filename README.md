# Dark Intelligence Theme
**AI Recruiter — India Runs Hackathon 2026**

---

## Files included

| File | Use |
|------|-----|
| `theme.css` | Drop into any HTML/Vite/React project |
| `tailwind.config.js` | Replace your existing config if using Tailwind |
| `tokens.js` | Import in React for inline styles, charts, logic |

---

## Quick start (plain HTML)

```html
<link rel="stylesheet" href="theme.css" />

<div class="candidate-card top-ranked">
  <div class="flex items-center gap-3">
    <div class="avatar avatar-indigo">PS</div>
    <div class="flex-1 min-w-0">
      <p class="text-primary font-600">Priya Sharma</p>
      <p class="text-secondary text-sm truncate">ML Engineer @ Flipkart</p>
    </div>
    <span class="rank-chip">#1</span>
    <span class="score-badge score-badge-high">94%</span>
  </div>

  <div class="score-row mt-3">
    <span class="score-label">Semantic fit</span>
    <div class="score-track">
      <div class="score-fill score-fill-primary" style="width: 94%"></div>
    </div>
    <span class="score-val">94%</span>
  </div>

  <div class="flex flex-wrap gap-1 mt-2">
    <span class="badge badge-match">Python</span>
    <span class="badge badge-match">PyTorch</span>
    <span class="badge badge-partial">FastAPI</span>
    <span class="badge badge-miss">Java</span>
  </div>
</div>
```

---

## Quick start (React + Tailwind)

```jsx
import { getScoreBadgeStyle, getBarColor, avatarColors } from './tokens';

function CandidateCard({ candidate, rank }) {
  const avatar = avatarColors[rank % 4];
  const overall = Math.round(
    candidate.scores.semantic * 0.45 +
    candidate.scores.skills   * 0.35 +
    candidate.scores.signal   * 0.20
  );

  return (
    <div className="bg-bg-surface border border-subtle rounded-lg p-5
                    hover:border-default transition-all animate-slideIn">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-full flex items-center justify-center
                        text-sm font-semibold"
             style={avatar}>
          {candidate.initials}
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-text-primary font-medium">{candidate.name}</p>
          <p className="text-text-secondary text-sm truncate">{candidate.role}</p>
        </div>
        <span className="text-xs text-text-muted border border-subtle
                         rounded-full px-2 py-0.5 font-mono">
          #{rank + 1}
        </span>
        <span className="text-xs font-semibold px-2.5 py-1 rounded-full"
              style={getScoreBadgeStyle(overall)}>
          {overall}%
        </span>
      </div>
    </div>
  );
}
```

---

## Animate score bars on mount

```js
// Trigger bar animation after card appears
useEffect(() => {
  setTimeout(() => setAnimated(true), 100);
}, []);

// In JSX:
<div className="h-1 rounded-full bg-bg-elevated overflow-hidden">
  <div style={{
    width: animated ? `${score}%` : '0%',
    background: getBarColor(score),
    transition: 'width 0.8s cubic-bezier(0.4,0,0.2,1)',
    height: '100%',
    borderRadius: '999px',
  }} />
</div>
```

---

## Colour rules at a glance

| Situation | Use |
|-----------|-----|
| Score ≥ 85% | `success-400` (#1D9E75) |
| Score 70–84% | `warning-400` (#EF9F27) |
| Score < 70% | `text.muted` (#565C78) |
| Skill matched | `badge-match` — teal tint |
| Skill partial | `badge-partial` — amber tint |
| Skill missing | `badge-miss` — neutral |
| Primary action button | `primary-600` (#534AB7) |
| Card border default | `rgba(127,119,221,0.12)` |
| Card border hover | `rgba(127,119,221,0.22)` |
| Top ranked card | `rgba(127,119,221,0.4)` |
