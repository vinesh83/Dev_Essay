// Touch-typing course. Each level adds keys, then moves to real words and
// essay sentences. The goal for test day: type a full essay in 90 minutes
// without thinking about the keyboard. Target ~20+ WPM with 95% accuracy.

export type TypingLevel = {
  id: number;
  name: string;
  tip: string;
  keys: string; // new keys (for the on-screen keyboard highlight)
  lines: string[];
};

export const TYPING_LEVELS: TypingLevel[] = [
  {
    id: 1,
    name: "Home Base",
    tip: "Rest your fingers on A S D F and J K L ;. Feel the bumps on F and J. Thumbs on the space bar.",
    keys: "asdfjkl;",
    lines: ["asdf jkl; asdf jkl;", "a sad lad asks dad", "all lads fall; dad asks", "a flask; a salad; a lass"],
  },
  {
    id: 2,
    name: "Reach for G and H",
    tip: "Your pointer fingers stretch sideways to G and H, then snap back home.",
    keys: "gh",
    lines: ["fgf jhj fgf jhj", "dad has a glass flag", "a glad lass had half a salad", "flash dash; a glad dad"],
  },
  {
    id: 3,
    name: "Top Row: E and I",
    tip: "Middle fingers reach up to E and I. Keep the other fingers on home row.",
    keys: "ei",
    lines: ["ded kik ded kik", "she likes a skid; he hides", "a kid likes his desk", "she said life is fine"],
  },
  {
    id: 4,
    name: "Top Row: R T Y U",
    tip: "Pointer fingers own R, T (left) and Y, U (right).",
    keys: "rtyu",
    lines: ["frf juj ftf jyj", "the red truck is fast", "try your best at the race", "a kid ate the treat right there"],
  },
  {
    id: 5,
    name: "Top Row: Q W O P",
    tip: "Pinkies reach for Q and P. Ring fingers reach for W and O.",
    keys: "qwop",
    lines: ["aqa ;p; sws lol", "we went to the pool for a power quest", "the quiet puppy popped the soap", "our race car is the top pick"],
  },
  {
    id: 6,
    name: "Bottom Row",
    tip: "Curl your fingers down for Z X C V B N M. Shift with the opposite pinky for capitals.",
    keys: "zxcvbnm",
    lines: ["zxcv bnm, zxcv bnm,", "zoom past the bumpy curve", "my brave cousin can swim", "Max and Ben mined six diamonds"],
  },
  {
    id: 7,
    name: "Capitals and Periods",
    tip: "Every sentence starts with a capital and ends with a period. Use the pinky on Shift.",
    keys: ".",
    lines: [
      "I think dogs are the best pets.",
      "My teacher, Ms. Lopez, is kind.",
      "Dallas is a big city in Texas.",
      "We went to the park on Saturday.",
    ],
  },
  {
    id: 8,
    name: "Apostrophes and Commas",
    tip: "The apostrophe is right next to ; with your right pinky. Do not forget it in don't, can't, and it's.",
    keys: "',",
    lines: [
      "I don't think it's fair.",
      "We can't stop now, and we won't.",
      "First, it's fun. Second, it's healthy.",
      "My dog's toy is under Mom's chair.",
    ],
  },
  {
    id: 9,
    name: "Essay Words",
    tip: "These are words you will type in almost every essay. Make them automatic!",
    keys: "",
    lines: [
      "In my opinion, because, for example, therefore",
      "First of all, another reason, finally, in conclusion",
      "I strongly believe that this is important.",
      "This shows that kids learn better when they move.",
    ],
  },
  {
    id: 10,
    name: "Essay Sentences",
    tip: "Type whole sentences smoothly. Keep your eyes on the screen, not your hands.",
    keys: "",
    lines: [
      "I believe every school should have a garden because it helps kids learn.",
      "For example, students can measure how fast their plants grow.",
      "Another reason is that gardens help kids eat healthy food.",
      "In conclusion, a garden is a great way to learn outside.",
    ],
  },
];

export const TYPING_TARGET_WPM = 20;
export const TYPING_TARGET_ACCURACY = 95;

export const TYPING_TEST_TEXT =
  "My favorite day of the week is Saturday. I can sleep late, play outside with my friends, and help my family cook dinner. Last Saturday, we made tacos and I chopped the tomatoes. It's fun when everyone works together.";
