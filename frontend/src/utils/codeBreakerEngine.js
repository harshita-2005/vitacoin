/**
 * CodeBreaker engine: dynamic coding–decoding puzzles from alphabet positions and word transformations.
 * Generates unique puzzles so users rarely see repeats.
 */

const LETTERS = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
const A_CODE = "A".charCodeAt(0);

// Short words for encoding (3–5 letters) – enough combinations for thousands of puzzles
const WORD_LIST = [
  "CAT", "DOG", "BAT", "ROD", "ACE", "BED", "BAG", "CAP", "MAP", "TAP",
  "BIG", "BIT", "BOX", "BOY", "BUS", "CUB", "CUP", "CUT", "DAY", "DOT",
  "EAR", "EGG", "EYE", "FAN", "FAR", "FAT", "FIT", "FIX", "FLY", "FOX",
  "GAP", "GEL", "GEM", "GET", "GUM", "GUN", "HAT", "HEN", "HIT", "HOT",
  "ICE", "INK", "JAM", "JAR", "JET", "JOB", "JOG", "KEY", "KIT", "LAB",
  "LAD", "LAP", "LAW", "LAY", "LEG", "LET", "LID", "LIP", "LOG", "LOT",
  "MAD", "MAN", "MAP", "MAT", "MAY", "MEN", "MET", "MID", "MIX", "MOB",
  "NAB", "NAG", "NAP", "NET", "NOD", "NOR", "NOT", "NUB", "NUN", "NUT",
  "OAK", "OAR", "OAT", "ODD", "ODE", "OFF", "OFT", "OIL", "OLD", "ONE",
  "ORB", "ORC", "ORE", "OUR", "OUT", "OWE", "OWL", "OWN", "PAD", "PAL",
  "PAN", "PAP", "PAR", "PAT", "PAW", "PAY", "PEA", "PEG", "PEN", "PEP",
  "PER", "PET", "PEW", "PIE", "PIG", "PIN", "PIT", "PLY", "PLOT", "PLOW",
  "RAG", "RAM", "RAN", "RAP", "RAT", "RAW", "RAY", "RED", "REF", "REM",
  "REP", "REV", "RIB", "RID", "RIG", "RIM", "RIP", "ROB", "ROD", "ROE",
  "ROT", "ROW", "RUB", "RUG", "RUM", "RUN", "RUT", "SAD", "SAG", "SAP",
  "SAT", "SAW", "SAX", "SAY", "SEA", "SET", "SEW", "SEX", "SHE", "SHY",
  "SIN", "SIP", "SIR", "SIS", "SIT", "SIX", "SKI", "SKY", "SLY", "SOB",
  "SOD", "SON", "SOP", "SOT", "SOW", "SOX", "SOY", "SPA", "SPY", "STY",
  "TAB", "TAD", "TAG", "TAN", "TAP", "TAR", "TAT", "TAX", "TEA", "TEN",
  "THE", "THY", "TIC", "TIE", "TIN", "TIP", "TOE", "TON", "TOO", "TOP",
  "TOT", "TOW", "TOY", "TRY", "TUB", "TUG", "TUX", "TWO", "URN", "USE",
  "VAN", "VAT", "VET", "VIA", "VIE", "VOW", "WAD", "WAG", "WAR", "WAS",
  "WAX", "WAY", "WEB", "WED", "WEE", "WET", "WHO", "WHY", "WIG", "WIN",
  "WIT", "WOE", "WOK", "WON", "WOO", "WOW", "YAK", "YAM", "YAP", "YAW",
  "YEA", "YEN", "YEW", "YIN", "YOW", "YUM", "YUP", "ZAP", "ZEN", "ZIP",
  "ZIT", "ZOO", "ABLE", "BEAD", "BEAR", "BEAT", "BEEN", "BEER", "BEET",
  "BELL", "BELT", "BEND", "BENT", "BEST", "BIKE", "BILL", "BIND", "BIRD",
  "BLED", "BLEW", "BLOT", "BLOW", "BLUE", "BOAR", "BOAT", "BOIL", "BOLD",
  "BOLT", "BOMB", "BOND", "BONE", "BONG", "BONY", "BOOK", "BOOM", "BOON",
  "BOOR", "BOOT", "BORE", "BORN", "BOSS", "BOTH", "BOUT", "BOWL", "BOYS",
  "BRAD", "BRAG", "BRAN", "BRAT", "BRAY", "BRED", "BREW", "BRIG", "BRIM",
  "BROW", "BULK", "BULL", "BUMP", "BUNK", "BUOY", "BURB", "BURN", "BURR",
  "BURY", "BUSH", "BUST", "BUSY", "BUZZ", "CAFE", "CAGE", "CAKE", "CALF",
  "CALL", "CALM", "CAME", "CAMP", "CANE", "CAPE", "CARD", "CARE", "CARP",
  "CART", "CASE", "CASH", "CAST", "CAVE", "CELL", "CENT", "CHAP", "CHAR",
  "CHAT", "CHEF", "CHEW", "CHIN", "CHIP", "CHOP", "CHUG", "CHUM", "CITE",
  "CITY", "CLAD", "CLAM", "CLAN", "CLAP", "CLAW", "CLAY", "CLEF", "CLIP",
  "CLOD", "CLOG", "CLOT", "CLUB", "CLUE", "COAL", "COAT", "COAX", "COBS",
  "COCK", "COCO", "CODA", "CODS", "COED", "COGS", "COIF", "COIL", "COIN",
  "COKE", "COLD", "COLE", "COLT", "COMA", "COMB", "COME", "CONE", "CONK",
  "COOK", "COOL", "COOP", "COOT", "COPE", "COPS", "COPY", "CORD", "CORE",
  "CORK", "CORN", "COST", "COSY", "COTE", "COTS", "COUP", "COVE", "COWL",
  "COWS", "CRAB", "CRAG", "CRAM", "CRAP", "CRAW", "CREW", "CRIB", "CROP",
  "CROW", "CRUX", "CUBS", "CUDS", "CUED", "CUES", "CUFF", "CULL", "CULT",
  "CUPS", "CURB", "CURD", "CURE", "CURL", "CURT", "CUSP", "CUSS", "CUTE",
  "CUTS", "DABS", "DADS", "DAFT", "DALE", "DAME", "DAMN", "DAMP", "DAMS",
  "DANE", "DANG", "DANK", "DARE", "DARK", "DARN", "DART", "DASH", "DATA",
  "DATE", "DAUB", "DAWN", "DAYS", "DAZE", "DEAD", "DEAF", "DEAL", "DEAN",
  "DEAR", "DEBT", "DECK", "DEED", "DEEM", "DEEP", "DEER", "DEFT", "DEFY",
  "DELL", "DELS", "DELT", "DEMO", "DENS", "DENT", "DENY", "DESK", "DEWY",
  "DIAL", "DICE", "DICK", "DIED", "DIES", "DIET", "DIGS", "DIKE", "DILL",
  "DIME", "DIMS", "DINE", "DING", "DINK", "DINS", "DINT", "DIPS", "DIRE",
  "DIRK", "DIRT", "DISC", "DISH", "DISK", "DIVA", "DIVE", "DOCK", "DOER",
  "DOES", "DOFF", "DOGE", "DOGS", "DOLE", "DOLL", "DOLT", "DOME", "DONE",
  "DONG", "DOOM", "DOOR", "DOPE", "DORK", "DORM", "DORY", "DOSE", "DOTE",
  "DOTS", "DOUR", "DOVE", "DOWN", "DOZE", "DOZY", "DRAB", "DRAG", "DRAM",
  "DRAT", "DRAW", "DRAY", "DREW", "DRIB", "DRIP", "DROP", "DRUB", "DRUG",
  "DRUM", "DUAL", "DUBS", "DUCK", "DUCT", "DUDE", "DUDS", "DUEL", "DUES",
  "DUET", "DUFF", "DUGS", "DUKE", "DULL", "DULY", "DUMB", "DUMP", "DUNE",
  "DUNG", "DUNK", "DUOS", "DUPE", "DURA", "DURE", "DURO", "DUSK", "DUST",
  "DUTY", "DUDE", "EARN", "EARS", "EASE", "EAST", "EASY", "EATS", "EAVE",
  "EBBS", "EBON", "ECHO", "EDDY", "EDGE", "EDGY", "EDIT", "EELS", "EERY",
  "EGGS", "EGOS", "EIDE", "EKED", "EKES", "ELDS", "ELKS", "ELLS", "ELMS",
  "ELSE", "EMIT", "EMUS", "ENDS", "ENVY", "EONS", "EPIC", "ERAS", "ERGO",
  "ERGS", "ERRS", "ESPY", "ESSE", "ESTS", "ETCH", "ETUI", "EURO", "EVEN",
  "EVER", "EVES", "EVIL", "EWER", "EWES", "EXAM", "EXEC", "EXES", "EXIT",
  "EXPO", "EYED", "EYES", "EYRA", "EYRE", "FABS", "FACE", "FACT", "FADE",
  "FADS", "FAIN", "FAIR", "FAKE", "FALL", "FAME", "FANG", "FANS", "FARD",
  "FARE", "FARM", "FART", "FASH", "FAST", "FATE", "FATS", "FAUN", "FAUX",
  "FAVE", "FAWN", "FAYS", "FAZE", "FEAR", "FEAT", "FEED", "FEEL", "FEES",
  "FEET", "FELL", "FELT", "FEND", "FENS", "FERN", "FEST", "FEUD", "FIAT",
  "FIBS", "FIDS", "FIEF", "FIER", "FIFE", "FIGS", "FILE", "FILL", "FILM",
  "FIND", "FINE", "FINK", "FINS", "FIRE", "FIRM", "FIRS", "FISH", "FIST",
  "FITS", "FIVE", "FIZZ", "FLAB", "FLAG", "FLAK", "FLAN", "FLAP", "FLAT",
  "FLAW", "FLAX", "FLAY", "FLEA", "FLED", "FLEE", "FLEW", "FLEX", "FLEY",
  "FLIC", "FLIP", "FLIT", "FLOE", "FLOG", "FLOP", "FLOW", "FLUB", "FLUE",
  "FLUX", "FOAL", "FOAM", "FOBS", "FOCI", "FOES", "FOGS", "FOGY", "FOIL",
  "FOIN", "FOLD", "FOLK", "FOLL", "FOND", "FONT", "FOOD", "FOOL", "FOOT",
  "FOPS", "FORA", "FORB", "FORD", "FORE", "FORK", "FORM", "FORT", "FOUL",
  "FOUR", "FOWL", "FOXY", "FOYS", "FOZY", "FRAG", "FRAT", "FRAY", "FRET",
  "FRIB", "FRIG", "FRIT", "FROG", "FROM", "FROZ", "FRUG", "FUEL", "FUGS",
  "FULL", "FUME", "FUND", "FUNK", "FURL", "FURY", "FUSE", "FUSS", "FUZZ",
  "WORD", "ROAD", "READ", "DEAR", "BEAR", "RARE", "CARE", "DARE", "FARE",
  "MARE", "PARE", "WARE", "BARE", "GATE", "LATE", "MATE", "RATE", "DATE",
  "FATE", "HATE", "PATE", "SATE", "KATE", "NOTE", "VOTE", "COTE", "DOTE",
  "MOTE", "ROTE", "TOTE", "MODE", "CODE", "NODE", "RODE", "LODE", "BODE"
];

let extendedWordList = [];

export function setExtendedCodeBreakerWords(words) {
  extendedWordList = Array.isArray(words)
    ? words
        .map((word) => String(word || "").trim().toUpperCase())
        .filter((word) => word.length >= 3 && word.length <= 8)
    : [];
}

export function getExtendedCodeBreakerWords() {
  return extendedWordList;
}

function shuffle(arr) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function rand(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function randomItem(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

/** Letter position A=1, B=2, ... Z=26 */
function letterValue(ch) {
  const c = String(ch).toUpperCase();
  if (!c || c.length !== 1) return 0;
  return c.charCodeAt(0) - A_CODE + 1;
}

/** Sum of letter positions for a word (A=1). */
export function alphabetValue(word) {
  if (!word) return 0;
  return String(word)
    .toUpperCase()
    .split("")
    .reduce((sum, ch) => sum + letterValue(ch), 0);
}

/** Reverse alphabet: A=26, B=25, ... Z=1. */
export function reverseAlphabetValue(word) {
  if (!word) return 0;
  return String(word)
    .toUpperCase()
    .split("")
    .reduce((sum, ch) => sum + (27 - letterValue(ch)), 0);
}

/** Shift each letter by `shift` (wraps). */
export function shiftWord(word, shift) {
  if (!word) return "";
  const n = 26;
  shift = ((shift % n) + n) % n;
  return String(word)
    .toUpperCase()
    .split("")
    .map((ch) => {
      const v = letterValue(ch);
      if (v < 1 || v > 26) return ch;
      let newV = ((v - 1 + shift) % n) + 1;
      return LETTERS[newV - 1];
    })
    .join("");
}

/** Word from letters at indices (0-based in alphabet). */
function wordFromIndices(indices) {
  return indices.map((i) => LETTERS[i % 26]).join("");
}

function uniqueOptions(correct, generator, maxAttempts = 100) {
  const set = new Set([String(correct)]);
  let attempts = 0;
  while (set.size < 4 && attempts < maxAttempts) {
    set.add(String(generator()));
    attempts += 1;
  }
  if (set.size < 4) {
    const num = Number(correct);
    if (Number.isFinite(num)) {
      for (let i = 1; set.size < 4; i += 1) set.add(String(num + i));
      for (let i = 1; set.size < 4; i += 1) set.add(String(num - i));
    }
  }
  return shuffle([...set]);
}

function pickWords(minLen = 3, maxLen = 5, count = 1) {
  const mergedWordList = [...WORD_LIST, ...extendedWordList];
  const filtered = [...new Set(mergedWordList)].filter(
    (w) => w.length >= minLen && w.length <= maxLen
  );
  const out = [];
  const used = new Set();
  for (let i = 0; i < count && i < filtered.length; i += 1) {
    let w = randomItem(filtered);
    let tries = 0;
    while (used.has(w) && tries < 50) {
      w = randomItem(filtered);
      tries += 1;
    }
    used.add(w);
    out.push(w);
  }
  return out;
}

/* ---------- Puzzle generators ---------- */

/** Alphabet position sum: CAT = 24. What is DOG? */
function alphabetSum() {
  const [word1, word2] = pickWords(3, 4, 2);
  const sum1 = alphabetValue(word1);
  const answer = alphabetValue(word2);
  const question = `If ${word1} = ${sum1} (sum of letter positions A=1, B=2, …), what is ${word2}?`;
  const options = uniqueOptions(answer, () => answer + rand(-15, 15));
  return { question, answer, options, explanation: `Sum of positions: ${word2} = ${answer}.` };
}

/** Reverse alphabet sum: A=26, B=25. */
function reverseAlphabetSum() {
  const [word1, word2] = pickWords(3, 4, 2);
  const sum1 = reverseAlphabetValue(word1);
  const answer = reverseAlphabetValue(word2);
  const question = `If ${word1} = ${sum1} (reverse: A=26, B=25, …), what is ${word2}?`;
  const options = uniqueOptions(answer, () => answer + rand(-15, 15));
  return { question, answer, options, explanation: `Reverse sum: ${word2} = ${answer}.` };
}

/** Letter shift: ABC → BCD. What does XYZ become? */
function letterShift() {
  const shift = rand(1, 5);
  const len = rand(3, 4);
  let start = rand(0, 25 - len);
  const word = wordFromIndices(Array.from({ length: len }, (_, i) => start + i));
  const answer = shiftWord(word, shift);
  const question = `If each letter shifts by ${shift} (A→${LETTERS[shift % 26]}, B→${LETTERS[(1 + shift) % 26]}, …), what does ${word} become?`;
  const options = uniqueOptions(answer, () => {
    const s = rand(1, 5);
    if (s === shift) return shiftWord(word, shift + 1);
    return shiftWord(word, s);
  });
  return { question, answer, options, explanation: `${word} + ${shift} = ${answer}.` };
}

/** Coding–decoding: given WORD1 = X, find WORD2 with same rule (e.g. sum). */
function codingDecodingSum() {
  const [word1, word2] = pickWords(3, 5, 2);
  const val1 = alphabetValue(word1);
  const answer = alphabetValue(word2);
  const question = `In a code, ${word1} = ${val1}. Using the same rule, what is ${word2}?`;
  const options = uniqueOptions(answer, () => alphabetValue(pickWords(3, 5, 1)[0]));
  return { question, answer, options, explanation: `Letter position sum: ${word2} = ${answer}.` };
}

/** Alphabet difference pattern: e.g. ACE → 1, 3, 5 (differences 2, 2). */
function alphabetDifference() {
  const start = rand(0, 20);
  const step = rand(1, 3);
  const indices = [start, start + step, start + 2 * step];
  const word = wordFromIndices(indices);
  const nextIdx = start + 3 * step;
  const answer = nextIdx < 26 ? LETTERS[nextIdx] : LETTERS[nextIdx % 26];
  const question = `In the sequence ${word}, the next letter follows the same pattern. What is it?`;
  const options = uniqueOptions(answer, () => LETTERS[rand(0, 25)]);
  return { question, answer, options, explanation: `Positions ${indices.map((i) => i + 1).join(", ")}; next = ${answer}.` };
}

/** Mixed arithmetic: e.g. (sum × 2) + 1. */
function mixedArithmetic() {
  const [word1, word2] = pickWords(3, 4, 2);
  const sum1 = alphabetValue(word1);
  const mult = rand(2, 3);
  const add = rand(0, 5);
  const coded1 = sum1 * mult + add;
  const answer = alphabetValue(word2) * mult + add;
  const question = `If ${word1} = ${coded1} (rule: sum of letter positions × ${mult} + ${add}), what is ${word2}?`;
  const options = uniqueOptions(answer, () => {
    const s = alphabetValue(pickWords(3, 4, 1)[0]);
    return s * mult + rand(-2, 2);
  });
  return { question, answer, options, explanation: `(${word2} sum) × ${mult} + ${add} = ${answer}.` };
}

/** Word transformation: e.g. WORD = 82 (sum). Subword ROD = ? */
function wordTransformation() {
  const word = randomItem(WORD_LIST.filter((w) => w.length >= 4));
  const subLen = rand(2, 3);
  const start = rand(0, word.length - subLen);
  const sub = word.slice(start, start + subLen);
  const fullSum = alphabetValue(word);
  const subSum = alphabetValue(sub);
  const answer = subSum;
  const question = `If ${word} = ${fullSum} (sum of letter positions), what is ${sub}?`;
  const options = uniqueOptions(answer, () => alphabetValue(pickWords(2, 4, 1)[0].slice(0, 3)));
  return { question, answer, options, explanation: `Sum of ${sub} = ${answer}.` };
}

/** Skip pattern: every 2nd letter, or position difference. */
function skipPattern() {
  const step = rand(2, 3);
  const start = rand(0, 26 - step * 3);
  const letters = [start, start + step, start + 2 * step].map((i) => LETTERS[i]);
  const word = letters.join("");
  const answer = LETTERS[start + 3 * step];
  const question = `In the pattern ${word}, letters follow a skip of ${step}. What letter comes next?`;
  const options = uniqueOptions(answer, () => LETTERS[rand(0, 25)]);
  return { question, answer, options, explanation: `Next index: ${start + 3 * step + 1} → ${answer}.` };
}

/** Reverse alphabet coding (A=26) then decode. */
function reverseCodingDecoding() {
  const [word1, word2] = pickWords(3, 4, 2);
  const val1 = reverseAlphabetValue(word1);
  const answer = reverseAlphabetValue(word2);
  const question = `If ${word1} = ${val1} (reverse alphabet: A=26, Z=1), what is ${word2}?`;
  const options = uniqueOptions(answer, () => reverseAlphabetValue(pickWords(3, 4, 1)[0]));
  return { question, answer, options, explanation: `Reverse sum for ${word2} = ${answer}.` };
}

/** Product of letter values (small words to keep numbers manageable). */
function productPattern() {
  const word = randomItem(WORD_LIST.filter((w) => w.length === 3));
  const values = word.split("").map((c) => letterValue(c));
  const product = values.reduce((a, b) => a * b, 1);
  const answer = product;
  const question = `If we multiply letter positions (A=1, B=2, …) for each letter in ${word}, what is the product?`;
  const options = uniqueOptions(answer, () => {
    const w = pickWords(3, 3, 1)[0];
    return w.split("").reduce((a, c) => a * letterValue(c), 1);
  });
  return { question, answer, options, explanation: `${values.join(" × ")} = ${answer}.` };
}

function getPool(difficulty) {
  const easy = [alphabetSum, letterShift, alphabetDifference];
  const medium = [alphabetSum, reverseAlphabetSum, letterShift, codingDecodingSum, reverseCodingDecoding, skipPattern];
  const hard = [
    alphabetSum,
    reverseAlphabetSum,
    letterShift,
    codingDecodingSum,
    alphabetDifference,
    mixedArithmetic,
    wordTransformation,
    skipPattern,
    reverseCodingDecoding,
    productPattern
  ];
  if (difficulty === "easy") return easy;
  if (difficulty === "medium") return medium;
  return hard;
}

/**
 * Generate a single coding–decoding puzzle.
 * @param {{ difficulty: 'easy'|'medium'|'hard' }} opts
 * @returns {{ question: string, answer: number|string, options: (number|string)[], explanation?: string }}
 */
export function generateCodeBreakerPuzzle(opts = {}) {
  const difficulty = opts.difficulty || "easy";
  const pool = getPool(difficulty);
  const generator = randomItem(pool);
  return generator();
}

/**
 * Generate a batch of puzzles for a full game.
 * @param {number} count
 * @param {{ difficulty: 'easy'|'medium'|'hard' }} opts
 */
export function generateCodeBreakerBatch(count, opts = {}) {
  const out = [];
  for (let i = 0; i < count; i += 1) {
    out.push(generateCodeBreakerPuzzle(opts));
  }
  return out;
}
