import { useState } from "react";
import { lessonById } from "../data/lessons";
import { checkPara, KIND_LABEL, scanEssay, TRANSITIONS, type Job, type ParaKind } from "../lib/structure";

// Tools that bring the Writing School lessons into the essay itself: a
// transition word bank, live "does this paragraph have its parts?" checks,
// a quick lesson reminder, and a whole-essay structure scan for revising.

export const JOBS_FOR: Record<ParaKind, Job[]> = {
  intro: [],
  body: ["first", "add", "best", "example", "explain"],
  counter: ["other"],
  end: ["end"],
};

export function TransitionBank({ jobs, onPick }: { jobs?: Job[]; onPick: (w: string) => void }) {
  const list = jobs?.length ? TRANSITIONS.filter((t) => jobs.includes(t.job)) : TRANSITIONS;
  return (
    <div className="trans-bank">
      {list.map((t) => (
        <div key={t.job} className="tb-row">
          <span className="tb-job">{t.icon} {t.use}</span>
          {t.words.map((w) => (
            <button key={w} type="button" className="chip" onClick={() => onPick(w)}>{w}</button>
          ))}
        </div>
      ))}
    </div>
  );
}

export function ParaChecks({ kind, text }: { kind: ParaKind; text: string }) {
  const checks = checkPara(kind, text);
  const done = checks.filter((c) => c.ok).length;
  const firstMissing = checks.find((c) => !c.ok);
  return (
    <>
      <div className="live-checks">
        <span className="lc" style={{ fontWeight: 800 }}>Parts: {done}/{checks.length}</span>
        {checks.map((c) => (
          <span key={c.label} className={`lc ${c.ok ? "ok" : ""}`} title={c.tip}>{c.ok ? "✅" : "⬜"} {c.label}</span>
        ))}
      </div>
      {text.trim().length > 15 && firstMissing && <div className="hint" style={{ marginTop: 6 }}>👉 {firstMissing.tip}</div>}
    </>
  );
}

const JOB: Record<ParaKind, string> = {
  intro: "Grab the reader, say your opinion, and preview your reasons.",
  body: "Give ONE reason, prove it with an example, and explain why it matters.",
  counter: "Show the other side, then answer it.",
  end: "Wrap up: say your opinion again in new words and leave a final thought.",
};

/**
 * The big, can't-miss checklist above each paragraph box. The next missing
 * part glows with its tip, so Dev always knows exactly what to write now.
 */
export function ParaMission({ kind, text }: { kind: ParaKind; text: string }) {
  const checks = checkPara(kind, text);
  const done = checks.filter((c) => c.ok).length;
  const now = checks.findIndex((c) => !c.ok);
  const all = now < 0;
  return (
    <div className={`pm ${all ? "all" : ""}`}>
      <div className="pm-head">
        <span className="pm-kind">🎯 {KIND_LABEL[kind]}</span>
        <span className="pm-count">{done}/{checks.length} done</span>
      </div>
      <p className="pm-job">{JOB[kind]}</p>
      <ol className="pm-list">
        {checks.map((c, i) => (
          <li key={c.label} className={c.ok ? "ok" : i === now ? "now" : ""}>
            <span className="ml-box">{c.ok ? "✅" : i === now ? "👉" : "⬜"}</span>
            <span>
              <b>{c.label}</b>
              {i === now && <span className="ml-tip">{c.tip}</span>}
            </span>
          </li>
        ))}
      </ol>
      {all && <div className="pm-win">🌟 This paragraph has every part. On to the next one!</div>}
    </div>
  );
}

const LESSON_OF: Record<ParaKind, string> = { intro: "intro", body: "body", counter: "counter", end: "conclusion" };

export function LessonReminder({ kind }: { kind: ParaKind }) {
  const [open, setOpen] = useState(false);
  const l = lessonById(LESSON_OF[kind]);
  if (!l) return null;
  return (
    <>
      <button type="button" className="btn ghost small-btn" onClick={() => setOpen(!open)}>{open ? "Hide reminder" : `📚 Remind me: ${l.title}`}</button>
      {open && (
        <div className="recipe-stack" style={{ marginTop: 8, flexBasis: "100%" }}>
          {l.recipe.map((r) => (
            <div key={r.label} className="recipe-layer"><span className="rl-icon">{r.icon}</span><span><b>{r.label}</b><small>{r.detail}</small></span></div>
          ))}
        </div>
      )}
    </>
  );
}

/** Whole-essay check: what each paragraph is doing and what it is missing. */
export function StructureScan({ text }: { text: string }) {
  const scan = scanEssay(text);
  const n = scan.paras.length;
  const uniq = new Set(scan.transitions.map((t) => t.toLowerCase())).size;
  return (
    <div className="structure-scan">
      <h3 style={{ margin: 0 }}>🍔 Structure check</h3>
      <div className="live-checks">
        <span className={`lc ${n >= 4 ? "ok" : ""}`}>{n >= 4 ? "✅" : "⬜"} {n} paragraphs (aim for 4 or 5)</span>
        <span className={`lc ${uniq >= 4 ? "ok" : ""}`}>{uniq >= 4 ? "✅" : "⬜"} {uniq} different transition words (aim for 4+)</span>
      </div>
      {n < 3 && <div className="hint">👉 Split your essay into paragraphs. Press Enter twice before each new reason and before your conclusion.</div>}
      {scan.paras.map((p, i) => {
        const miss = p.checks.filter((c) => !c.ok);
        return (
          <div key={i} className="ss-para">
            <b>{KIND_LABEL[p.kind]}</b> <span className="small muted">({p.checks.length - miss.length}/{p.checks.length} parts)</span>
            <div className="ss-text">{p.text}</div>
            <div className="live-checks" style={{ marginTop: 0 }}>
              {p.checks.map((c) => <span key={c.label} className={`lc ${c.ok ? "ok" : ""}`} title={c.tip}>{c.ok ? "✅" : "⬜"} {c.label}</span>)}
            </div>
            {miss[0] && <div className="small" style={{ marginTop: 4 }}>👉 {miss[0].tip}</div>}
          </div>
        );
      })}
    </div>
  );
}
