// Quick drills mapped to the Sudie TAG rubric.
// Conventions is 40 of 100 points, so it gets the most drills.

export type SkillId =
  | "capitals"
  | "apostrophes"
  | "endmarks"
  | "runons"
  | "commas"
  | "homophones"
  | "spelling"
  | "thesis"
  | "transitions"
  | "hooks"
  | "conclusions"
  | "evidence"
  | "wordchoice";

export type RubricArea = "argument" | "organization" | "evidence" | "expression" | "conventions";

export const SKILLS: Record<SkillId, { name: string; area: RubricArea; lesson: string }> = {
  capitals: {
    name: "Capital Letters",
    area: "conventions",
    lesson: "Capitalize the first word of every sentence, the word I, and names of people, places, days, and months.",
  },
  apostrophes: {
    name: "Apostrophes",
    area: "conventions",
    lesson: "Contractions need an apostrophe where letters are missing: do not = don't, it is = it's, can not = can't. Owners get one too: the dog's bone.",
  },
  endmarks: {
    name: "End Marks",
    area: "conventions",
    lesson: "Every sentence ends with a period, question mark, or exclamation point. Use ! only once or twice in an essay.",
  },
  runons: {
    name: "Run-on Sentences",
    area: "conventions",
    lesson: "Two complete thoughts need a period between them, or a comma plus and/but/so. Don't chain ideas with 'and then and then'.",
  },
  commas: {
    name: "Commas",
    area: "conventions",
    lesson: "Put a comma after an opening word like First, Also, or For example. Use commas in a list: dogs, cats, and fish.",
  },
  homophones: {
    name: "Sound-alike Words",
    area: "conventions",
    lesson: "their (belongs to them), there (a place), they're (they are). its (belongs to it), it's (it is). your (belongs to you), you're (you are). to, too, two.",
  },
  spelling: {
    name: "Tricky Spelling",
    area: "conventions",
    lesson: "Some words trick everyone: because, believe, friend, important, different, people, really, until, probably, especially.",
  },
  thesis: {
    name: "Clear Opinion",
    area: "argument",
    lesson: "Your opinion sentence (thesis) answers the prompt and picks ONE side. Example: 'Every school should have a garden because it helps kids learn, eat healthy, and work together.'",
  },
  transitions: {
    name: "Transition Words",
    area: "organization",
    lesson: "Transitions guide the reader: First, Another reason, For example, Also, However, Finally, In conclusion.",
  },
  hooks: {
    name: "Hooks and Introductions",
    area: "organization",
    lesson: "Start with a hook (a question, a surprising fact, or a quick story), then state your opinion. Never start with 'Hi, my name is'.",
  },
  conclusions: {
    name: "Strong Endings",
    area: "organization",
    lesson: "Restate your opinion in new words, sum up your reasons, and end with a final thought or call to action.",
  },
  evidence: {
    name: "Evidence and Examples",
    area: "evidence",
    lesson: "Each reason needs proof: a fact from the article, a specific example, or a short story from your life. Then explain how it proves your point.",
  },
  wordchoice: {
    name: "Word Choice",
    area: "expression",
    lesson: "Swap tired words (good, bad, nice, fun, a lot, stuff, things) for precise ones (helpful, harmful, generous, thrilling, many, supplies).",
  },
};

export type Drill =
  | { id: string; skill: SkillId; type: "fix"; prompt: string; answer: string; alts?: string[]; hint: string }
  | { id: string; skill: SkillId; type: "choose"; prompt: string; choices: string[]; correct: number; why: string };

export const DRILLS: Drill[] = [
  // capitals
  { id: "cap1", skill: "capitals", type: "fix", prompt: "i think recess should be longer.", answer: "I think recess should be longer.", hint: "The word I is always a capital." },
  { id: "cap2", skill: "capitals", type: "fix", prompt: "my family went to dallas on saturday.", answer: "My family went to Dallas on Saturday.", hint: "Sentence start, city, and day of the week." },
  { id: "cap3", skill: "capitals", type: "fix", prompt: "last july, my friend maya and i visited texas.", answer: "Last July, my friend Maya and I visited Texas.", hint: "Months, names, I, and states." },
  { id: "cap4", skill: "capitals", type: "fix", prompt: "Dogs are loyal. they protect their owners.", answer: "Dogs are loyal. They protect their owners.", hint: "A new sentence starts after the period." },
  { id: "cap5", skill: "capitals", type: "choose", prompt: "Which sentence is capitalized correctly?", choices: ["We visited the Zoo on monday.", "We visited the zoo on Monday.", "we visited the zoo on Monday."], correct: 1, why: "Days are capitalized; 'zoo' is a common noun." },
  // apostrophes
  { id: "apo1", skill: "apostrophes", type: "fix", prompt: "I dont think its fair.", answer: "I don't think it's fair.", hint: "do not = don't, it is = it's." },
  { id: "apo2", skill: "apostrophes", type: "fix", prompt: "Kids cant learn if they arent rested.", answer: "Kids can't learn if they aren't rested.", hint: "can not = can't, are not = aren't." },
  { id: "apo3", skill: "apostrophes", type: "fix", prompt: "My dogs bowl is empty and hes hungry.", answer: "My dog's bowl is empty and he's hungry.", hint: "The bowl belongs to the dog. he is = he's." },
  { id: "apo4", skill: "apostrophes", type: "fix", prompt: "Thats why I wouldnt change it.", answer: "That's why I wouldn't change it.", hint: "that is = that's, would not = wouldn't." },
  { id: "apo5", skill: "apostrophes", type: "choose", prompt: "Pick the correct sentence.", choices: ["Its a great idea.", "It's a great idea.", "Its' a great idea."], correct: 1, why: "It's = it is." },
  { id: "apo6", skill: "apostrophes", type: "fix", prompt: "Lets go, were going to be late!", answer: "Let's go, we're going to be late!", alts: ["Let's go. We're going to be late!"], hint: "let us = let's, we are = we're." },
  // endmarks
  { id: "end1", skill: "endmarks", type: "fix", prompt: "Have you ever wondered why the sky is blue", answer: "Have you ever wondered why the sky is blue?", hint: "It's a question." },
  { id: "end2", skill: "endmarks", type: "fix", prompt: "Gardens help kids learn They also help kids eat healthy", answer: "Gardens help kids learn. They also help kids eat healthy.", hint: "Two sentences need two periods." },
  { id: "end3", skill: "endmarks", type: "choose", prompt: "Which ending is best for an essay?", choices: ["That is why we need longer recess!!!!!", "That is why we need longer recess.", "That is why we need longer recess"], correct: 1, why: "One period. Too many ! looks less serious." },
  // run-ons
  { id: "run1", skill: "runons", type: "fix", prompt: "I like dogs they are fun.", answer: "I like dogs. They are fun.", alts: ["I like dogs because they are fun.", "I like dogs, and they are fun.", "I like dogs because they're fun."], hint: "Two complete thoughts. Split them or join with a word like because." },
  { id: "run2", skill: "runons", type: "choose", prompt: "Which one is NOT a run-on?", choices: ["We went to the park and then we played and then we ate and then we went home.", "We went to the park. We played tag, ate lunch, and walked home.", "We went to the park we played tag."], correct: 1, why: "It splits ideas into clear sentences and uses a list." },
  { id: "run3", skill: "runons", type: "fix", prompt: "Recess is important kids need to move.", answer: "Recess is important because kids need to move.", alts: ["Recess is important. Kids need to move.", "Recess is important, so kids need to move."], hint: "Add because, or split into two sentences." },
  { id: "run4", skill: "runons", type: "choose", prompt: "Which is the best fix for: 'Phones are distracting, they buzz all day.'", choices: ["Phones are distracting they buzz all day.", "Phones are distracting because they buzz all day.", "Phones are distracting, and, they buzz all day."], correct: 1, why: "A comma alone can't join two sentences. 'because' fixes it." },
  // commas
  { id: "com1", skill: "commas", type: "fix", prompt: "First recess helps kids focus.", answer: "First, recess helps kids focus.", hint: "Comma after an opening transition word." },
  { id: "com2", skill: "commas", type: "fix", prompt: "We grew carrots beans and tomatoes.", answer: "We grew carrots, beans, and tomatoes.", alts: ["We grew carrots, beans and tomatoes."], hint: "Commas separate items in a list." },
  { id: "com3", skill: "commas", type: "fix", prompt: "For example my sister reads every night.", answer: "For example, my sister reads every night.", hint: "Comma after 'For example'." },
  { id: "com4", skill: "commas", type: "fix", prompt: "In conclusion every school needs a library.", answer: "In conclusion, every school needs a library.", hint: "Comma after 'In conclusion'." },
  // homophones
  { id: "hom1", skill: "homophones", type: "choose", prompt: "Students should bring ___ own lunch.", choices: ["there", "their", "they're"], correct: 1, why: "their = belongs to them." },
  { id: "hom2", skill: "homophones", type: "choose", prompt: "___ going to love the new garden.", choices: ["Your", "You're"], correct: 1, why: "You're = you are." },
  { id: "hom3", skill: "homophones", type: "choose", prompt: "The dog wagged ___ tail.", choices: ["it's", "its"], correct: 1, why: "its = belongs to it. No apostrophe!" },
  { id: "hom4", skill: "homophones", type: "choose", prompt: "Homework on weekends is ___ much.", choices: ["to", "too", "two"], correct: 1, why: "too = more than enough." },
  { id: "hom5", skill: "homophones", type: "choose", prompt: "We left our bikes over ___.", choices: ["their", "there", "they're"], correct: 1, why: "there = a place." },
  { id: "hom6", skill: "homophones", type: "fix", prompt: "Their going too the park.", answer: "They're going to the park.", hint: "they are = they're; to = direction." },
  // spelling
  { id: "sp1", skill: "spelling", type: "fix", prompt: "I beleive this is importent becuase it helps peple.", answer: "I believe this is important because it helps people.", hint: "Four words are misspelled." },
  { id: "sp2", skill: "spelling", type: "fix", prompt: "My freind is reely diffrent.", answer: "My friend is really different.", hint: "friend, really, different." },
  { id: "sp3", skill: "spelling", type: "fix", prompt: "We waited untill it was probly too late.", answer: "We waited until it was probably too late.", hint: "until has one l. probably." },
  { id: "sp4", skill: "spelling", type: "choose", prompt: "Which is spelled right?", choices: ["especially", "espesially", "expecially"], correct: 0, why: "es-pe-cial-ly." },
  { id: "sp5", skill: "spelling", type: "fix", prompt: "Alot of studants enjoy sciense.", answer: "A lot of students enjoy science.", hint: "'a lot' is two words." },
  // thesis
  { id: "th1", skill: "thesis", type: "choose", prompt: "Prompt: Should recess be longer? Which is the strongest opinion sentence?", choices: ["Recess is a thing at school.", "I will tell you about recess.", "Recess should be longer because it helps kids focus, stay healthy, and make friends.", "Some people like recess and some don't."], correct: 2, why: "It picks a side and previews the reasons." },
  { id: "th2", skill: "thesis", type: "choose", prompt: "Prompt: Should kids get paid for chores? Best thesis?", choices: ["Kids should get paid for chores because it teaches them to save and work hard.", "Chores are things like dishes.", "Hi! I'm going to write about chores.", "Maybe yes, maybe no."], correct: 0, why: "Clear side plus reasons." },
  { id: "th3", skill: "thesis", type: "choose", prompt: "What is wrong with: 'Zoos are good and also bad.'?", choices: ["Nothing", "It does not pick a side", "It is too long"], correct: 1, why: "An opinion essay must take ONE side." },
  { id: "th4", skill: "thesis", type: "choose", prompt: "Prompt: Book or movie? Which thesis answers the prompt?", choices: ["Movies have popcorn.", "Reading the book is better than watching the movie because books let you imagine, include more details, and build your vocabulary.", "My favorite book is about dragons."], correct: 1, why: "It answers the exact question." },
  // transitions
  { id: "tr1", skill: "transitions", type: "choose", prompt: "___, kids who garden eat more vegetables. (starting your first reason)", choices: ["In conclusion", "First", "However"], correct: 1, why: "First starts your first reason." },
  { id: "tr2", skill: "transitions", type: "choose", prompt: "Gardens are fun. ___, they teach science.", choices: ["In addition", "For example", "In conclusion"], correct: 0, why: "Adds another reason." },
  { id: "tr3", skill: "transitions", type: "choose", prompt: "Recess helps kids focus. ___, after recess my class finishes math faster.", choices: ["However", "For example", "Finally"], correct: 1, why: "Introduces proof." },
  { id: "tr4", skill: "transitions", type: "choose", prompt: "Some say gardens cost too much. ___, a local store donated seeds.", choices: ["However", "First", "Also"], correct: 0, why: "Shows the other side, then answers it." },
  { id: "tr5", skill: "transitions", type: "choose", prompt: "Which transition starts your final paragraph?", choices: ["To begin", "In conclusion", "For instance"], correct: 1, why: "Signals the ending." },
  // hooks
  { id: "hk1", skill: "hooks", type: "choose", prompt: "Which is the best hook for an essay about longer recess?", choices: ["Hi, my name is Dev and I will write about recess.", "Imagine sitting still for six hours straight. Your legs bounce, your mind wanders, and math problems blur together.", "This essay is about recess.", "Recess."], correct: 1, why: "It paints a picture and makes the reader care." },
  { id: "hk2", skill: "hooks", type: "choose", prompt: "Which hook uses a surprising fact?", choices: ["Fifty years ago, half of kids biked to school. Today, far fewer do.", "Bikes have wheels.", "I like bikes a lot."], correct: 0, why: "A surprising fact grabs attention." },
  { id: "hk3", skill: "hooks", type: "choose", prompt: "Which hook asks a good question?", choices: ["Do you like stuff?", "What if the best classroom in your school had no walls at all?", "Are gardens green?"], correct: 1, why: "It sparks curiosity and leads into the topic." },
  // conclusions
  { id: "cn1", skill: "conclusions", type: "choose", prompt: "Which is the strongest conclusion?", choices: ["The end.", "That's all I have to say. Bye!", "In conclusion, longer recess would help students focus, stay healthy, and make friends. Let's give kids the break they need to do their best.", "Recess is long."], correct: 2, why: "Restates, sums up reasons, ends with a call to action." },
  { id: "cn2", skill: "conclusions", type: "choose", prompt: "A good conclusion should NOT…", choices: ["restate your opinion", "add a brand-new reason you never explained", "sum up your reasons"], correct: 1, why: "New reasons belong in the body." },
  { id: "cn3", skill: "conclusions", type: "choose", prompt: "Which final sentence leaves the reader thinking?", choices: ["So yeah.", "If every school planted a garden, imagine how many kids would discover a love for science.", "I am done now."], correct: 1, why: "A final thought sticks with the reader." },
  // evidence
  { id: "ev1", skill: "evidence", type: "choose", prompt: "Reason: Gardens help kids learn science. Best evidence?", choices: ["Gardens are pretty.", "In the article, fourth graders learned how worms make soil healthy.", "I like tomatoes."], correct: 1, why: "Specific and from the text." },
  { id: "ev2", skill: "evidence", type: "choose", prompt: "Reason: Phones distract students. Best evidence?", choices: ["One teacher counted more than 60 phone buzzes in a single week.", "Phones come in many colors.", "My uncle has a phone."], correct: 0, why: "A specific fact that proves the reason." },
  { id: "ev3", skill: "evidence", type: "choose", prompt: "Reason: Making mistakes helps you learn. Best personal example?", choices: ["Mistakes happen.", "When I fell off my bike the first time, I learned to keep pedaling, and two days later I rode all the way around the block.", "I am smart."], correct: 1, why: "A specific mini-story with a result." },
  { id: "ev4", skill: "evidence", type: "choose", prompt: "After giving evidence, what should you do next?", choices: ["Move to a new topic", "Explain how the evidence proves your reason", "Repeat the evidence"], correct: 1, why: "Explaining connects evidence to your opinion. Try: 'This shows that…'" },
  { id: "ev5", skill: "evidence", type: "choose", prompt: "Which sentence explains evidence best?", choices: ["This shows that when kids grow food themselves, they are more excited to eat healthy.", "That's it.", "Carrots are orange."], correct: 0, why: "'This shows that…' links the proof to the reason." },
  // word choice
  { id: "wc1", skill: "wordchoice", type: "choose", prompt: "Replace 'good': The garden is good for kids.", choices: ["nice", "beneficial", "okay"], correct: 1, why: "Beneficial is precise." },
  { id: "wc2", skill: "wordchoice", type: "choose", prompt: "Replace 'a lot of': A lot of students ride bikes.", choices: ["Many", "Lots of", "A bunch of"], correct: 0, why: "Many is clear and formal." },
  { id: "wc3", skill: "wordchoice", type: "choose", prompt: "Replace 'fun': The field trip was fun.", choices: ["cool", "fun fun", "thrilling"], correct: 2, why: "Thrilling paints a picture." },
  { id: "wc4", skill: "wordchoice", type: "choose", prompt: "Replace 'bad': Too much screen time is bad for sleep.", choices: ["harmful", "not good", "kinda bad"], correct: 0, why: "Harmful is precise." },
  { id: "wc5", skill: "wordchoice", type: "choose", prompt: "Which sentence has the strongest words?", choices: ["The dog was really really big.", "The enormous dog bounded across the yard.", "The dog was big and stuff."], correct: 1, why: "Strong verbs and adjectives: enormous, bounded." },
  { id: "wc6", skill: "wordchoice", type: "choose", prompt: "Replace 'stuff': We need stuff for the garden.", choices: ["things", "supplies like seeds and shovels", "stuff and things"], correct: 1, why: "Specific nouns beat vague ones." },
];
