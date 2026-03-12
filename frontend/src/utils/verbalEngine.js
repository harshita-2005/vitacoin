/**
 * VerbalIQ engine: unique words per question, mix of synonym/antonym/tenses/articles/verbs by difficulty.
 * Each batch uses each word at most once for synonym/antonym; grammar questions are picked without duplicate in session.
 */

import wordBank from "../data/wordBank";
import verbalQuestions from "../data/verbalQuestions";

/** Dynamic words from admin (API). Merged with default wordBank when set. */
let extendedWordBank = [];

export function setExtendedWordBank(words) {
  extendedWordBank = Array.isArray(words) ? words : [];
}

export function getExtendedWordBank() {
  return extendedWordBank;
}

const shuffle = (arr) => {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
};

const randomItem = (arr) =>
  arr[Math.floor(Math.random() * arr.length)];

const filterByDifficulty = (list, difficulty) => {
  if (!list || !list.length) return [];
  const filtered = list.filter((q) => (q.difficulty || "easy") === difficulty);
  return filtered.length > 0 ? filtered : list;
};

/** Get words from wordBank + extendedWordBank that are NOT in usedWords set. */
const getAvailableWords = (difficulty, usedWords) => {
  const base = [...wordBank, ...extendedWordBank];
  const pool = difficulty === "any"
    ? base
    : base.filter((w) => w.difficulty === difficulty);
  return pool.filter((w) => w && w.word && !usedWords.has(String(w.word).toLowerCase()));
};

/**
 * Generate one synonym or antonym question using a word not in usedWords.
 * Returns { type, question, answer, options } and the word used (so caller can add to usedWords).
 */
function generateSynonymOrAntonym({ difficulty, usedWords, forceType }) {
  const available = getAvailableWords(difficulty, usedWords);
  if (available.length === 0) return null;

  const entry = randomItem(available);
  const word = entry.word;
  const mode = forceType || (Math.random() < 0.5 ? "synonym" : "antonym");

  if (!entry.synonyms?.length || !entry.antonyms?.length) return null;

  let answer;
  let distractors;

  if (mode === "synonym") {
    answer = randomItem(entry.synonyms);
    distractors = shuffle(entry.antonyms).slice(0, 3);
    while (distractors.length < 3) {
      const c = randomItem(entry.antonyms);
      if (!distractors.includes(c)) distractors.push(c);
    }
  } else {
    answer = randomItem(entry.antonyms);
    distractors = shuffle(entry.synonyms).slice(0, 3);
    while (distractors.length < 3) {
      const c = randomItem(entry.synonyms);
      if (!distractors.includes(c)) distractors.push(c);
    }
  }

  const options = shuffle([answer, ...distractors]);

  return {
    type: mode,
    question: `Choose the ${mode} of "${word}".`,
    answer,
    options,
    _wordUsed: word.toLowerCase()
  };
}

/**
 * Pick one question from a pool (tenses/articles/verbs) by difficulty, without reusing indices in usedIndices.
 */
function pickGrammarQuestion(pool, difficulty, usedIndices) {
  const filtered = filterByDifficulty(pool, difficulty);
  const available = filtered
    .map((q, i) => ({ q, i }))
    .filter(({ i }) => !usedIndices.has(i));
  if (available.length === 0) return null;
  const { q, i } = randomItem(available);
  usedIndices.add(i);
  return {
    type: q.type || "grammar",
    question: q.question,
    answer: q.answer,
    options: shuffle([...q.options]),
    _index: i
  };
}

/**
 * Build the mix of question types for a batch. Each level gets synonym, antonym, tense, article, verb.
 * Returns array of type labels; we'll generate one question per label.
 */
function getBatchRecipe(count, difficulty) {
  const types = ["synonym", "antonym", "tense", "article", "verb"];
  const perType = Math.floor(count / types.length);
  const remainder = count % types.length;
  const recipe = [];
  types.forEach((t) => {
    for (let i = 0; i < perType; i += 1) recipe.push(t);
  });
  for (let i = 0; i < remainder; i += 1) {
    recipe.push(types[i % types.length]);
  }
  return shuffle(recipe);
}

/**
 * Generate a full batch of VerbalIQ questions:
 * - Unique word per synonym/antonym question (no same word twice).
 * - Mix of synonym, antonym, tense, article, verb by difficulty.
 * - Grammar questions (tense/article/verb) filtered by difficulty and no duplicate in batch.
 */
export function generateVerbalBatch(count, opts = {}) {
  const { difficulty = "easy" } = opts;
  const recipe = getBatchRecipe(count, difficulty);

  const usedWords = new Set();
  const usedTenseIndices = new Set();
  const usedArticleIndices = new Set();
  const usedVerbIndices = new Set();

  const tenses = verbalQuestions.tenses || [];
  const articles = verbalQuestions.articles || [];
  const verbs = verbalQuestions.verbs || [];

  const out = [];

  for (const type of recipe) {
    if (type === "synonym" || type === "antonym") {
      const q = generateSynonymOrAntonym({
        difficulty,
        usedWords,
        forceType: type
      });
      if (q) {
        usedWords.add(q._wordUsed);
        out.push({
          type: q.type,
          question: q.question,
          answer: q.answer,
          options: q.options
        });
      } else {
        // Fallback: try without forcing type so we can use any word
        const fallback = generateSynonymOrAntonym({
          difficulty: "any",
          usedWords,
          forceType: type
        });
        if (fallback) {
          usedWords.add(fallback._wordUsed);
          out.push({
            type: fallback.type,
            question: fallback.question,
            answer: fallback.answer,
            options: fallback.options
          });
        }
      }
    } else if (type === "tense" && tenses.length > 0) {
      const q = pickGrammarQuestion(tenses, difficulty, usedTenseIndices);
      if (q) out.push({ type: "tense", question: q.question, answer: q.answer, options: q.options });
    } else if (type === "article" && articles.length > 0) {
      const q = pickGrammarQuestion(articles, difficulty, usedArticleIndices);
      if (q) out.push({ type: "article", question: q.question, answer: q.answer, options: q.options });
    } else if (type === "verb" && verbs.length > 0) {
      const q = pickGrammarQuestion(verbs, difficulty, usedVerbIndices);
      if (q) out.push({ type: "verb", question: q.question, answer: q.answer, options: q.options });
    }
  }

  // If we have gaps (e.g. not enough unique words), fill with grammar or mixed
  while (out.length < count) {
    const fillTypes = ["tense", "article", "verb"].filter((t) => {
      if (t === "tense") return tenses.length > 0;
      if (t === "article") return articles.length > 0;
      return verbs.length > 0;
    });
    if (fillTypes.length === 0) break;
    const fillType = randomItem(fillTypes);
    const pool = fillType === "tense" ? tenses : fillType === "article" ? articles : verbs;
    const usedSet = fillType === "tense" ? usedTenseIndices : fillType === "article" ? usedArticleIndices : usedVerbIndices;
    const q = pickGrammarQuestion(pool, difficulty, usedSet);
    if (q) out.push({ type: fillType, question: q.question, answer: q.answer, options: q.options });
    else break;
  }

  return shuffle(out);
}

/**
 * Single question (e.g. for preview). Prefer using generateVerbalBatch for games so words stay unique per session.
 */
export function generateVerbalQuestion(opts = {}) {
  const batch = generateVerbalBatch(1, opts);
  return batch[0] || null;
}
