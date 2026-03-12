const KEY_COMPLETED = "dailyChallengeCompletedDate";
const KEY_STREAK = "dailyChallengeStreak";
const KEY_PROGRESS = "dailyChallengeProgress";

function todayString() {
  return new Date().toISOString().slice(0, 10);
}

export function getDailyChallengeCompletedDate() {
  try {
    return localStorage.getItem(KEY_COMPLETED) || null;
  } catch {
    return null;
  }
}

export function getDailyChallengeStreak() {
  try {
    const n = localStorage.getItem(KEY_STREAK);
    return n ? parseInt(n, 10) : 0;
  } catch {
    return 0;
  }
}

export function isDailyChallengeCompletedToday() {
  const completed = getDailyChallengeCompletedDate();
  return completed === todayString();
}

/** Call when user completes the full daily challenge. Updates streak and sets completed to today. */
export function setDailyChallengeCompleted() {
  const today = todayString();
  const lastCompleted = getDailyChallengeCompletedDate();
  let streak = getDailyChallengeStreak();

  if (lastCompleted === today) {
    return; // already marked
  }

  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  const yesterdayStr = yesterday.toISOString().slice(0, 10);

  if (lastCompleted === yesterdayStr) {
    streak += 1;
  } else if (lastCompleted !== today) {
    streak = 1;
  }

  try {
    localStorage.setItem(KEY_COMPLETED, today);
    localStorage.setItem(KEY_STREAK, String(streak));
    clearDailyChallengeProgress();
  } catch (e) {
    console.warn("localStorage set failed", e);
  }
}

/** In-progress state: { date, roundIndex, tasksCompleted, roundScores } */
export function getDailyChallengeProgress() {
  if (isDailyChallengeCompletedToday()) return null;
  try {
    const raw = localStorage.getItem(KEY_PROGRESS);
    if (!raw) return null;
    const data = JSON.parse(raw);
    if (!data || data.date !== todayString()) return null;
    return {
      date: data.date,
      roundIndex: Math.max(0, parseInt(data.roundIndex, 10) || 0),
      tasksCompleted: Math.max(0, parseInt(data.tasksCompleted, 10) || 0),
      roundScores: Array.isArray(data.roundScores) ? data.roundScores : [],
      totalCorrect: Math.max(0, parseInt(data.totalCorrect, 10) || 0),
    };
  } catch {
    return null;
  }
}

export function setDailyChallengeProgress({ roundIndex, tasksCompleted, roundScores, totalCorrect }) {
  try {
    const payload = {
      date: todayString(),
      roundIndex,
      tasksCompleted,
      roundScores: Array.isArray(roundScores) ? roundScores : [],
      totalCorrect: totalCorrect ?? 0,
    };
    localStorage.setItem(KEY_PROGRESS, JSON.stringify(payload));
  } catch (e) {
    console.warn("localStorage set failed", e);
  }
}

export function clearDailyChallengeProgress() {
  try {
    localStorage.removeItem(KEY_PROGRESS);
  } catch (e) {
    console.warn("localStorage remove failed", e);
  }
}
