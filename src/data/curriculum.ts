// The Quest Curriculum: one fixed session per day, in order. Dev never
// picks. Six units follow the essay from outside in (structure, intro,
// body, transitions, conclusion, the other side), three days each. Each day
// sets the lesson, the essay sentences he types, and one bold writing focus.
// After day 18, Champion Rounds repeat the units in order, so every skill
// keeps coming back.

export type Session = {
  day: number; // 1-based
  unit: number; // 0-based
  part: 1 | 2 | 3;
  lessonId: string;
  focus: string; // shown big on the essay screen
};

export type Unit = {
  id: string;
  icon: string;
  name: string;
  lessonId: string;
  focus: [string, string, string]; // day 1, 2, 3
  sentences: string[]; // essay sentences he types in this unit
};

export const UNITS: Unit[] = [
  {
    id: "burger",
    icon: "🍔",
    name: "The Essay Burger",
    lessonId: "burger",
    focus: [
      "Build the whole burger: intro, three body paragraphs, conclusion. Press Enter twice between paragraphs.",
      "Each body paragraph proves ONE reason. New reason? New paragraph.",
      "Check the buns: your conclusion repeats your opinion in new words.",
    ],
    sentences: [
      "I believe recess should be longer.",
      "First, kids need time to run and play.",
      "Another reason is that a break helps us focus.",
      "Finally, recess is where we make new friends.",
      "In conclusion, more play time makes school better.",
      "Every essay needs a top bun and a bottom bun.",
      "Each paragraph has one job to do.",
    ],
  },
  {
    id: "intro",
    icon: "🎣",
    name: "Power Intros",
    lessonId: "intro",
    focus: [
      "Start with a hook: a question, a fact, or a scene. Never \"I am going to write about\".",
      "Your opinion sentence uses \"because\" and names your three reasons.",
      "Try a different hook than last time. Make the reader want more.",
    ],
    sentences: [
      "Have you ever wished the weekend lasted one more day?",
      "Picture this: the bell rings and everyone races outside.",
      "A dog can smell far better than a person can.",
      "I believe every school should have a garden because it teaches us.",
      "Imagine a world with no books at all.",
      "Kids should have less homework because they need rest.",
      "Did you know that cats sleep most of the day?",
    ],
  },
  {
    id: "body",
    icon: "🧱",
    name: "Body Paragraph Builder",
    lessonId: "body",
    focus: [
      "Every reason gets a SPECIFIC example: a real time, place, or number.",
      "Add the so-what: one sentence that starts with \"This shows that\".",
      "Reason, example, explain. Do all three in every body paragraph.",
    ],
    sentences: [
      "For example, last week our class built a tower out of blocks.",
      "This shows that working together makes us stronger.",
      "When Ellie runs in the park, she comes home calm and happy.",
      "That is why pets make families happier.",
      "In art class, we painted a mural as big as a wall.",
      "This proves that kids learn more when they create things.",
      "My friend read twelve books over the summer.",
    ],
  },
  {
    id: "transitions",
    icon: "🌉",
    name: "Transition Words",
    lessonId: "transitions",
    focus: [
      "Start every body paragraph with a bridge: First, Another reason, Finally.",
      "Use \"For example,\" before each example. Put a comma after it.",
      "Use \"However,\" once to turn to the other side.",
    ],
    sentences: [
      "First, a longer lunch gives everyone time to eat.",
      "Another reason is that students can talk with friends.",
      "For example, my class finished early and played a game.",
      "However, some people think recess wastes time.",
      "Also, exercise makes our brains work better.",
      "Finally, happy students learn more every day.",
      "As a result, the whole school feels calmer.",
    ],
  },
  {
    id: "conclusion",
    icon: "🏁",
    name: "Strong Conclusions",
    lessonId: "conclusion",
    focus: [
      "Start the conclusion with \"In conclusion,\" and say your opinion in NEW words.",
      "Remind the reader of your three reasons in one sentence.",
      "End with a big final thought: a wish, a call to action, or a picture.",
    ],
    sentences: [
      "In conclusion, every kid deserves a pet to love.",
      "To sum up, gardens teach us, feed us, and bring us together.",
      "If we listen to kids, schools will be better for everyone.",
      "So the next time you see a book, open it and start reading.",
      "That is why a four-day week would make us happier.",
      "Let's give every student the chance to shine.",
      "All in all, teamwork wins the game.",
    ],
  },
  {
    id: "counter",
    icon: "🧀",
    name: "Answer the Other Side",
    lessonId: "counter",
    focus: [
      "Add the cheese: \"Some people think...\" then \"However,...\" and win the point.",
      "Put your other-side paragraph right before the conclusion.",
      "Full test essay: every layer of the burger, plus the cheese.",
    ],
    sentences: [
      "Some people think homework helps kids learn more.",
      "However, too much homework leaves no time to rest.",
      "Others may say that uniforms are boring.",
      "But uniforms help everyone feel like part of a team.",
      "It is true that screens can be fun.",
      "Still, playing outside is better for our bodies.",
      "Even so, my side is the stronger one.",
    ],
  },
];

export const CORE_DAYS = UNITS.length * 3;

/** The session for curriculum day n (1-based). After day 18 the units repeat as Champion Rounds. */
export function sessionFor(day: number): Session {
  const i = (Math.max(1, day) - 1) % CORE_DAYS;
  const unit = Math.floor(i / 3);
  const part = ((i % 3) + 1) as 1 | 2 | 3;
  return { day: Math.max(1, day), unit, part, lessonId: UNITS[unit].lessonId, focus: UNITS[unit].focus[part - 1] };
}

export const isChampion = (day: number) => day > CORE_DAYS;
