import { DEMO } from "./coach";
import { checkPara, findTransitions, sentences, type Check } from "../lib/structure";

// Writing School: short, hand-holding lessons. Each one teaches a skill,
// shows a model with every part labeled, then has Dev practice it until he
// gets it right. Order matters: each lesson unlocks the next.

export type Exercise =
  | { kind: "pick"; q: string; text?: string; options: string[]; answer: number; why: string }
  | { kind: "find"; q: string; sentences: string[]; answer: number; why: string }
  | { kind: "order"; q: string; items: string[]; why: string }
  | { kind: "write"; q: string; prompt: string; starters: string[]; check: (t: string) => Check[]; sample: string; minWords: number };

export type ModelPart = { label: string; color: string; text: string };

export type Lesson = {
  id: string;
  icon: string;
  title: string;
  tagline: string;
  recipe: { icon: string; label: string; detail: string }[];
  teach: { title: string; body: string; examples?: string[] }[];
  model: { title: string; parts: ModelPart[]; note: string };
  practice: Exercise[];
};

const C = { bun: "#ffb627", meat: "#ff7a95", leaf: "#5ef0b0", tomato: "#ff6b5b", cheese: "#ffe08a", sky: "#8ec5ff", lilac: "#c6a8ff" };

const lower = (s: string) => s[0].toLowerCase() + s.slice(1);
const demoBody = (i: number) => `${["First,", "Also,", "Finally,"][i]} ${lower(DEMO.reasons[i].reason)}. ${DEMO.reasons[i].example} ${DEMO.reasons[i].explain}`;
const demoIntro = `${DEMO.hook} Recess is the favorite part of the day for a lot of kids. ${DEMO.opinion}`;

const has = (label: string, ok: boolean, tip: string): Check => ({ label, ok, tip });

export const LESSONS: Lesson[] = [
  {
    id: "burger",
    icon: "🍔",
    title: "The Essay Burger",
    tagline: "Every strong essay has the same layers.",
    recipe: [
      { icon: "🍞", label: "Top bun: Introduction", detail: "Hook + your opinion" },
      { icon: "🥩", label: "Body 1", detail: "Reason 1 + example + explain" },
      { icon: "🥬", label: "Body 2", detail: "Reason 2 + example + explain" },
      { icon: "🍅", label: "Body 3", detail: "Reason 3 + example + explain" },
      { icon: "🧀", label: "Cheese (bonus)", detail: "Answer the other side" },
      { icon: "🍞", label: "Bottom bun: Conclusion", detail: "Your opinion again, in new words" },
    ],
    teach: [
      { title: "Why a burger?", body: "A burger without buns falls apart. So does an essay without an introduction and a conclusion. The graders look for a clear beginning, middle, and end. That is worth points!" },
      { title: "One job per paragraph", body: "Each paragraph has one job. The introduction grabs the reader and gives your opinion. Each body paragraph proves one reason. The conclusion wraps it up. New job? Press Enter twice and start a new paragraph." },
      { title: "The buns match", body: "Your conclusion repeats your opinion from the introduction, but in new words. That tells the reader you finished on purpose.", examples: ["Top bun: “I believe recess should be longer.”", "Bottom bun: “A few more minutes of play would make school better for everyone.”"] },
    ],
    model: {
      title: "A whole essay burger",
      parts: [
        { label: "🍞 Introduction", color: C.bun, text: demoIntro },
        { label: "🥩 Body 1", color: C.meat, text: demoBody(0) },
        { label: "🥬 Body 2", color: C.leaf, text: demoBody(1) },
        { label: "🍅 Body 3", color: C.tomato, text: demoBody(2) },
        { label: "🧀 Other side", color: C.cheese, text: `${DEMO.counter.claim} ${DEMO.counter.answer}` },
        { label: "🍞 Conclusion", color: C.bun, text: DEMO.ending },
      ],
      note: "Tap each layer to see its job. Notice that every body paragraph has the same three parts.",
    },
    practice: [
      { kind: "pick", q: "What goes in the introduction?", options: ["A hook and your opinion", "Your best example", "A goodbye", "All of your examples"], answer: 0, why: "The top bun grabs the reader (hook) and tells your side (opinion)." },
      { kind: "order", q: "Build the burger! Tap the paragraphs in the right order.", items: [demoIntro, demoBody(0), demoBody(1), DEMO.ending], why: "Introduction first, body paragraphs in the middle, conclusion last." },
      { kind: "pick", q: "Every body paragraph needs…", options: ["One sentence", "A reason, an example, and an explanation", "A question", "The words “the end”"], answer: 1, why: "Reason, proof, so-what. Every time." },
      { kind: "pick", q: "When do you start a new paragraph?", options: ["After every sentence", "Never. One big paragraph is best.", "When you start a new job, like a new reason", "When your fingers are tired"], answer: 2, why: "New job, new paragraph. Press Enter twice." },
      { kind: "pick", q: "Maya wrote an introduction and three body paragraphs. What did she forget?", options: ["A title", "The conclusion (bottom bun)", "Nothing", "A fourth reason"], answer: 1, why: "Without a bottom bun the essay just stops. Always wrap up." },
    ],
  },
  {
    id: "intro",
    icon: "🎣",
    title: "Power Intros",
    tagline: "Hook the reader, then tell your side.",
    recipe: [
      { icon: "🎣", label: "Hook", detail: "A question, a surprising fact, or a quick scene" },
      { icon: "🌉", label: "Bridge", detail: "One sentence about the topic" },
      { icon: "📣", label: "Opinion", detail: "“I believe ___ because ___, ___, and ___.”" },
    ],
    teach: [
      { title: "Hook 'em", body: "Your first sentence decides whether the reader wants more. Pick one of three hooks.", examples: ["❓ Question: “Have you ever wished the weekend lasted one more day?”", "🤯 Fact: “A dog can smell 10,000 times better than a person.”", "🎬 Scene: “Picture this: the bell rings and everyone races to the field.”"] },
      { title: "Don't announce", body: "Never start with “I am going to write about…” or “This essay is about…”. That is like a movie that begins with “This is a movie.” Just jump in!" },
      { title: "The opinion is a map", body: "Your opinion sentence tells your side and your reasons. It is the map for the whole essay. The word “because” does the magic.", examples: ["“I believe recess should be longer because kids need exercise, focus better after a break, and make more friends.”"] },
    ],
    model: {
      title: "An introduction, labeled",
      parts: [
        { label: "🎣 Hook", color: C.bun, text: DEMO.hook },
        { label: "🌉 Bridge", color: C.sky, text: "Recess is the favorite part of the day for a lot of kids." },
        { label: "📣 Opinion + map", color: C.leaf, text: DEMO.opinion },
      ],
      note: "Three sentences. Hook, bridge, opinion. The opinion names all three reasons, in the same order as the body paragraphs.",
    },
    practice: [
      { kind: "pick", q: "Prompt: Should kids get homework on weekends? Which hook grabs you most?", options: ["I am going to write about homework.", "Imagine it is Saturday morning, the sun is shining, and a stack of worksheets is waiting on your desk.", "Homework is a thing.", "This essay is about weekends."], answer: 1, why: "A scene puts the reader right there. The others announce or say nothing." },
      { kind: "pick", q: "What kind of hook is this? “A dog can smell 10,000 times better than a person.”", options: ["❓ Question", "🤯 Surprising fact", "🎬 Scene"], answer: 1, why: "It shares a fact that makes you say “Whoa!”" },
      { kind: "find", q: "Tap the OPINION sentence.", sentences: ["Have you ever wished you had a pet to play with after school?", "Lots of families are deciding whether to get a dog.", "I believe every family should get a dog because dogs keep you active, teach responsibility, and make you happy."], answer: 2, why: "It says the side (should get a dog) and names three reasons." },
      { kind: "order", q: "Put this introduction in order.", items: ["Picture this: you finally beat the hardest level and your whole brain lights up.", "Many parents wonder if video games are good for kids.", "I think kids should be allowed to play video games because they teach problem solving, build teamwork, and help kids relax."], why: "Hook, then bridge, then opinion." },
      { kind: "pick", q: "Which opinion sentence is the best map?", options: ["I think school uniforms are bad.", "Uniforms.", "I think schools should not have uniforms because kids should express themselves, uniforms cost money, and they are uncomfortable.", "Some people like uniforms and some people don't."], answer: 2, why: "It picks a side and names three reasons. The reader knows exactly what is coming." },
      {
        kind: "write",
        q: "Your turn! Write an introduction.",
        prompt: "Should kids be allowed to have their own phone at age 9?",
        starters: ["Have you ever", "Did you know that", "Picture this:", "I believe", "because"],
        check: (t) => checkPara("intro", t),
        sample: "Have you ever needed to call your mom but had no way to reach her? Lots of kids want their own phone. I believe kids should not have a phone at age 9 because phones distract from homework, they cost a lot, and kids need time outside.",
        minWords: 20,
      },
    ],
  },
  {
    id: "body",
    icon: "🧱",
    title: "Body Paragraph Builder",
    tagline: "Reason, proof, so-what.",
    recipe: [
      { icon: "🏷️", label: "Reason sentence", detail: "Start with a transition and say your reason" },
      { icon: "🔎", label: "Example", detail: "Prove it: something that happened, a fact, a what-if, or the article" },
      { icon: "💡", label: "Explain", detail: "“This shows that…” Connect it back to your opinion" },
    ],
    teach: [
      { title: "Three questions", body: "Every body paragraph answers three questions. What is my reason? How do I know? Why does it matter?" },
      { title: "Be specific", body: "Details win points. Small, real details make the reader believe you.", examples: ["🤏 Weak: “It is fun.”", "💪 Strong: “In art class we built a 20-block tower, and everybody cheered when it stood up.”"] },
      { title: "Don't forget the so-what", body: "Many writers stop after the example. Champions add one more sentence that ties it back to the opinion. Start it with “This shows that” or “That is why.”" },
    ],
    model: {
      title: "A body paragraph, labeled",
      parts: [
        { label: "🏷️ Reason", color: C.meat, text: "Also, kids focus better after a break." },
        { label: "🔎 Example", color: C.sky, text: DEMO.reasons[1].example },
        { label: "💡 Explain", color: C.leaf, text: DEMO.reasons[1].explain },
      ],
      note: "“Also,” is a transition. It tells the reader a new reason is coming.",
    },
    practice: [
      { kind: "order", q: "Put this body paragraph in order.", items: ["First, pets teach kids to be responsible.", "For example, I feed Ellie every morning and walk her after school, even when it is cold.", "This shows that taking care of a pet helps kids build good habits."], why: "Reason, then example, then explain." },
      { kind: "pick", q: "Which example is the most specific?", options: ["Dogs are nice.", "Dogs do stuff.", "My dog Ellie wakes me up every morning by licking my face, so I am never late for school.", "Everyone knows dogs are good."], answer: 2, why: "It has a name, a time, and something that really happens." },
      { kind: "pick", q: "Reason: Video games teach problem solving. Example: In one game I tried five ways to cross a river before I built a bridge. Which sentence explains the so-what?", options: ["Rivers are wet.", "This shows that games teach kids to keep trying until they solve a problem.", "I like that game a lot.", "The end."], answer: 1, why: "It connects the example back to the reason." },
      { kind: "find", q: "Tap the EXAMPLE sentence.", sentences: ["Another reason is that recess helps kids make friends.", "I have seen new kids join a soccer game and become friends by the end of recess.", "That is why recess helps kids feel like they belong."], answer: 1, why: "It is the proof: something the writer saw happen." },
      {
        kind: "write",
        q: "Your turn! Write one body paragraph.",
        prompt: "Reason: Pets make kids happier.",
        starters: ["First,", "Also,", "For example,", "One time,", "This shows that", "That is why"],
        check: (t) => checkPara("body", t),
        sample: "Also, pets make kids happier. For example, when I have a bad day, Ellie jumps on the couch and snuggles with me until I smile. This shows that a pet can cheer kids up when they feel down.",
        minWords: 25,
      },
    ],
  },
  {
    id: "transitions",
    icon: "🌉",
    title: "Transition Words",
    tagline: "Bridges that carry the reader from idea to idea.",
    recipe: [
      { icon: "🚦", label: "Start", detail: "First, To begin," },
      { icon: "➕", label: "Add more", detail: "Also, In addition, Another reason is" },
      { icon: "⭐", label: "Most important", detail: "Most importantly, Finally," },
      { icon: "🔎", label: "Example", detail: "For example, For instance, One time," },
      { icon: "💡", label: "Explain", detail: "This shows that, That is why, As a result," },
      { icon: "🔄", label: "Other side", detail: "However, On the other hand, Some people think" },
      { icon: "🏁", label: "Wrap up", detail: "In conclusion, All in all, To sum up," },
    ],
    teach: [
      { title: "Bridges between ideas", body: "Transition words are bridges. Without them, an essay feels choppy, like jumping from rock to rock. With them, the reader walks right across.", examples: ["😖 Choppy: “Dogs are great. They keep you active. They make you happy.”", "😎 Smooth: “Dogs are great. First, they keep you active. Also, they make you happy.”"] },
      { title: "Pick the right bridge", body: "Each transition has a job. “For example” brings proof. “However” turns to the other side. “In conclusion” says you are wrapping up. Look at the job list on the left." },
      { title: "Where they go", body: "Use one at the start of each body paragraph, before each example, and at the start of the conclusion. Most of them get a comma right after: “First, …” “For example, …”" },
    ],
    model: {
      title: "Spot the bridges",
      parts: [
        { label: "🚦 Start", color: C.bun, text: "First, kids need exercise to stay healthy." },
        { label: "🔎 Example", color: C.sky, text: "For example, doctors say kids need about an hour of exercise every day." },
        { label: "💡 Explain", color: C.leaf, text: "This shows that a short recess is not enough." },
        { label: "➕ Add more", color: C.meat, text: "Also, kids focus better after a break." },
        { label: "🔄 Other side", color: C.cheese, text: "However, some people think recess wastes learning time." },
        { label: "🏁 Wrap up", color: C.lilac, text: "In conclusion, a longer recess helps kids in many ways." },
      ],
      note: "The highlighted words are the bridges. Each one tells the reader what kind of sentence is coming.",
    },
    practice: [
      { kind: "pick", q: "Fill the gap: “____ kids need exercise to stay healthy.” (This is the first reason.)", options: ["First,", "However,", "In conclusion,", "For example,"], answer: 0, why: "“First,” starts your first reason." },
      { kind: "pick", q: "Fill the gap: “Kids focus better after recess. ____ after extra recess I finished my whole reading page.”", options: ["In conclusion,", "For example,", "However,", "First,"], answer: 1, why: "The second sentence is proof, so it needs “For example,”." },
      { kind: "pick", q: "Fill the gap: “Some people say recess wastes time. ____ recess helps kids learn better.”", options: ["Also,", "For example,", "However,", "First,"], answer: 2, why: "“However,” turns from the other side back to yours." },
      { kind: "pick", q: "Fill the gap: “Kids focus better after a break. ____ they make more friends.”", options: ["In addition,", "However,", "For example,", "In conclusion,"], answer: 0, why: "You are adding another reason, so “In addition,” fits." },
      { kind: "pick", q: "Fill the gap: “I stayed inside all day. ____ I felt grumpy and tired.”", options: ["For example,", "First,", "As a result,", "However,"], answer: 2, why: "The second thing happened because of the first. “As a result,” shows that." },
      { kind: "pick", q: "Fill the gap: “____ longer recess makes kids healthier, smarter, and happier.” (This is the last paragraph.)", options: ["For example,", "In conclusion,", "Next,", "Also,"], answer: 1, why: "“In conclusion,” tells the reader you are wrapping up." },
      { kind: "pick", q: "What job does “However” do?", options: ["Gives an example", "Ends the essay", "Turns to the other side", "Starts the first reason"], answer: 2, why: "“However” is a turn signal. It changes direction." },
      {
        kind: "write",
        q: "Fix this choppy paragraph. Type it again and add at least 3 transition words.",
        prompt: "Dogs are great pets. They keep you active. My dog makes me walk every day. They make you happy. Dogs are the best.",
        starters: ["First,", "For example,", "Also,", "In addition,", "That is why"],
        check: (t) => {
          const n = new Set(findTransitions(t).map((w) => w.toLowerCase())).size;
          return [
            has(`🌉 Transitions used: ${n} of 3`, n >= 3, "Add First, For example, Also, or That is why."),
            has("✂️ Still full sentences", sentences(t).length >= 4, "Keep every sentence. Just add the bridges."),
          ];
        },
        sample: "Dogs are great pets. First, they keep you active. For example, my dog makes me walk every day. Also, they make you happy. That is why dogs are the best.",
        minWords: 20,
      },
    ],
  },
  {
    id: "conclusion",
    icon: "🏁",
    title: "Strong Conclusions",
    tagline: "Wrap it up and leave them thinking.",
    recipe: [
      { icon: "🚩", label: "Signal", detail: "In conclusion, All in all, To sum up," },
      { icon: "🔁", label: "Restate", detail: "Your opinion, in NEW words" },
      { icon: "🧾", label: "Sum up", detail: "Your reasons in one sentence" },
      { icon: "✨", label: "Final thought", detail: "A wish, a call to action, or a what-if" },
    ],
    teach: [
      { title: "The bottom bun", body: "The conclusion tells the reader you are done and reminds them why you are right. It is the last thing the grader reads, so make it count." },
      { title: "New words, same idea", body: "Don't copy your opinion word for word. Say it a new way.", examples: ["Intro: “Recess should be longer.”", "Conclusion: “A few more minutes of play would make a big difference.”"] },
      { title: "No new reasons", body: "The conclusion is not the place for a brand-new reason. Wrap up the reasons you already proved." },
      { title: "Leave them thinking", body: "End with a final thought.", examples: ["✨ Wish: “I hope every school gives kids time to play.”", "📢 Call to action: “Principals, please add ten minutes to recess!”", "🤔 What-if: “Imagine how much happier kids would be.”"] },
    ],
    model: {
      title: "A conclusion, labeled",
      parts: [
        { label: "🚩 Signal + 🔁 Restate", color: C.bun, text: "In conclusion, a little more playtime would make a big difference for kids." },
        { label: "🧾 Sum up", color: C.sky, text: "Longer recess keeps kids healthy, helps them focus, and gives them time to make friends." },
        { label: "✨ Final thought", color: C.leaf, text: "Imagine a school where every kid comes back from recess ready to learn!" },
      ],
      note: "Three sentences: signal and restate, sum up, final thought.",
    },
    practice: [
      { kind: "pick", q: "Which is the strongest conclusion?", options: ["The end.", "In conclusion, that is all I have to say.", "In conclusion, pets make families happier and teach kids responsibility. Every family should think about adopting one!", "Also, cats are cute."], answer: 2, why: "It signals, restates, sums up, and ends with a call to action." },
      { kind: "pick", q: "What is wrong with this conclusion? “In conclusion, recess should be longer. Also, the cafeteria food is bad.”", options: ["It adds a new idea", "It is too long", "Nothing", "It has no transition"], answer: 0, why: "Cafeteria food is a new topic. The conclusion wraps up. It doesn't start something new." },
      { kind: "pick", q: "Which sentence restates “Kids should have less homework” in NEW words?", options: ["Kids should have less homework.", "Fewer worksheets would give kids time to play, rest, and be with family.", "Homework.", "I like pizza."], answer: 1, why: "Same idea, new words, and it even sums up the reasons." },
      { kind: "order", q: "Put this conclusion in order.", items: ["All in all, video games can be good for kids.", "They teach problem solving, build teamwork, and help kids relax.", "So next time you pick up a controller, remember you are training your brain!"], why: "Signal and restate, sum up, final thought." },
      {
        kind: "write",
        q: "Your turn! Write a conclusion.",
        prompt: "Your opinion was: Every family should get a dog because dogs keep you active, teach responsibility, and make you happy.",
        starters: ["In conclusion,", "All in all,", "To sum up,", "Imagine", "I hope"],
        check: (t) => checkPara("end", t),
        sample: "All in all, a dog would make any family better. Dogs get you moving, teach you to take care of someone, and cheer you up on bad days. Imagine coming home every day to a wagging tail!",
        minWords: 20,
      },
    ],
  },
  {
    id: "counter",
    icon: "🧀",
    title: "Answer the Other Side",
    tagline: "Show you thought about it, then win the argument.",
    recipe: [
      { icon: "👥", label: "Name the other side", detail: "“Some people think…”" },
      { icon: "🛡️", label: "Answer it", detail: "“However, …” or “But …”" },
      { icon: "🏆", label: "Finish strong", detail: "Explain why your side still wins" },
    ],
    teach: [
      { title: "The cheese layer", body: "Smart writers know some people disagree. Saying so shows you thought it through. Then you answer them. Graders love this move!" },
      { title: "Name it, then beat it", body: "Use two sentences. First say what the other side thinks. Then turn with “However” or “But” and explain why your side still wins.", examples: ["“Some people think a longer school day is too tiring.”", "“But a longer recess gives kids energy back, so the day feels easier.”"] },
      { title: "Keep it short", body: "The cheese is a slice, not the whole burger. Two or three sentences is plenty." },
    ],
    model: {
      title: "The other side, answered",
      parts: [
        { label: "👥 Other side", color: C.cheese, text: DEMO.counter.claim },
        { label: "🛡️ Answer", color: C.leaf, text: DEMO.counter.answer },
      ],
      note: "Two sentences. The turn word “But” does the work.",
    },
    practice: [
      { kind: "pick", q: "Which sentence names the other side?", options: ["First, dogs keep you active.", "Some people think dogs are too much work.", "In conclusion, get a dog.", "For example, I walk my dog."], answer: 1, why: "“Some people think” introduces the other side." },
      { kind: "pick", q: "Other side: “Some people think video games are a waste of time.” Which is the best answer?", options: ["That is true.", "However, many games teach kids to plan, solve puzzles, and work as a team.", "I like games.", "Games are games."], answer: 1, why: "It turns with “However” and gives a reason your side still wins." },
      {
        kind: "write",
        q: "Your turn! Name the other side, then answer it.",
        prompt: "Your opinion: Kids should get a longer recess.",
        starters: ["Some people think", "Others might say", "However,", "But"],
        check: (t) => checkPara("counter", t),
        sample: "Some people think longer recess means less learning. However, kids who get a real break pay better attention, so they actually learn more.",
        minWords: 15,
      },
    ],
  },
];

export const lessonById = (id?: string) => LESSONS.find((l) => l.id === id);

/** Which lesson a paragraph type should point back to. */
export const LESSON_FOR = { intro: "intro", body: "body", counter: "counter", end: "conclusion" } as const;
