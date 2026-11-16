import Anthropic from "@anthropic-ai/sdk";
import type { VercelRequest, VercelResponse } from "@vercel/node";
import { isUnlocked } from "./_passcode";

// Grades one essay against the Sudie L. Williams TAG Academy essay rubric
// (aligned to the STAAR grades 3-5 argumentative rubric). Needs the
// ANTHROPIC_API_KEY environment variable on Vercel. If it is missing,
// GET returns { enabled: false } and the app falls back to built-in checks.

const SKILL_IDS = [
  "capitals", "apostrophes", "endmarks", "runons", "commas", "homophones", "spelling",
  "thesis", "transitions", "hooks", "conclusions", "evidence", "wordchoice",
] as const;

const SYSTEM = `You score essays written by a 9-year-old (3rd grade) practicing for the Sudie L. Williams Talented and Gifted Academy (Dallas ISD) admission essay. The real test is a typed argumentative/opinion essay, 90 minutes, scored on this 100-point rubric aligned to STAAR grades 3-5:

PART 1: DEVELOPMENT AND ORGANIZATION OF IDEAS (60%). Each criterion scores exactly 15, 10, 5, or 0.
- argument (Argument/Opinion Development): 15 = argument is clear, focus consistent throughout. 10 = presented but not fully developed; focus not consistent, not easy to follow. 5 = present but not developed appropriately for the task. 0 = argument may be evident but nothing more.
- organization: 15 = effective introduction and conclusion; structure appropriate and supports development. 10 = limited; structure apparent but may not support logical development. 5 = minimal; intro OR conclusion may be present; logical structure not always evident. 0 = lacks intro and conclusion; no structure.
- evidence: 15 = specific, well-chosen, relevant; supports and develops the argument (text-based when a passage is given; for open prompts, specific examples, facts, or personal experiences count). 10 = limited, some irrelevant. 5 = insufficient or mostly irrelevant. 0 = none or irrelevant.
- expression (Idea Expression): 15 = clear and effective; word choice specific and purposeful. 10 = basic; word choice general and imprecise. 5 = ineffective; vague or limited words. 0 = unclear or incoherent.

PART 2: CONVENTIONS (40%). Score exactly 40, 20, or 0.
- 40 = consistent command of sentence construction, punctuation, capitalization, grammar, spelling; few errors and they do not impact clarity.
- 20 = inconsistent command; several errors but the reader can understand.
- 0 = little to no command; many errors that impact clarity.
Rule: if all four Part 1 criteria are 0, conventions is also 0. Judge conventions by grade-3 standards: STAAR gave a top conventions score to a response with a few missing apostrophes and one misspelling.

Calibrate to grade 3 STAAR: a focused, single-paragraph response with a clear opinion, relevant support, and an effective conclusion can earn full development points. Do not require five paragraphs. If the essay is off-topic or does not answer the prompt, argument and evidence should be 0 or 5.

Feedback is read by the child. Write at a 3rd-grade reading level, warm and specific, like an encouraging coach. Quote his words when praising or correcting. Never shame. "glows" are 2-3 specific things he did well. "grows" are the 2-3 most valuable fixes, each one concrete and doable next time. "levelUp" takes one real sentence from the essay and shows a stronger version. "skills" lists 1-4 skill ids he should drill next, most important first. "summary" is 1-2 sentences.`;

const SCHEMA = {
  type: "object",
  additionalProperties: false,
  required: ["argument", "organization", "evidence", "expression", "conventions", "summary", "glows", "grows", "levelUp", "skills"],
  properties: {
    argument: { type: "integer", enum: [0, 5, 10, 15] },
    organization: { type: "integer", enum: [0, 5, 10, 15] },
    evidence: { type: "integer", enum: [0, 5, 10, 15] },
    expression: { type: "integer", enum: [0, 5, 10, 15] },
    conventions: { type: "integer", enum: [0, 20, 40] },
    summary: { type: "string" },
    glows: { type: "array", items: { type: "string" } },
    grows: { type: "array", items: { type: "string" } },
    levelUp: {
      type: "object",
      additionalProperties: false,
      required: ["original", "better"],
      properties: { original: { type: "string" }, better: { type: "string" } },
    },
    skills: { type: "array", items: { type: "string", enum: [...SKILL_IDS] } },
  },
} as const;

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // Second lock behind the site middleware: no passcode cookie, no grading.
  if (!(await isUnlocked(req.headers.cookie))) return res.status(401).json({ error: "Family passcode required" });
  const enabled = Boolean(process.env.ANTHROPIC_API_KEY);
  if (req.method === "GET") return res.status(200).json({ enabled });
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });
  if (!enabled) return res.status(503).json({ error: "AI grading is not set up" });

  const { essay, prompt, passage } = (req.body ?? {}) as { essay?: string; prompt?: string; passage?: string };
  if (!essay || !prompt || essay.length > 12000) return res.status(400).json({ error: "Missing or oversized essay" });

  const client = new Anthropic();
  const userText = [
    `PROMPT:\n${prompt}`,
    passage ? `PASSAGE THE STUDENT READ:\n${passage}` : "This prompt had no reading passage; personal examples count as evidence.",
    `STUDENT ESSAY (typed exactly as written):\n<essay>\n${essay}\n</essay>`,
  ].join("\n\n");

  try {
    const response = await client.beta.messages.create({
      model: "claude-opus-5-5",
      max_tokens: 16000,
      betas: ["server-side-fallback-2026-07-01"],
      fallbacks: "default",
      output_config: { effort: "medium", format: { type: "json_schema", schema: SCHEMA } },
      system: SYSTEM,
      messages: [{ role: "user", content: userText }],
    });
    if (response.stop_reason === "refusal") return res.status(502).json({ error: "The grader declined this essay" });
    const text = response.content.flatMap((b) => (b.type === "text" ? [b.text] : [])).join("");
    const r = JSON.parse(text);
    const total = r.argument + r.organization + r.evidence + r.expression + r.conventions;
    return res.status(200).json({ ...r, total, source: "ai" });
  } catch (err) {
    if (err instanceof Anthropic.RateLimitError) return res.status(429).json({ error: "Too many requests. Try again in a minute." });
    if (err instanceof Anthropic.APIError) return res.status(502).json({ error: `Grader error (${err.status})` });
    if (err instanceof SyntaxError) return res.status(502).json({ error: "Grader returned bad data" });
    throw err;
  }
}
