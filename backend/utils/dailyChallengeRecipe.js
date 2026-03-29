/**
 * Same algorithm as frontend/src/utils/dailyChallengeRecipe.js (UTC calendar date seed).
 * Used for admin overview so server and client show the same "today's" mix.
 */

const GAME_SLUGS = [
  'math-quiz',
  'puzzle-solver',
  'word-scramble',
  'reaction-time',
  'memory-game'
];

const GAME_NAMES = {
  'math-quiz': 'Math Quiz',
  'puzzle-solver': 'Pattern IQ',
  'word-scramble': 'Word Shuffle',
  'reaction-time': 'Code Breaker',
  'memory-game': 'Verbal IQ',
  'verbal-iq': 'Verbal IQ'
};

function getDailySeed() {
  return new Date().toISOString().slice(0, 10).replace(/-/g, '');
}

function seededShuffle(arr, seed) {
  const a = [...arr];
  let s = parseInt(seed, 10) || 0;
  const next = () => {
    s = (s * 1103515245 + 12345) & 0x7fffffff;
    return s / 0x7fffffff;
  };
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(next() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function buildRecipe(seed) {
  const shuffled = seededShuffle(GAME_SLUGS, seed);
  const counts = [2, 2, 3];
  const recipe = [];
  for (let i = 0; i < 3; i++) {
    const slug = shuffled[i];
    recipe.push({
      slug,
      name: GAME_NAMES[slug] || slug,
      count: counts[i]
    });
  }
  return recipe;
}

function getDailyChallengeRecipe() {
  const seed = getDailySeed();
  const rounds = buildRecipe(seed);
  const totalTasks = rounds.reduce((sum, r) => sum + r.count, 0);
  const dateIso = new Date().toISOString().slice(0, 10);
  return { rounds, totalTasks, seed, dateIso };
}

module.exports = {
  getDailyChallengeRecipe,
  getDailySeed
};
