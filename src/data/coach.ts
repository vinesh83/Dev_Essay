// Coaching content for the guided thinking steps: idea sparks, sentence
// starters, and one fully worked example the coach can show at each step.
// The worked example uses its own prompt (recess) so Dev sees the moves
// without being handed answers for the prompt he is working on.

export const SPARKS: { icon: string; label: string; q: string }[] = [
  { icon: "💪", label: "Health", q: "Does it make kids healthier or less healthy?" },
  { icon: "🧠", label: "Learning", q: "Does it help kids learn more, or get in the way?" },
  { icon: "👫", label: "Friends", q: "What does it do for friends or getting along?" },
  { icon: "🏠", label: "Family", q: "How does it change things for families at home?" },
  { icon: "⏰", label: "Time", q: "Does it save time or use up time?" },
  { icon: "🛡️", label: "Safety", q: "Is it safer or more dangerous?" },
  { icon: "💵", label: "Money", q: "Does it cost money or save money?" },
  { icon: "😄", label: "Feelings", q: "How would kids feel: happy, bored, stressed, proud?" },
  { icon: "⚖️", label: "Fairness", q: "Is it fair to everyone?" },
  { icon: "🚀", label: "Future", q: "How could it help or hurt kids when they grow up?" },
];

export const EXAMPLE_KINDS: { id: string; icon: string; label: string; starter: string }[] = [
  { id: "me", icon: "🙋", label: "Something that happened to me", starter: "One time, I " },
  { id: "fact", icon: "📊", label: "A fact I know", starter: "Did you know that " },
  { id: "whatif", icon: "🤔", label: "Imagine if…", starter: "Imagine if " },
  { id: "others", icon: "👀", label: "Something I saw others do", starter: "I have seen " },
  { id: "article", icon: "📰", label: "From the article", starter: "The article says that " },
];

export const HOOK_KINDS: { id: string; icon: string; label: string; starter: string }[] = [
  { id: "question", icon: "❓", label: "Ask a question", starter: "Have you ever " },
  { id: "fact", icon: "🤯", label: "Surprising fact", starter: "Did you know that " },
  { id: "scene", icon: "🎬", label: "Quick scene", starter: "Picture this: " },
];

export const BODY_STARTERS = ["First,", "Another reason is", "The most important reason is", "Finally,"];
export const EXAMPLE_STARTERS = ["For example,", "For instance,", "One time,"];
export const EXPLAIN_STARTERS = ["This shows that", "This matters because", "That is why"];
export const COUNTER_STARTERS = ["Some people think", "Others might say"];
export const ANSWER_STARTERS = ["But", "However,", "Even so,"];
export const END_STARTERS = ["In conclusion,", "That is why I believe", "All in all,"];

/** The worked example the coach shows. Prompt: Should recess be longer? */
export const DEMO = {
  question: "Should recess be longer, even if the school day has to be longer too?",
  sides: ["Yes, longer recess", "No, keep it the same"] as [string, string],
  pros: [
    { text: "Kids need exercise to stay healthy", why: "Running and playing makes your heart and muscles strong.", example: true, matters: true },
    { text: "Kids focus better after a break", why: "Your brain needs a rest so it can pay attention again.", example: true, matters: true },
    { text: "More time to make friends", why: "Recess is when kids play together and solve problems.", example: true, matters: false },
  ],
  cons: [
    { text: "The school day would end later", why: "Families would have to change pick-up times.", example: true, matters: true },
    { text: "Less time for learning", why: "Teachers might rush through lessons.", example: false, matters: true },
    { text: "It can get too hot outside", why: "Texas afternoons are hot.", example: true, matters: false },
  ],
  pick: "I picked YES. That side has two strong reasons I can really prove with examples. The NO side has one strong reason, and I can answer it.",
  hook: "Have you ever tried to sit still in class after a whole morning of math?",
  opinion: "I believe recess should be longer because kids need exercise, they focus better after a break, and they make more friends.",
  reasons: [
    { reason: "Kids need exercise to stay healthy", kind: "fact", example: "Doctors say kids need about an hour of exercise every day.", explain: "This shows that a short recess is not enough to keep kids healthy." },
    { reason: "Kids focus better after a break", kind: "me", example: "One time, after we had extra recess, I finished my whole reading page without daydreaming.", explain: "This matters because kids learn more when their brains are rested." },
    { reason: "More time to make friends", kind: "others", example: "I have seen new kids join a soccer game and become friends by the end of recess.", explain: "That is why recess helps kids feel like they belong." },
  ],
  counter: { claim: "Some people think a longer school day is too tiring.", answer: "But a longer recess actually gives kids energy back, so the day feels easier." },
  ending: "In conclusion, a longer recess would make kids healthier, smarter, and happier. It is worth a few extra minutes!",
};

/** Strength of a reason from two yes/no checks. */
export const strength = (example?: boolean, matters?: boolean): 0 | 1 | 2 | 3 =>
  example === undefined || matters === undefined ? 0 : example && matters ? 3 : example || matters ? 2 : 1;

export const STRENGTH_LABEL: Record<number, string> = { 0: "Not rated", 1: "🤏 Weak", 2: "👍 OK", 3: "💪 Strong" };
