// Verbal reasoning question bank: vocabulary & grammar. Each item has difficulty for VerbalIQ mix.
// Easy = simpler, medium = moderate, hard = advanced. Used with wordBank for synonyms/antonyms.

const tenses = [
  { question: "She ____ to school yesterday.", answer: "went", options: ["go", "went", "going", "goes"], difficulty: "easy" },
  { question: "They ____ dinner now.", answer: "are eating", options: ["eat", "are eating", "ate", "eats"], difficulty: "easy" },
  { question: "He usually ____ coffee in the morning.", answer: "drinks", options: ["drink", "drinks", "is drinking", "drank"], difficulty: "easy" },
  { question: "The train ____ at 6 PM every day.", answer: "leaves", options: ["leave", "leaves", "is leaving", "left"], difficulty: "easy" },
  { question: "I ____ a student.", answer: "am", options: ["is", "am", "are", "be"], difficulty: "easy" },
  { question: "We ____ to the park last week.", answer: "went", options: ["go", "went", "going", "goes"], difficulty: "easy" },
  { question: "She ____ her homework every day.", answer: "does", options: ["do", "does", "did", "doing"], difficulty: "easy" },
  { question: "They ____ football yesterday.", answer: "played", options: ["play", "plays", "played", "playing"], difficulty: "easy" },
  { question: "I ____ this movie before.", answer: "have seen", options: ["see", "saw", "have seen", "seeing"], difficulty: "medium" },
  { question: "He ____ in this company since 2020.", answer: "has worked", options: ["works", "worked", "has worked", "working"], difficulty: "medium" },
  { question: "We ____ the project by next week.", answer: "will finish", options: ["finish", "finished", "will finish", "have finished"], difficulty: "medium" },
  { question: "They ____ when I called.", answer: "were sleeping", options: ["sleep", "slept", "were sleeping", "are sleeping"], difficulty: "medium" },
  { question: "I ____ here for two hours.", answer: "have been waiting", options: ["am waiting", "waited", "have been waiting", "was waiting"], difficulty: "medium" },
  { question: "By the time we arrived, the movie ____.", answer: "had started", options: ["started", "starts", "had started", "has started"], difficulty: "medium" },
  { question: "She ____ when the phone rang.", answer: "was cooking", options: ["cooked", "cooks", "was cooking", "is cooking"], difficulty: "medium" },
  { question: "By this time tomorrow, she ____.", answer: "will have left", options: ["left", "will leave", "will have left", "has left"], difficulty: "hard" },
  { question: "If he ____ earlier, he would have caught the bus.", answer: "had left", options: ["left", "had left", "leaves", "has left"], difficulty: "hard" },
  { question: "The report ____ by next Monday.", answer: "will have been completed", options: ["completes", "will complete", "will have been completed", "has been completed"], difficulty: "hard" },
  { question: "She ____ for three hours before she stopped.", answer: "had been working", options: ["worked", "had worked", "had been working", "was working"], difficulty: "hard" },
  { question: "I wish I ____ to the party.", answer: "had gone", options: ["went", "had gone", "go", "have gone"], difficulty: "hard" },
  { question: "The house ____ when they bought it.", answer: "was being renovated", options: ["renovated", "was renovated", "was being renovated", "had been renovated"], difficulty: "hard" },
  { question: "By 2025, they ____ here for ten years.", answer: "will have been living", options: ["will live", "will have lived", "will have been living", "have been living"], difficulty: "hard" }
];

const articles = [
  { question: "She is ____ honest person.", answer: "an", options: ["a", "an", "the", "no article"], difficulty: "easy" },
  { question: "I saw ____ eagle in the sky.", answer: "an", options: ["a", "an", "the", "no article"], difficulty: "easy" },
  { question: "He is eating ____ apple.", answer: "an", options: ["a", "an", "the", "no article"], difficulty: "easy" },
  { question: "I saw ____ boy playing in the park.", answer: "a", options: ["a", "an", "the", "no article"], difficulty: "easy" },
  { question: "I need ____ umbrella.", answer: "an", options: ["a", "an", "the", "no article"], difficulty: "easy" },
  { question: "She is ____ engineer.", answer: "an", options: ["a", "an", "the", "no article"], difficulty: "easy" },
  { question: "Please close ____ door.", answer: "the", options: ["a", "an", "the", "no article"], difficulty: "medium" },
  { question: "He is ____ best player in our team.", answer: "the", options: ["a", "an", "the", "no article"], difficulty: "medium" },
  { question: "She reads ____ newspaper every morning.", answer: "the", options: ["a", "an", "the", "no article"], difficulty: "medium" },
  { question: "We visited ____ Taj Mahal last year.", answer: "the", options: ["a", "an", "the", "no article"], difficulty: "medium" },
  { question: "____ sun rises in the east.", answer: "The", options: ["A", "An", "The", "No article"], difficulty: "medium" },
  { question: "She went to ____ university in London.", answer: "a", options: ["a", "an", "the", "no article"], difficulty: "medium" },
  { question: "He has ____ one-hour meeting.", answer: "a", options: ["a", "an", "the", "no article"], difficulty: "medium" },
  { question: "____ rich are not always happy.", answer: "The", options: ["A", "An", "The", "No article"], difficulty: "hard" },
  { question: "She plays ____ piano beautifully.", answer: "the", options: ["a", "an", "the", "no article"], difficulty: "hard" },
  { question: "He is ____ European diplomat.", answer: "a", options: ["a", "an", "the", "no article"], difficulty: "hard" },
  { question: "____ Alps are in Europe.", answer: "The", options: ["A", "An", "The", "No article"], difficulty: "hard" },
  { question: "It is ____ honour to meet you.", answer: "an", options: ["a", "an", "the", "no article"], difficulty: "hard" },
  { question: "____ life is full of surprises.", answer: "No article", options: ["A", "An", "The", "No article"], difficulty: "hard" },
  { question: "She works at ____ same place as I do.", answer: "the", options: ["a", "an", "the", "no article"], difficulty: "hard" }
];

const verbs = [
  { question: "Choose the correct form: She ____ every Sunday.", answer: "studies", options: ["study", "studies", "studied", "studying"], difficulty: "easy" },
  { question: "Choose the correct form: They ____ football now.", answer: "are playing", options: ["play", "played", "are playing", "were playing"], difficulty: "easy" },
  { question: "Choose the correct form: We ____ to the market yesterday.", answer: "went", options: ["go", "going", "went", "gone"], difficulty: "easy" },
  { question: "Choose the correct form: She ____ to finish this today.", answer: "wants", options: ["want", "wants", "wanted", "wanting"], difficulty: "easy" },
  { question: "Choose the correct form: The movie ____ interesting.", answer: "was", options: ["is", "are", "was", "were"], difficulty: "easy" },
  { question: "Choose the correct form: My brother ____ in Canada.", answer: "lives", options: ["live", "lives", "living", "lived"], difficulty: "easy" },
  { question: "Choose the correct form: He ____ his work already.", answer: "has finished", options: ["finished", "has finished", "is finishing", "will finish"], difficulty: "medium" },
  { question: "Choose the correct form: The match ____ by 5 PM.", answer: "will have ended", options: ["ends", "ended", "will end", "will have ended"], difficulty: "medium" },
  { question: "Choose the correct form: I ____ my keys.", answer: "have lost", options: ["lost", "have lost", "am losing", "will lose"], difficulty: "medium" },
  { question: "Choose the correct form: They ____ here since morning.", answer: "have been working", options: ["worked", "are working", "have been working", "were working"], difficulty: "medium" },
  { question: "Choose the correct form: He ____ when I called.", answer: "was driving", options: ["drove", "drives", "was driving", "is driving"], difficulty: "medium" },
  { question: "Choose the correct form: The book ____ by a famous author.", answer: "was written", options: ["wrote", "was written", "written", "is written"], difficulty: "medium" },
  { question: "Choose the correct form: By next year, she ____ her degree.", answer: "will have completed", options: ["completes", "will complete", "will have completed", "has completed"], difficulty: "hard" },
  { question: "Choose the correct form: The project ____ before the deadline.", answer: "had been completed", options: ["completed", "had completed", "had been completed", "was completed"], difficulty: "hard" },
  { question: "Choose the correct form: If I ____ you, I would apologise.", answer: "were", options: ["am", "was", "were", "be"], difficulty: "hard" },
  { question: "Choose the correct form: The letter ____ when we arrived.", answer: "was being typed", options: ["typed", "was typed", "was being typed", "had been typed"], difficulty: "hard" },
  { question: "Choose the correct form: She insisted that he ____ early.", answer: "leave", options: ["leaves", "left", "leave", "leaving"], difficulty: "hard" },
  { question: "Choose the correct form: I would rather you ____ now.", answer: "came", options: ["come", "came", "coming", "have come"], difficulty: "hard" }
];

const verbalQuestions = {
  tenses,
  articles,
  verbs
};

export default verbalQuestions;
