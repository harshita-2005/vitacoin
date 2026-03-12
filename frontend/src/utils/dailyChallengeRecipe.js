/**
 * Date-based daily challenge recipe. Same seed = same recipe for all users that day.
 * Total 7 tasks across 3 rounds (mix of games).
 */

const GAME_SLUGS = [
  "math-quiz",
  "puzzle-solver",
  "word-scramble",
  "reaction-time", // Code Breaker
  "memory-game"    // Verbal IQ (slug can be memory-game or verbal-iq)
];

const GAME_NAMES = {
  "math-quiz": "Math Quiz",
  "puzzle-solver": "Pattern IQ",
  "word-scramble": "Word Shuffle",
  "reaction-time": "Code Breaker",
  "memory-game": "Verbal IQ",
  "verbal-iq": "Verbal IQ"
};

/** e.g. "20250305" */
export function getDailySeed() {
  return new Date().toISOString().slice(0, 10).replace(/-/g, "");
}

/** Seeded shuffle using a simple PRNG (same seed = same order). */
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

/** Split 7 tasks across 3 rounds. Each round = one game with 1–3 tasks. */
function buildRecipe(seed) {
  const shuffled = seededShuffle(GAME_SLUGS, seed);
  const counts = [2, 2, 3]; // e.g. round1: 2, round2: 2, round3: 3 = 7
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

/**
 * Get today's 7-task challenge recipe (3 rounds).
 * @returns {{ rounds: Array<{ slug: string, name: string, count: number }>, totalTasks: number }}
 */
export function getDailyChallengeRecipe() {
  const seed = getDailySeed();
  const rounds = buildRecipe(seed);
  const totalTasks = rounds.reduce((sum, r) => sum + r.count, 0);
  return { rounds, totalTasks, seed };
}
