import type { SkillId } from "../data/drills";
import type { RubricScore } from "./store";

// Built-in essay checks. These run instantly and offline. They are a rough
// estimate of the Sudie TAG rubric, used when AI grading is not set up and
// to give live hints while Dev writes.

export type Issue = { skill: SkillId; message: string; sample?: string };

export type Analysis = {
  words: number;
  sentences: number;
  paragraphs: number;
  avgSentence: number;
  hasOpinion: boolean;
  transitions: string[];
  hasConclusion: boolean;
  evidenceMarkers: number;
  tiredWords: string[];
  issues: Issue[];
};

const OPINION = /\b(i (strongly )?(think|believe|feel)|in my opinion|should|shouldn't|should not|is better|are better|the best|i agree|i disagree)\b/i;
const TRANSITIONS = [
  "first", "first of all", "to begin", "second", "third", "next", "another reason", "also", "in addition",
  "furthermore", "for example", "for instance", "however", "on the other hand", "finally", "lastly",
  "in conclusion", "to sum up", "as a result", "because of this", "therefore", "most importantly",
];
const CONCLUSION = /\b(in conclusion|to sum up|in summary|that is why|that's why|this is why|overall|all in all|for these reasons)\b/i;
const EVIDENCE = /\b(for example|for instance|according to|the (article|text|passage|author) (says|states|shows)|in the (article|text|passage)|one time|once|when i|this shows|this proves|studies|a study|percent|\d+)\b/gi;
const TIRED = ["good", "bad", "nice", "fun", "a lot", "lots", "stuff", "things", "very", "really", "cool", "awesome", "kinda", "gonna"];

const CONTRACTIONS: Record<string, string> = {
  dont: "don't", cant: "can't", wont: "won't", isnt: "isn't", arent: "aren't", didnt: "didn't",
  doesnt: "doesn't", wouldnt: "wouldn't", couldnt: "couldn't", shouldnt: "shouldn't", wasnt: "wasn't",
  werent: "weren't", havent: "haven't", hasnt: "hasn't", thats: "that's", whats: "what's", theyre: "they're",
  youre: "you're", im: "I'm", ive: "I've", lets: "let's", hes: "he's", shes: "she's", theres: "there's",
};
const MISSPELL: Record<string, string> = {
  becuase: "because", beacuse: "because", becase: "because", becouse: "because", beleive: "believe",
  belive: "believe", freind: "friend", frend: "friend", importent: "important", inportant: "important",
  diffrent: "different", diferent: "different", peple: "people", poeple: "people", reely: "really",
  realy: "really", untill: "until", probly: "probably", alot: "a lot", wich: "which", thier: "their",
  beutiful: "beautiful", definately: "definitely", finaly: "finally", tomorow: "tomorrow", wierd: "weird",
  togather: "together", everthing: "everything", opinon: "opinion", conclution: "conclusion",
  exampel: "example", becuz: "because", cuz: "because", wanna: "want to", alright: "all right",
  enviroment: "environment", favrite: "favorite", favorit: "favorite", animels: "animals", scool: "school",
  shool: "school", studants: "students", sciense: "science", libary: "library", untile: "until",
};

export function splitSentences(text: string): string[] {
  return text
    .replace(/\s+/g, " ")
    .split(/(?<=[.!?])\s+/)
    .map((s) => s.trim())
    .filter((s) => /[a-z]/i.test(s));
}

export function analyze(text: string): Analysis {
  const clean = text.trim();
  const wordList = clean.match(/[A-Za-z']+/g) ?? [];
  const words = wordList.length;
  const sentences = splitSentences(clean);
  const paragraphs = clean.split(/\n\s*\n|\n/).filter((p) => p.trim().split(/\s+/).length >= 4).length;
  const lower = clean.toLowerCase();
  const issues: Issue[] = [];

  // Capitals
  const lowerStarts = sentences.filter((s) => /^[a-z]/.test(s));
  if (lowerStarts.length) issues.push({ skill: "capitals", message: `${lowerStarts.length} sentence(s) start with a lowercase letter.`, sample: lowerStarts[0].slice(0, 40) });
  if (/(^|[\s,])i([\s,.!?']|$)/.test(clean)) issues.push({ skill: "capitals", message: "The word \"I\" should always be a capital." });

  // Apostrophes
  const missing = new Set<string>();
  for (const w of wordList) {
    const fix = CONTRACTIONS[w.toLowerCase()];
    // "lets" and "hes"/"shes" can be real words, only flag the clear ones.
    if (fix && !["lets", "hes", "shes", "im"].includes(w.toLowerCase())) missing.add(`${w} → ${fix}`);
    if (w === "im" || w === "Im") missing.add(`${w} → I'm`);
  }
  if (missing.size) issues.push({ skill: "apostrophes", message: `Missing apostrophes: ${[...missing].slice(0, 4).join(", ")}` });

  // Spelling
  const misspelled = new Set<string>();
  for (const w of wordList) {
    const fix = MISSPELL[w.toLowerCase()];
    if (fix) misspelled.add(`${w} → ${fix}`);
  }
  if (misspelled.size) issues.push({ skill: "spelling", message: `Check spelling: ${[...misspelled].slice(0, 4).join(", ")}` });

  // End marks
  if (clean.length > 30 && !/[.!?]["')]?\s*$/.test(clean)) issues.push({ skill: "endmarks", message: "Your last sentence needs an end mark." });
  if (/!{2,}|\?{2,}/.test(clean)) issues.push({ skill: "endmarks", message: "Use just one ! or ? at a time." });
  const exclaims = (clean.match(/!/g) ?? []).length;
  if (exclaims > 3) issues.push({ skill: "endmarks", message: `You used ${exclaims} exclamation points. Try periods for most sentences.` });

  // Run-ons: very long sentences, or many "and"s chained
  const longOnes = sentences.filter((s) => s.split(/\s+/).length > 35 || (s.match(/\band\b/gi) ?? []).length >= 4);
  if (longOnes.length) issues.push({ skill: "runons", message: `${longOnes.length} sentence(s) may be run-ons. Split long sentences.`, sample: longOnes[0].slice(0, 50) + "…" });
  if (sentences.length <= 2 && words > 80) issues.push({ skill: "runons", message: "Almost no periods. Break your writing into sentences." });

  // Commas after intro transitions
  const noComma = clean.match(/\b(First|Second|Also|Finally|However|For example|In conclusion|Lastly|Next|In addition) [a-z]/g);
  if (noComma) issues.push({ skill: "commas", message: `Add a comma after: ${[...new Set(noComma.map((m) => m.replace(/ [a-z]$/, "")))].join(", ")}` });

  // Homophones that are often wrong
  if (/\b(their|there) (is|are|was|were) (going|gonna)\b/i.test(clean) || /\btheir going\b/i.test(clean)) issues.push({ skill: "homophones", message: "Check their / there / they're." });
  if (/\bits (a|an|the|very|so|not|important|good|fun|my)\b/i.test(clean)) issues.push({ skill: "homophones", message: "\"its\" vs \"it's\": it's = it is." });
  if (/\byour (going|welcome|right|the best)\b/i.test(clean)) issues.push({ skill: "homophones", message: "\"your\" vs \"you're\": you're = you are." });

  // Ideas
  const firstPart = sentences.slice(0, 3).join(" ");
  const hasOpinion = OPINION.test(firstPart);
  if (words > 20 && !hasOpinion) issues.push({ skill: "thesis", message: "State your opinion clearly near the start (\"I believe…\")." });
  const transitions = TRANSITIONS.filter((t) => new RegExp(`\\b${t}\\b`, "i").test(lower));
  if (words > 80 && transitions.length < 3) issues.push({ skill: "transitions", message: "Use more transition words (First, Another reason, For example, In conclusion)." });
  const last = sentences.slice(-3).join(" ");
  const hasConclusion = CONCLUSION.test(last) || (sentences.length >= 4 && OPINION.test(sentences[sentences.length - 1] ?? ""));
  if (words > 80 && !hasConclusion) issues.push({ skill: "conclusions", message: "Add a conclusion that restates your opinion." });
  if (/^(hi|hello)\b|my name is/i.test(clean)) issues.push({ skill: "hooks", message: "Don't introduce yourself. Start with a hook instead." });
  const evidenceMarkers = (clean.match(EVIDENCE) ?? []).length;
  if (words > 80 && evidenceMarkers < 2) issues.push({ skill: "evidence", message: "Add specific examples (\"For example…\", \"In the article…\")." });
  const tiredWords = TIRED.filter((t) => new RegExp(`\\b${t}\\b`, "i").test(lower));
  const tiredCount = tiredWords.reduce((a, t) => a + (lower.match(new RegExp(`\\b${t}\\b`, "g")) ?? []).length, 0);
  if (tiredCount >= 4) issues.push({ skill: "wordchoice", message: `Swap tired words for stronger ones: ${tiredWords.slice(0, 5).join(", ")}` });

  return {
    words,
    sentences: sentences.length,
    paragraphs,
    avgSentence: sentences.length ? Math.round(words / sentences.length) : 0,
    hasOpinion,
    transitions,
    hasConclusion,
    evidenceMarkers,
    tiredWords,
    issues,
  };
}

const step = (n: number) => (n >= 3 ? 15 : n === 2 ? 10 : n === 1 ? 5 : 0);

/** Rough rubric estimate from the built-in checks. */
export function estimateScore(text: string): RubricScore {
  const a = analyze(text);
  const issueCount = (skills: SkillId[]) => a.issues.filter((i) => skills.includes(i.skill)).length;

  if (a.words < 25) {
    return {
      argument: 0, organization: 0, evidence: 0, expression: 0, conventions: 0, total: 0,
      summary: "This is too short to score. Aim for at least 150 words.",
      glows: [], grows: ["Write more! Plan three reasons and an example for each."], skills: ["thesis", "evidence"], source: "auto",
    };
  }

  const argument = step((a.hasOpinion ? 2 : 0) + (a.words >= 150 ? 1 : 0));
  const organization = step((a.paragraphs >= 3 ? 1 : 0) + (a.transitions.length >= 3 ? 1 : 0) + (a.hasConclusion ? 1 : 0));
  const evidence = step(Math.min(3, a.evidenceMarkers) - (a.words < 120 ? 1 : 0));
  const expression = step(3 - (a.tiredWords.length >= 4 ? 1 : 0) - (a.avgSentence < 6 ? 1 : 0) - (issueCount(["runons"]) ? 1 : 0));
  const convErrors = issueCount(["capitals", "apostrophes", "spelling", "endmarks", "runons", "commas", "homophones"]);
  let conventions = convErrors <= 1 ? 40 : convErrors <= 4 ? 20 : 0;
  const development = argument + organization + evidence + expression;
  if (development === 0) conventions = 0; // STAAR rule

  const glows: string[] = [];
  if (a.hasOpinion) glows.push("You stated your opinion clearly.");
  if (a.transitions.length >= 3) glows.push(`Nice transitions: ${a.transitions.slice(0, 3).join(", ")}.`);
  if (a.hasConclusion) glows.push("You wrapped up with a conclusion.");
  if (a.paragraphs >= 4) glows.push("Great paragraph structure.");
  if (convErrors <= 1) glows.push("Very clean capitals, spelling, and punctuation.");

  const skills = [...new Set(a.issues.map((i) => i.skill))];
  return {
    argument, organization, evidence, expression, conventions,
    total: development + conventions,
    summary: "Quick estimate from the built-in checker. A teacher or AI score may differ.",
    glows: glows.slice(0, 3),
    grows: a.issues.slice(0, 4).map((i) => i.message),
    skills,
    source: "auto",
  };
}
