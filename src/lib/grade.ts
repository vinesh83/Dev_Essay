import type { Prompt } from "../data/prompts";
import { estimateScore } from "./analyze";
import type { RubricScore } from "./store";

let aiEnabled: Promise<boolean> | null = null;

export function isAiEnabled(): Promise<boolean> {
  aiEnabled ??= fetch("/api/grade")
    .then((r) => (r.ok ? r.json() : { enabled: false }))
    .then((j) => Boolean(j.enabled))
    .catch(() => false);
  return aiEnabled;
}

export type GradeResult = RubricScore;

/** AI grade when available, otherwise the built-in estimate. */
export async function gradeEssay(text: string, prompt: Prompt): Promise<GradeResult> {
  if (await isAiEnabled()) {
    try {
      const r = await fetch("/api/grade", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          essay: text,
          prompt: prompt.question,
          passage: prompt.passage ? `${prompt.passage.title}\n\n${prompt.passage.paragraphs.join("\n\n")}` : undefined,
        }),
      });
      if (r.ok) return (await r.json()) as GradeResult;
      const err = await r.json().catch(() => ({}));
      return { ...estimateScore(text), note: `AI grader unavailable (${err.error ?? r.status}). Showing the built-in estimate.` };
    } catch {
      return { ...estimateScore(text), note: "Could not reach the AI grader. Showing the built-in estimate." };
    }
  }
  return estimateScore(text);
}
