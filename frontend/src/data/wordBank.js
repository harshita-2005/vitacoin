// Core word bank for dynamic verbal reasoning question generation.
// Each entry can generate many MCQs (synonyms / antonyms) without hitting APIs.
// You can safely extend this list over time – even a few hundred words will
// produce tens of thousands of unique question combinations.

const wordBank = [
  {
    word: "happy",
    difficulty: "easy",
    synonyms: ["joyful", "cheerful", "glad"],
    antonyms: ["sad", "unhappy", "miserable"]
  },
  {
    word: "fast",
    difficulty: "easy",
    synonyms: ["quick", "rapid", "swift"],
    antonyms: ["slow", "sluggish", "lazy"]
  },
  {
    word: "big",
    difficulty: "easy",
    synonyms: ["large", "huge", "massive"],
    antonyms: ["small", "tiny", "little"]
  },
  {
    word: "strong",
    difficulty: "easy",
    synonyms: ["powerful", "robust", "tough"],
    antonyms: ["weak", "fragile", "feeble"]
  },
  {
    word: "bright",
    difficulty: "easy",
    synonyms: ["shiny", "radiant", "luminous"],
    antonyms: ["dark", "dim", "dull"]
  },
  {
    word: "calm",
    difficulty: "easy",
    synonyms: ["peaceful", "quiet", "relaxed"],
    antonyms: ["angry", "upset", "restless"]
  },
  {
    word: "brave",
    difficulty: "easy",
    synonyms: ["courageous", "bold", "fearless"],
    antonyms: ["cowardly", "afraid", "timid"]
  },
  {
    word: "noisy",
    difficulty: "easy",
    synonyms: ["loud", "boisterous", "rowdy"],
    antonyms: ["quiet", "silent", "calm"]
  },
  {
    word: "rich",
    difficulty: "easy",
    synonyms: ["wealthy", "affluent", "prosperous"],
    antonyms: ["poor", "needy", "broke"]
  },
  {
    word: "safe",
    difficulty: "easy",
    synonyms: ["secure", "protected", "harmless"],
    antonyms: ["dangerous", "risky", "unsafe"]
  },
  { word: "smart", difficulty: "easy", synonyms: ["clever", "intelligent", "bright"], antonyms: ["dull", "stupid", "slow"] },
  { word: "kind", difficulty: "easy", synonyms: ["gentle", "caring", "nice"], antonyms: ["cruel", "mean", "harsh"] },
  { word: "quiet", difficulty: "easy", synonyms: ["silent", "calm", "peaceful"], antonyms: ["loud", "noisy", "rowdy"] },
  { word: "sad", difficulty: "easy", synonyms: ["unhappy", "miserable", "gloomy"], antonyms: ["happy", "joyful", "cheerful"] },
  { word: "tired", difficulty: "easy", synonyms: ["weary", "exhausted", "sleepy"], antonyms: ["energetic", "fresh", "alert"] },

  // Medium difficulty words
  {
    word: "efficient",
    difficulty: "medium",
    synonyms: ["effective", "productive", "capable"],
    antonyms: ["wasteful", "inefficient", "slow"]
  },
  {
    word: "generous",
    difficulty: "medium",
    synonyms: ["kind", "giving", "charitable"],
    antonyms: ["selfish", "stingy", "greedy"]
  },
  {
    word: "obvious",
    difficulty: "medium",
    synonyms: ["clear", "evident", "apparent"],
    antonyms: ["unclear", "vague", "hidden"]
  },
  {
    word: "scarce",
    difficulty: "medium",
    synonyms: ["rare", "limited", "insufficient"],
    antonyms: ["plentiful", "abundant", "ample"]
  },
  {
    word: "fragile",
    difficulty: "medium",
    synonyms: ["delicate", "brittle", "breakable"],
    antonyms: ["strong", "durable", "tough"]
  },
  {
    word: "hostile",
    difficulty: "medium",
    synonyms: ["unfriendly", "aggressive", "antagonistic"],
    antonyms: ["friendly", "kind", "welcoming"]
  },
  {
    word: "vital",
    difficulty: "medium",
    synonyms: ["essential", "crucial", "important"],
    antonyms: ["unimportant", "trivial", "optional"]
  },
  {
    word: "occur",
    difficulty: "medium",
    synonyms: ["happen", "take place", "arise"],
    antonyms: ["cease", "stop", "disappear"]
  },
  {
    word: "abandon",
    difficulty: "medium",
    synonyms: ["leave", "desert", "give up"],
    antonyms: ["keep", "continue", "maintain"]
  },
  {
    word: "visible",
    difficulty: "medium",
    synonyms: ["seen", "apparent", "noticeable"],
    antonyms: ["invisible", "hidden", "concealed"]
  },
  { word: "reluctant", difficulty: "medium", synonyms: ["unwilling", "hesitant", "resistant"], antonyms: ["eager", "willing", "keen"] },
  { word: "persistent", difficulty: "medium", synonyms: ["determined", "steadfast", "resolute"], antonyms: ["giving up", "inconstant", "fickle"] },
  { word: "adequate", difficulty: "medium", synonyms: ["sufficient", "enough", "satisfactory"], antonyms: ["insufficient", "inadequate", "lacking"] },
  { word: "diverse", difficulty: "medium", synonyms: ["varied", "mixed", "assorted"], antonyms: ["uniform", "same", "identical"] },
  { word: "explicit", difficulty: "medium", synonyms: ["clear", "direct", "obvious"], antonyms: ["vague", "implicit", "unclear"] },

  // Hard difficulty / aptitude-style vocabulary
  {
    word: "ephemeral",
    difficulty: "hard",
    synonyms: ["short-lived", "temporary", "transient"],
    antonyms: ["permanent", "lasting", "enduring"]
  },
  {
    word: "meticulous",
    difficulty: "hard",
    synonyms: ["careful", "thorough", "precise"],
    antonyms: ["careless", "sloppy", "hasty"]
  },
  {
    word: "ambiguous",
    difficulty: "hard",
    synonyms: ["unclear", "vague", "doubtful"],
    antonyms: ["clear", "explicit", "definite"]
  },
  {
    word: "benevolent",
    difficulty: "hard",
    synonyms: ["kind", "charitable", "generous"],
    antonyms: ["cruel", "malevolent", "unkind"]
  },
  {
    word: "candid",
    difficulty: "hard",
    synonyms: ["honest", "frank", "open"],
    antonyms: ["secretive", "deceitful", "guarded"]
  },
  {
    word: "diligent",
    difficulty: "hard",
    synonyms: ["hardworking", "industrious", "persistent"],
    antonyms: ["lazy", "idle", "careless"]
  },
  {
    word: "obsolete",
    difficulty: "hard",
    synonyms: ["outdated", "old-fashioned", "useless"],
    antonyms: ["modern", "current", "new"]
  },
  {
    word: "prudent",
    difficulty: "hard",
    synonyms: ["wise", "careful", "cautious"],
    antonyms: ["reckless", "careless", "foolish"]
  },
  {
    word: "rigid",
    difficulty: "hard",
    synonyms: ["stiff", "inflexible", "strict"],
    antonyms: ["flexible", "loose", "soft"]
  },
  {
    word: "succinct",
    difficulty: "hard",
    synonyms: ["brief", "concise", "to the point"],
    antonyms: ["wordy", "lengthy", "verbose"]
  },
  { word: "pragmatic", difficulty: "hard", synonyms: ["practical", "realistic", "sensible"], antonyms: ["idealistic", "impractical", "unrealistic"] },
  { word: "resilient", difficulty: "hard", synonyms: ["tough", "durable", "adaptable"], antonyms: ["fragile", "vulnerable", "weak"] },
  { word: "verbose", difficulty: "hard", synonyms: ["wordy", "lengthy", "prolix"], antonyms: ["concise", "brief", "succinct"] },
  { word: "mundane", difficulty: "hard", synonyms: ["ordinary", "boring", "everyday"], antonyms: ["extraordinary", "remarkable", "exotic"] },
  { word: "arduous", difficulty: "hard", synonyms: ["difficult", "strenuous", "taxing"], antonyms: ["easy", "simple", "effortless"] }
];

export default wordBank;

