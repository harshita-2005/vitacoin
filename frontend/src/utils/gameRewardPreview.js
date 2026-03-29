/**
 * Preview of base coin/XP rewards per difficulty — must match backend
 * `services/gameRewardService.js` → calculateRewards() baseReward step.
 *
 * Final coins still depend on score %, perfect bonus, time bonus (med/hard), etc.
 */

// Admin baseCoins = Easy tier; Medium/Hard coin/XP bases scale with this ladder (sync backend gameRewardService).
export const DEFAULT_DIFFICULTY_REWARDS = {
  easy: { coins: 10, xp: 20, minScore: 35 },
  medium: { coins: 20, xp: 30, minScore: 50 },
  hard: { coins: 30, xp: 40, minScore: 75 }
};

/** @param {object|null|undefined} gameDoc */
export function resolveMinScoreToEarn(difficulty, gameDoc) {
  const dr = DEFAULT_DIFFICULTY_REWARDS[difficulty];
  if (!dr) return 0;
  const ms = gameDoc?.gameConfig?.minScores;
  if (ms && typeof ms === 'object') {
    const v = ms[difficulty];
    // 0 = unset / legacy placeholder → tier default
    if (typeof v === 'number' && v > 0 && v <= 100) {
      return v;
    }
  }
  if (
    gameDoc?.gameConfig &&
    typeof gameDoc.gameConfig.minScore === 'number' &&
    gameDoc.gameConfig.minScore > 0 &&
    gameDoc.gameConfig.minScore <= 100
  ) {
    return gameDoc.gameConfig.minScore;
  }
  return dr.minScore;
}

/**
 * @param {string} difficulty - easy | medium | hard
 * @param {object|null|undefined} gameDoc - Game from API (rewards, gameConfig)
 * @returns {{ coins: number, xp: number, minScore: number }}
 */
export function getRewardBaseForDifficulty(difficulty, gameDoc) {
  const dr = DEFAULT_DIFFICULTY_REWARDS[difficulty];
  if (!dr) {
    return { coins: 0, xp: 0, minScore: 0 };
  }

  const adminCoins =
    gameDoc?.rewards && typeof gameDoc.rewards.baseCoins === 'number' && gameDoc.rewards.baseCoins >= 0
      ? gameDoc.rewards.baseCoins
      : null;

  const easyCoinRef = Math.max(1, DEFAULT_DIFFICULTY_REWARDS.easy.coins);
  const coinBase =
    adminCoins !== null
      ? Math.max(0, Math.round(adminCoins * (dr.coins / easyCoinRef)))
      : dr.coins;

  const easyXpDefault = DEFAULT_DIFFICULTY_REWARDS.easy.xp;
  const adminXpEasy =
    gameDoc?.rewards &&
    typeof gameDoc.rewards.baseXp === 'number' &&
    !Number.isNaN(gameDoc.rewards.baseXp) &&
    gameDoc.rewards.baseXp >= 0
      ? gameDoc.rewards.baseXp
      : null;

  let xpBase;
  if (adminXpEasy !== null) {
    xpBase = Math.max(0, Math.round(adminXpEasy * (dr.xp / Math.max(1, easyXpDefault))));
  } else if (adminCoins !== null) {
    xpBase = Math.max(1, Math.round(dr.xp * (coinBase / Math.max(1, dr.coins))));
  } else {
    xpBase = dr.xp;
  }

  const minScore = resolveMinScoreToEarn(difficulty, gameDoc);

  return { coins: coinBase, xp: xpBase, minScore };
}

/** @param {object|null|undefined} gameDoc */
export function getAllRewardBases(gameDoc) {
  return {
    easy: getRewardBaseForDifficulty('easy', gameDoc),
    medium: getRewardBaseForDifficulty('medium', gameDoc),
    hard: getRewardBaseForDifficulty('hard', gameDoc)
  };
}

export function formatRewardSummary(coins, xp) {
  return `${coins} coins + ${xp} XP`;
}

/**
 * Styles for difficulty chips (GamePlayer header bar).
 * @param {object|null|undefined} gameDoc
 */
export function getDifficultyBarEntries(gameDoc) {
  const bases = getAllRewardBases(gameDoc);
  return {
    easy: {
      label: 'Easy',
      reward: formatRewardSummary(bases.easy.coins, bases.easy.xp),
      bg: 'bg-green-50',
      border: 'border-green-300',
      text: 'text-green-700',
      minScore: bases.easy.minScore
    },
    medium: {
      label: 'Medium',
      reward: formatRewardSummary(bases.medium.coins, bases.medium.xp),
      bg: 'bg-yellow-50',
      border: 'border-yellow-300',
      text: 'text-yellow-700',
      minScore: bases.medium.minScore
    },
    hard: {
      label: 'Hard',
      reward: formatRewardSummary(bases.hard.coins, bases.hard.xp),
      bg: 'bg-red-50',
      border: 'border-red-300',
      text: 'text-red-700',
      minScore: bases.hard.minScore
    }
  };
}
