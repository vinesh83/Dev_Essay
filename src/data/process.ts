// The seven-step writing process Dev repeats on every essay until it is
// automatic. Minutes are the budget for the real 90-minute test.

export type StepId = "unpack" | "side" | "brainstorm" | "plan" | "draft" | "revise" | "proofread";

export const STEPS: { id: StepId; name: string; icon: string; minutes: number; goal: string }[] = [
  { id: "unpack", name: "Unpack the Prompt", icon: "🔍", minutes: 5, goal: "Find what the prompt asks you to do and pick out its key words." },
  { id: "side", name: "Pick a Side", icon: "⚖️", minutes: 2, goal: "Choose the side you can explain best, not the one that sounds smartest." },
  { id: "brainstorm", name: "Brainstorm", icon: "💡", minutes: 8, goal: "List as many reasons as you can, then circle your best three." },
  { id: "plan", name: "Plan the Burger", icon: "🍔", minutes: 5, goal: "Hook + opinion, three reasons with examples, then the ending." },
  { id: "draft", name: "Write the Draft", icon: "✍️", minutes: 45, goal: "Turn the plan into paragraphs. Keep going. Fix later." },
  { id: "revise", name: "Revise", icon: "🔧", minutes: 15, goal: "Make the ideas stronger: clearer opinion, better examples, stronger words." },
  { id: "proofread", name: "Proofread (CAPS)", icon: "🔎", minutes: 10, goal: "Capitals, Apostrophes, Punctuation, Spelling. Read it slowly, one sentence at a time." },
];

export const REVISE_CHECKS = [
  "My opinion is clear in the first paragraph.",
  "Each body paragraph has ONE reason.",
  "Every reason has a specific example or evidence.",
  "I explained each example (\"This shows that…\").",
  "I used transition words (First, Another reason, Finally).",
  "My conclusion restates my opinion in new words.",
  "I swapped at least two tired words (good, fun, a lot) for stronger ones.",
];

export const PROOF_CHECKS = [
  "C: Every sentence starts with a capital, and so does \"I\".",
  "A: Contractions have apostrophes (don't, it's, can't).",
  "P: Every sentence ends with . ? or ! and has commas after transition words.",
  "S: I checked spelling, especially because, believe, friend, really.",
  "No run-ons: long sentences are split up.",
];

export const UNPACK_QUESTIONS = [
  { q: "What kind of essay is this?", choices: ["A story about my day", "An opinion essay: I pick a side and prove it", "A list of facts"], correct: 1 },
  { q: "What must my essay include?", choices: ["Just my opinion", "My opinion plus reasons and examples", "Only examples"], correct: 1 },
];
