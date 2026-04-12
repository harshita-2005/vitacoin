/**
 * Add XP to a user document and bump userLevel when crossing 100-XP thresholds (same rule as games/daily).
 * @returns {number} XP actually added (0 if xpDelta <= 0)
 */
function addXpAndLevel(user, xpDelta) {
  const n = Math.floor(Number(xpDelta) || 0);
  if (n <= 0) return 0;
  user.experiencePoints = (user.experiencePoints || 0) + n;
  const newLevel = Math.floor(user.experiencePoints / 100) + 1;
  if (newLevel > (user.userLevel || 1)) user.userLevel = newLevel;
  return n;
}

module.exports = { addXpAndLevel };
