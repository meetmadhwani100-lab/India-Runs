// ─────────────────────────────────────────────────────────────────────────────
// jdScorer.js — Client-side Job Description scoring engine
//
// Mimics the Python pipeline's TF-IDF fallback + engineered-feature blend.
// When the user edits the JD and clicks "Score Candidates", this engine:
//   1. Extracts a weighted keyword bag from the JD text
//   2. Scores each candidate's skills/title against that keyword bag  (semantic proxy)
//   3. Blends with static signals (core skills count, response rate, experience)
//   4. Re-ranks and re-badges candidates
// ─────────────────────────────────────────────────────────────────────────────

// ── Skill / keyword synonym map ───────────────────────────────────────────────
// Each key is a canonical term; the array lists surface forms found in JD text
const SYNONYM_MAP = {
  'python':               ['python', 'py'],
  'pytorch':              ['pytorch', 'torch'],
  'tensorflow':           ['tensorflow', 'tf'],
  'nlp':                  ['nlp', 'natural language', 'language model', 'text'],
  'llm':                  ['llm', 'llms', 'large language', 'gpt', 'gemini', 'claude'],
  'embeddings':           ['embedding', 'embeddings', 'dense vector', 'vector representation'],
  'vector-database':      ['vector database', 'vector db', 'vectordb', 'faiss', 'pinecone', 'weaviate', 'qdrant', 'chroma', 'milvus'],
  'information-retrieval':['information retrieval', 'retrieval', 'ir system', 'semantic search'],
  'transformers':         ['transformer', 'transformers', 'attention', 'bert', 'roberta', 'sentence transformer'],
  'sentence-transformers':['sentence transformer', 'sbert', 'bi-encoder', 'bi encoder'],
  'fine-tuning':          ['fine-tun', 'fine tuning', 'finetuning', 'lora', 'qlora', 'peft', 'rlhf'],
  'rag':                  ['rag', 'retrieval augmented', 'retrieval-augmented'],
  'ranking':              ['ranking', 'learn to rank', 'learning to rank', 'ltr', 'ndcg'],
  'mlops':                ['mlops', 'ml ops', 'mlflow', 'model monitoring', 'model deployment'],
  'kubernetes':           ['kubernetes', 'k8s', 'docker', 'container'],
  'fastapi':              ['fastapi', 'fast api', 'flask', 'api'],
  'spark':                ['spark', 'pyspark', 'hadoop'],
  'recommendation':       ['recommendation', 'recsys', 'collaborative filtering'],
  'deep-learning':        ['deep learning', 'neural network', 'cnn', 'rnn', 'lstm'],
  'sql':                  ['sql', 'postgres', 'mysql', 'database'],
  'git':                  ['git', 'github', 'version control'],
  'production':           ['production', 'prod', 'deployment', 'deploy', 'ship', 'scale'],
  'research':             ['research', 'paper', 'publication', 'arxiv', 'phd', 'ms'],
  'ab-testing':           ['a/b test', 'ab test', 'experimentation', 'experiment'],
  'evaluation':           ['evaluation', 'benchmark', 'ndcg', 'map@', 'precision@'],
  'data-pipeline':        ['data pipeline', 'etl', 'airflow', 'kafka'],
  'cloud':                ['aws', 'gcp', 'azure', 'cloud'],
  'go':                   [' go ', 'golang'],
  'java':                 ['java', 'jvm', 'scala'],
  'xgboost':              ['xgboost', 'lightgbm', 'gbm', 'gradient boost'],
  'opencv':               ['opencv', 'computer vision', 'cv engineer'],
};

// Skills associated with each candidate title — used for semantic matching
const TITLE_SKILL_TAGS = {
  'Senior Machine Learning Engineer': ['python','pytorch','mlops','production','embeddings','deep-learning'],
  'NLP Engineer':                     ['nlp','python','transformers','embeddings','information-retrieval'],
  'Applied ML Engineer':              ['python','tensorflow','embeddings','mlops','production'],
  'Machine Learning Engineer':        ['python','pytorch','deep-learning','mlops'],
  'Recommendation Systems Engineer':  ['recommendation','python','embeddings','information-retrieval'],
  'Senior Data Scientist':            ['python','sql','ab-testing','deep-learning','evaluation'],
  'AI Engineer':                      ['llm','rag','python','fine-tuning','production'],
  'AI Research Engineer':             ['python','pytorch','research','transformers','fine-tuning'],
  'Search Engineer':                  ['information-retrieval','vector-database','python','ranking'],
  'Data Scientist':                   ['python','sql','deep-learning','evaluation'],
  'Lead AI Engineer':                 ['llm','vector-database','production','kubernetes','rag'],
  'AI Specialist':                    ['nlp','llm','python','fine-tuning'],
  'Senior Software Engineer (ML)':    ['python','production','sql','kubernetes'],
  'ML Engineer':                      ['python','tensorflow','sql'],
  'Junior ML Engineer':               ['python','deep-learning'],
  'Computer Vision Engineer':         ['opencv','python','pytorch'],
  'Backend Engineer':                 ['python','sql','cloud'],
  'Data Engineer':                    ['spark','sql','data-pipeline'],
  'Senior Data Engineer':             ['spark','kafka','data-pipeline','cloud'],
  'Senior AI Engineer':               ['llm','rag','vector-database','fine-tuning'],
  'Senior Software Engineer':         ['python','sql','production'],
  'Data Analyst':                     ['python','sql'],
  'Software Engineer':                ['python','sql'],
};

// ── Tokenize & extract weighted terms from JD ──────────────────────────────
export function parseJD(jdText) {
  const text = jdText.toLowerCase();
  const matchedTerms = {}; // canonical → weight

  for (const [canonical, synonyms] of Object.entries(SYNONYM_MAP)) {
    for (const syn of synonyms) {
      if (text.includes(syn)) {
        // Weight by position: terms in first 200 chars are more important (title/headline)
        const pos = text.indexOf(syn);
        const posWeight = pos < 200 ? 1.3 : 1.0;
        // Frequency boost
        const occurrences = (text.match(new RegExp(syn, 'g')) || []).length;
        const freqWeight = Math.min(1.5, 1.0 + occurrences * 0.15);
        matchedTerms[canonical] = Math.max(
          matchedTerms[canonical] || 0,
          posWeight * freqWeight
        );
        break;
      }
    }
  }

  // Also extract raw numeric experience requirements  e.g. "5+ years"
  const expMatch = text.match(/(\d+)\+?\s*(?:years?|yrs?)\s+(?:of\s+)?(?:experience|exp)/);
  const requiredExp = expMatch ? parseInt(expMatch[1]) : 5;

  return { terms: matchedTerms, requiredExp };
}

// ── Score a candidate's static skill list against parsed JD terms ───────────
function scoreSkillsAgainstJD(candidateSkills, jdTerms) {
  if (Object.keys(jdTerms).length === 0) return 0.5;

  let matched = 0;
  let total = 0;

  for (const [term, weight] of Object.entries(jdTerms)) {
    total += weight;
    // Check candidate skills array
    const skill = candidateSkills.find(s => {
      const sName = s.name.toLowerCase();
      return (
        sName.includes(term.replace('-', ' ')) ||
        sName.includes(term) ||
        term.includes(sName)
      );
    });
    if (skill) {
      const typeBonus = skill.type === 'match' ? 1.0 : skill.type === 'partial' ? 0.5 : 0;
      matched += weight * typeBonus;
    }
  }

  return total > 0 ? matched / total : 0.5;
}

// ── Score a candidate's role title against parsed JD terms ─────────────────
function scoreTitleAgainstJD(role, jdTerms) {
  if (Object.keys(jdTerms).length === 0) return 0.5;

  // Find matching title in our taxonomy
  let titleTags = [];
  for (const [title, tags] of Object.entries(TITLE_SKILL_TAGS)) {
    if (role.includes(title) || title.includes(role.split(' ').slice(-2).join(' '))) {
      titleTags = tags;
      break;
    }
  }
  // Fuzzy: if no exact match, use partial
  if (titleTags.length === 0) {
    const roleLower = role.toLowerCase();
    if (roleLower.includes('nlp')) titleTags = TITLE_SKILL_TAGS['NLP Engineer'];
    else if (roleLower.includes('ml') || roleLower.includes('machine learning')) titleTags = TITLE_SKILL_TAGS['Machine Learning Engineer'];
    else if (roleLower.includes('ai')) titleTags = TITLE_SKILL_TAGS['AI Engineer'];
    else if (roleLower.includes('data scientist')) titleTags = TITLE_SKILL_TAGS['Data Scientist'];
    else if (roleLower.includes('recommendation')) titleTags = TITLE_SKILL_TAGS['Recommendation Systems Engineer'];
    else if (roleLower.includes('search')) titleTags = TITLE_SKILL_TAGS['Search Engineer'];
    else titleTags = ['python', 'sql'];
  }

  let matched = 0;
  let total = 0;
  for (const [term, weight] of Object.entries(jdTerms)) {
    total += weight;
    if (titleTags.includes(term)) matched += weight;
  }
  return total > 0 ? matched / total : 0.3;
}

// ── Seniority fit for required experience ──────────────────────────────────
function seniorityFit(yoe, requiredExp) {
  if (yoe >= requiredExp && yoe <= requiredExp + 5) return 1.0;
  if (yoe >= requiredExp - 1 && yoe < requiredExp) return 0.8;
  if (yoe > requiredExp + 5) return 0.85;
  if (yoe >= 1 && yoe < requiredExp - 1) return Math.max(0.2, yoe / requiredExp);
  return 0.1;
}

// ── Main scoring function — returns updated candidates sorted by new score ──
export function scoreAndRank(candidates, jdText) {
  const { terms: jdTerms, requiredExp } = parseJD(jdText);
  const hasTerms = Object.keys(jdTerms).length > 0;

  const scored = candidates.map(c => {
    // 1. Semantic proxy: skill list match against JD terms (45%)
    const skillMatch = scoreSkillsAgainstJD(c.skills, jdTerms);

    // 2. Title/role semantic match (20%)
    const titleMatch = scoreTitleAgainstJD(c.role, jdTerms);

    // 3. Combined JD semantic score
    const jdSemanticScore = hasTerms
      ? (0.6 * skillMatch + 0.4 * titleMatch)
      : c.rawScore; // if JD is empty, fall back to original score

    // 4. Core skill density signal (15%)
    const coreSkillSignal = Math.min(1.0, c.coreSkillsCount / 5);

    // 5. Seniority fit (10%)
    const yoe = parseFloat(c.exp);
    const senFit = seniorityFit(isNaN(yoe) ? 5 : yoe, requiredExp);

    // 6. Engagement / platform signal (10%)
    const platformSignal = c.responseRate;

    // ── Blend ────────────────────────────────────────────────────────────────
    // 45% JD semantic, 15% core skills, 10% seniority, 10% platform, 20% original ML score
    const newRawScore = (
      0.45 * jdSemanticScore +
      0.15 * coreSkillSignal +
      0.10 * senFit +
      0.10 * platformSignal +
      0.20 * c.rawScore
    );

    // Build updated score sub-components for the bars
    const semanticPct = Math.round(Math.min(99, jdSemanticScore * 100));
    const skillsPct   = Math.round(Math.min(99, (0.6 * skillMatch + 0.4 * coreSkillSignal) * 100));
    const signalPct   = Math.round(Math.min(99, (0.5 * platformSignal + 0.3 * senFit + 0.2 * c.rawScore) * 100));

    // Recompute skill badges based on JD terms
    const updatedSkills = c.skills.map(skill => {
      const sName = skill.name.toLowerCase();
      let newType = 'miss';
      for (const term of Object.keys(jdTerms)) {
        if (sName.includes(term.replace('-', ' ')) || sName.includes(term) || term.includes(sName)) {
          newType = 'match';
          break;
        }
      }
      if (newType === 'miss') newType = skill.type; // keep partial/match if no JD signal
      return { ...skill, type: newType };
    });

    return {
      ...c,
      rawScore: newRawScore,
      scores: { semantic: semanticPct, skills: skillsPct, signal: signalPct },
      skills: updatedSkills,
    };
  });

  // Normalize rawScore to [0, 1] and assign new ranks
  const maxScore = Math.max(...scored.map(s => s.rawScore), 0.001);
  const normalized = scored
    .map(c => ({ ...c, rawScore: c.rawScore / maxScore }))
    .sort((a, b) => b.rawScore - a.rawScore)
    .map((c, i) => {
      const newTag =
        c.rawScore >= 0.90 ? 'top' :
        c.rawScore >= 0.75 ? 'strong' :
        c.rawScore >= 0.60 ? 'potential' : 'review';
      return { ...c, rank: i + 1, tag: newTag };
    });

  return normalized;
}
