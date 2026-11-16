// Essay structure helpers: the transition word bank, and live checks that
// tell Dev whether each paragraph has the parts it needs.

export type Job = "first" | "add" | "example" | "explain" | "order" | "other" | "best" | "end";

export const TRANSITIONS: { job: Job; icon: string; name: string; use: string; words: string[] }[] = [
  { job: "first", icon: "🚦", name: "Start", use: "Start your first reason", words: ["First,", "To begin,", "First of all,"] },
  { job: "add", icon: "➕", name: "Add more", use: "Add another reason", words: ["Also,", "In addition,", "Another reason is", "Besides that,", "On top of that,"] },
  { job: "best", icon: "⭐", name: "Most important", use: "Save your best reason for last", words: ["Most importantly,", "Above all,", "The biggest reason is", "Finally,"] },
  { job: "example", icon: "🔎", name: "Example", use: "Give proof", words: ["For example,", "For instance,", "One time,", "Once,"] },
  { job: "explain", icon: "💡", name: "Explain", use: "Tell why it matters", words: ["This shows that", "This means", "That is why", "As a result,", "Because of this,"] },
  { job: "order", icon: "🔢", name: "Order", use: "Tell what happened next", words: ["Next,", "Then,", "After that,", "Later,"] },
  { job: "other", icon: "🔄", name: "Other side", use: "Answer the other side", words: ["However,", "On the other hand,", "Some people think", "Even so,", "But"] },
  { job: "end", icon: "🏁", name: "Wrap up", use: "Start your conclusion", words: ["In conclusion,", "All in all,", "To sum up,", "That is why I believe"] },
];

export const jobWords = (...jobs: Job[]) => TRANSITIONS.filter((t) => jobs.includes(t.job)).flatMap((t) => t.words);

const ALL = TRANSITIONS.flatMap((t) => t.words.map((w) => w.replace(/,$/, "").toLowerCase()));
const esc = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
const TRANS_RE = new RegExp(`(^|[.!?]\\s+|\\n\\s*)(${ALL.map(esc).join("|")})\\b`, "gi");
const START_RE = new RegExp(`^\\s*(${ALL.map(esc).join("|")})\\b`, "i");

/** Transition words that start a sentence. */
export function findTransitions(text: string): string[] {
  return [...text.matchAll(TRANS_RE)].map((m) => m[2]);
}

/** Wrap transition words in <mark> spans for highlighting (returns pieces). */
export function splitTransitions(text: string): { t: string; mark: boolean }[] {
  const out: { t: string; mark: boolean }[] = [];
  let last = 0;
  for (const m of text.matchAll(TRANS_RE)) {
    const start = m.index! + m[1].length;
    out.push({ t: text.slice(last, start), mark: false }, { t: m[2], mark: true });
    last = start + m[2].length;
  }
  out.push({ t: text.slice(last), mark: false });
  return out.filter((p) => p.t);
}

export const sentences = (t: string) => (t.match(/[^.!?]+[.!?]+/g) ?? []).map((s) => s.trim()).filter((s) => /[a-z]/i.test(s));

export type ParaKind = "intro" | "body" | "counter" | "end";
export type Check = { label: string; ok: boolean; tip: string };

const HOOK_RE = /\?|^(did you know|picture|imagine|have you|what if|one time|every|most|almost)|\d/i;
const OPINION_RE = /\b(i (strongly )?(believe|think|feel)|in my opinion|should|should not|shouldn't)\b/i;
const EXAMPLE_RE = /\b(for example|for instance|one time|once|i have seen|i saw|did you know|the article|according to|imagine|last (year|week|summer))\b/i;
const EXPLAIN_RE = /\b(this shows|this means|that is why|that's why|this matters|as a result|because of this|so that|which means|this proves)\b/i;
const OTHER_RE = /\b(some people|others (might|may)|on the other hand|people who disagree|some (kids|parents|teachers))\b/i;
const ANSWER_RE = /\b(but|however|even so|still|actually)\b/i;
const END_RE = /^(in conclusion|all in all|to sum up|in the end|that is why i believe|overall|to conclude)/i;
const ANNOUNCE_RE = /\b(i am going to (write|tell)|this essay (is|will)|i will (write|tell you)|my essay is about)\b/i;

export function checkPara(kind: ParaKind, text: string): Check[] {
  const ss = sentences(text);
  const first = ss[0] ?? text.trim();
  if (kind === "intro") {
    return [
      { label: "🎣 Hook first", ok: !!first && HOOK_RE.test(first) && !OPINION_RE.test(first), tip: "Start with a question, a surprising fact, or a quick scene." },
      { label: "📣 Opinion sentence", ok: OPINION_RE.test(text), tip: "Say your side: “I believe … should …”" },
      { label: "🗺️ Reasons preview", ok: /\bbecause\b/i.test(text), tip: "Add “because” and name your reasons." },
      { label: "🙅 No announcing", ok: !ANNOUNCE_RE.test(text), tip: "Skip “I am going to write about…”. Just jump in." },
    ];
  }
  if (kind === "body") {
    return [
      { label: "🌉 Starts with a transition", ok: START_RE.test(first), tip: "Begin with First, Also, or Most importantly." },
      { label: "🔎 Example", ok: EXAMPLE_RE.test(text), tip: "Prove it: “For example, …”" },
      { label: "💡 Explain the so-what", ok: EXPLAIN_RE.test(text), tip: "Add “This shows that …”" },
      { label: "📏 3+ sentences", ok: ss.length >= 3, tip: "Reason, example, explain: at least three sentences." },
    ];
  }
  if (kind === "counter") {
    return [
      { label: "👥 Other side", ok: OTHER_RE.test(text), tip: "“Some people think …”" },
      { label: "🛡️ Your answer", ok: ANSWER_RE.test(text), tip: "“But …” or “However, …”" },
    ];
  }
  return [
    { label: "🏁 Wrap-up signal", ok: END_RE.test(first), tip: "Start with “In conclusion,” or “All in all,”." },
    { label: "🔁 Opinion again", ok: OPINION_RE.test(text) || /\b(would|is the best|is better|matters)\b/i.test(text), tip: "Say your side again in new words." },
    { label: "✨ Final thought", ok: ss.length >= 2, tip: "End with a wish, a what-if, or a call to action." },
  ];
}

const words = (t: string) => (t.match(/[A-Za-z']+/g) ?? []).length;

/** Guess what each paragraph is doing, then check it. */
export function scanEssay(text: string) {
  const paras = text.split(/\n\s*\n|\n(?=\s*\S)/).map((p) => p.trim()).filter((p) => words(p) > 0);
  const kinds: ParaKind[] = paras.map((p, i) => {
    if (i === 0) return "intro";
    if (i === paras.length - 1 && paras.length >= 3) return "end";
    return OTHER_RE.test(p) && ANSWER_RE.test(p) ? "counter" : "body";
  });
  return {
    paras: paras.map((p, i) => ({ text: p, kind: kinds[i], checks: checkPara(kinds[i], p) })),
    transitions: findTransitions(text),
  };
}

export const KIND_LABEL: Record<ParaKind, string> = { intro: "🍞 Introduction", body: "🥩 Body", counter: "🧀 Other side", end: "🍞 Conclusion" };
