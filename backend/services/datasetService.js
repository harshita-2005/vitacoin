const fs = require('fs');
const path = require('path');
const https = require('https');

const DATA_DIR = path.join(__dirname, '..', 'data');
const VERBAL_PATH = path.join(DATA_DIR, 'dynamicWordBank.json');
const CODEBREAKER_PATH = path.join(DATA_DIR, 'codeBreakerWords.json');

function ensureDataDir() {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }
}

function readJsonSafe(filePath, defaultValue = []) {
  ensureDataDir();
  if (!fs.existsSync(filePath)) return defaultValue;
  try {
    const raw = fs.readFileSync(filePath, 'utf8');
    const data = JSON.parse(raw);
    return Array.isArray(data) ? data : defaultValue;
  } catch (e) {
    console.error('datasetService read error:', e.message);
    return defaultValue;
  }
}

function writeJson(filePath, data) {
  ensureDataDir();
  fs.writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf8');
}

/** Fetch JSON from URL (GET). */
function fetchJson(url) {
  return new Promise((resolve, reject) => {
    https.get(url, (res) => {
      let body = '';
      res.on('data', (chunk) => { body += chunk; });
      res.on('end', () => {
        try {
          resolve(JSON.parse(body));
        } catch (e) {
          reject(e);
        }
      });
    }).on('error', reject);
  });
}

/** Seed words to request synonyms/antonyms from Datamuse. */
const VERBAL_SEED_WORDS = [
  'happy', 'sad', 'big', 'small', 'fast', 'slow', 'good', 'bad', 'hot', 'cold',
  'love', 'hate', 'brave', 'cowardly', 'bright', 'dim', 'calm', 'anxious',
  'clever', 'dull', 'generous', 'stingy', 'honest', 'deceitful', 'kind', 'cruel',
  'peaceful', 'violent', 'polite', 'rude', 'proud', 'humble', 'rich', 'poor'
];

function pickRandom(arr, n) {
  const shuffled = [...arr].sort(() => Math.random() - 0.5);
  return shuffled.slice(0, Math.min(n, arr.length));
}

/**
 * Fetch synonyms and antonyms from Datamuse API for a word.
 * Returns { word, difficulty, synonyms, antonyms } or null.
 */
async function fetchVerbalEntry(word) {
  const base = 'https://api.datamuse.com';
  try {
    const [synRes, antRes] = await Promise.all([
      fetchJson(`${base}/words?rel_syn=${encodeURIComponent(word)}&max=5`),
      fetchJson(`${base}/words?rel_ant=${encodeURIComponent(word)}&max=5`)
    ]);
    const synonyms = (synRes || []).map((w) => w.word).filter(Boolean).slice(0, 4);
    const antonyms = (antRes || []).map((w) => w.word).filter(Boolean).slice(0, 4);
    if (synonyms.length < 2 && antonyms.length < 2) return null;
    const difficulty = word.length <= 4 ? 'easy' : word.length <= 6 ? 'medium' : 'hard';
    return {
      word: word.toLowerCase(),
      difficulty,
      synonyms: synonyms.length >= 2 ? synonyms : [word, word],
      antonyms: antonyms.length >= 2 ? antonyms : [word, word]
    };
  } catch (e) {
    console.error('Datamuse fetch error for', word, e.message);
    return null;
  }
}

/**
 * Add new verbal (synonym/antonym) entries by fetching from Datamuse.
 * @param {number} count - Number of new words to try to add
 * @returns {{ added: number, total: number }}
 */
async function addVerbalFromApi(count = 10) {
  const existing = readJsonSafe(VERBAL_PATH);
  const existingWords = new Set(existing.map((e) => e.word.toLowerCase()));

  const toFetch = pickRandom(
    VERBAL_SEED_WORDS.filter((w) => !existingWords.has(w.toLowerCase())),
    count
  );
  if (toFetch.length === 0) {
    return { added: 0, total: existing.length };
  }

  const newEntries = [];
  for (const word of toFetch) {
    const entry = await fetchVerbalEntry(word);
    if (entry && entry.synonyms?.length >= 2 && entry.antonyms?.length >= 2) {
      if (!existingWords.has(entry.word)) {
        newEntries.push(entry);
        existingWords.add(entry.word);
      }
    }
  }

  const merged = [...existing, ...newEntries];
  writeJson(VERBAL_PATH, merged);
  return { added: newEntries.length, total: merged.length };
}

/**
 * Get all dynamic verbal entries (for frontend merge).
 */
function getVerbalDynamic() {
  return readJsonSafe(VERBAL_PATH);
}

/**
 * Add words for Code Breaker (simple word list for puzzle generation).
 * Uses Datamuse "sounds like" or random words to expand.
 */
async function addCodeBreakerFromApi(count = 15) {
  const existing = readJsonSafe(CODEBREAKER_PATH);
  const existingSet = new Set(existing.map((w) => (typeof w === 'string' ? w : w.word || w).toUpperCase()));

  const seedWords = ['code', 'word', 'key', 'data', 'byte', 'file', 'link', 'path', 'loop', 'node', 'tree', 'list', 'sort', 'find', 'hash'];
  const toFetch = pickRandom(seedWords, Math.min(5, count));
  const base = 'https://api.datamuse.com';
  const newWords = [];

  for (const word of toFetch) {
    try {
      const res = await fetchJson(`${base}/words?rel_jja=${encodeURIComponent(word)}&max=5`);
      const words = (res || []).map((w) => (w.word || '').toUpperCase()).filter((w) => w.length >= 3 && w.length <= 8);
      for (const w of words) {
        if (!existingSet.has(w)) {
          newWords.push(w);
          existingSet.add(w);
        }
      }
      const sl = await fetchJson(`${base}/words?sl=${encodeURIComponent(word)}&max=5`);
      const slWords = (sl || []).map((w) => (w.word || '').toUpperCase()).filter((w) => w.length >= 3 && w.length <= 8);
      for (const w of slWords) {
        if (!existingSet.has(w)) {
          newWords.push(w);
          existingSet.add(w);
        }
      }
    } catch (e) {
      console.error('CodeBreaker fetch error', e.message);
    }
  }

  const merged = [...existing, ...newWords];
  writeJson(CODEBREAKER_PATH, merged);
  return { added: newWords.length, total: merged.length };
}

function getCodeBreakerDynamic() {
  return readJsonSafe(CODEBREAKER_PATH);
}

module.exports = {
  addVerbalFromApi,
  getVerbalDynamic,
  addCodeBreakerFromApi,
  getCodeBreakerDynamic,
  readJsonSafe,
  writeJson,
  VERBAL_PATH,
  CODEBREAKER_PATH
};
