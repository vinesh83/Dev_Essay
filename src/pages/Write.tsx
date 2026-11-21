import { useEffect, useMemo, useRef, useState } from "react";
import { go } from "../App";
import Results from "../components/Results";
import { StructureScan, TransitionBank } from "../components/StructureTools";
import { BrainstormStep, Coach, OutlineStep, ParagraphDraft, ScratchPlanner, SideStep } from "../components/Thinking";
import { toast, toastBadges } from "../components/Toast";
import { LESSONS } from "../data/lessons";
import { PROMPTS, promptById, type Prompt } from "../data/prompts";
import { PROOF_CHECKS, REVISE_CHECKS, STEPS, UNPACK_QUESTIONS, type StepId } from "../data/process";
import { analyze } from "../lib/analyze";
import { nextPrompt } from "../lib/coach";
import { essayTurnedIn, mockTurnedIn, noteDraft } from "../lib/schedule";
import { gradeEssay } from "../lib/grade";
import { HELP_INFO, helpLevel, planComplete, toNextLevel } from "../lib/scaffold";
import { addXp, checkBadges, getState, giveChest, logEvent, markMission, uid, update, type Draft, type Plan, type RubricScore } from "../lib/store";

export type WriteMode = "practice" | "plan" | "mock" | "diagnostic";

const STEP_COINS = 5;
const emptyPlan = (): Plan => ({ opinion: "", hook: "", ending: "", reasons: [0, 1, 2].map(() => ({ reason: "", example: "", explain: "" })), pros: [], cons: [] });

function useClock(start: number | null) {
  const [now, setNow] = useState(Date.now());
  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(t);
  }, []);
  return start ? Math.max(0, Math.floor((now - start) / 1000)) : 0;
}
const mmss = (sec: number) => `${Math.floor(Math.max(0, sec) / 60)}:${String(Math.max(0, sec) % 60).padStart(2, "0")}`;
const words = (t: string) => (t.match(/[A-Za-z']+/g) ?? []).length;

export default function Write({ mode, promptId, onFinish }: { mode: WriteMode; promptId?: string; onFinish?: (score: RubricScore) => void }) {
  const [prompt, setPrompt] = useState<Prompt | null>(() => (promptId ? promptById(promptId) ?? null : mode === "diagnostic" ? PROMPTS[0] : null));
  const [key, setKey] = useState(0);
  if (!prompt) return <PromptPicker mode={mode} onPick={setPrompt} />;
  if (mode === "mock" || mode === "diagnostic")
    return <MockTest key={key} prompt={prompt} mode={mode} onFinish={onFinish} onAgain={() => { setPrompt(null); setKey(key + 1); }} />;
  return <GuidedEssay key={key} prompt={prompt} mode={mode} onAgain={() => { setPrompt(null); setKey(key + 1); }} />;
}

function PromptPicker({ mode, onPick }: { mode: WriteMode; onPick: (p: Prompt) => void }) {
  const s = getState();
  const [suggested, setSuggested] = useState(() => nextPrompt(s));
  const used = new Set(s.essays.map((e) => e.promptId));
  const title = mode === "mock" ? "🎯 Mock Test" : mode === "plan" ? "💡 Brainstorm Sprint" : "✍️ Write an Essay";
  const blurb =
    mode === "mock"
      ? "Real test conditions: 90 minutes, a plain text box, no spellcheck, no hints. Use scratch paper for planning, just like test day."
      : mode === "plan"
        ? "Plan an essay in about 10 minutes. Fast planning makes test day easy."
        : "Follow the 7 steps. You earn coins for every step you finish.";
  return (
    <>
      <div className="card">
        <h1>{title}</h1>
        <p className="muted">{blurb}</p>
        {mode !== "mock" && LESSONS.some((l) => !s.lessons?.[l.id]) && (
          <Coach>
            New moves to learn! Take <b>{LESSONS.find((l) => !s.lessons?.[l.id])!.icon} {LESSONS.find((l) => !s.lessons?.[l.id])!.title}</b> in Writing School first, then use it here.{" "}
            <button className="btn ghost small-btn" onClick={() => go("lessons", LESSONS.find((l) => !s.lessons?.[l.id])!.id)}>🎓 Go to the lesson</button>
          </Coach>
        )}
        <div className="card" style={{ background: "var(--brand-soft)", boxShadow: "none" }}>
          <span className="pill">{suggested.kind === "passage" ? "📖 Read + write" : "💭 Opinion"}</span>
          <h2 style={{ marginTop: 8 }}>{suggested.title}</h2>
          <p>{suggested.question}</p>
          <div className="row">
            <button className="btn big" onClick={() => onPick(suggested)}>Start this one</button>
            <button className="btn ghost" onClick={() => setSuggested(nextPrompt(s))}>🎲 Different prompt</button>
          </div>
        </div>
        {mode === "practice" && (
          <p className="small muted">
            Want the full test? <a href="#/mock">Take a 90-minute mock test</a>.
          </p>
        )}
      </div>
      <div className="card">
        <h3>All prompts</h3>
        <div className="grid three">
          {PROMPTS.map((p) => (
            <button key={p.id} className="choice" style={{ margin: 0 }} onClick={() => onPick(p)}>
              {p.kind === "passage" ? "📖 " : "💭 "}
              {p.title} {used.has(p.id) && <span className="pill good">done</span>}
            </button>
          ))}
        </div>
      </div>
    </>
  );
}

function PassageView({ p }: { p: Prompt }) {
  if (!p.passage) return null;
  return (
    <div className="passage">
      <h3>{p.passage.title}</h3>
      {p.passage.paragraphs.map((t, i) => (
        <p key={i}>
          <b className="muted small">{i + 1}</b> {t}
        </p>
      ))}
    </div>
  );
}

/* ---------------- Guided practice: the 7-step path ---------------- */

function GuidedEssay({ prompt, mode, onAgain }: { prompt: Prompt; mode: "practice" | "plan"; onAgain: () => void }) {
  const steps = mode === "plan" ? STEPS.slice(0, 4) : STEPS;
  // A practice essay is saved as a draft on every change, so he picks up
  // exactly where he stopped, even on another day.
  const [saved] = useState<Draft | undefined>(() => {
    const d = getState().draft;
    return mode === "practice" && d?.promptId === prompt.id ? d : undefined;
  });
  const [stepIdx, setStepIdx] = useState(saved?.stepIdx ?? 0);
  const [done, setDone] = useState<StepId[]>(saved?.done ?? []);
  const [start] = useState(Date.now());
  const elapsed = useClock(start) + (saved?.seconds ?? 0);
  const [highlights, setHighlights] = useState<number[]>(saved?.highlights ?? []);
  const [answers, setAnswers] = useState<(number | null)[]>(saved?.answers ?? UNPACK_QUESTIONS.map(() => null));
  const [help] = useState(() => helpLevel(getState()));
  const [toNext] = useState(() => toNextLevel(getState()));
  const [plan, setPlan] = useState<Plan>(saved?.plan ?? emptyPlan);
  const [paras, setParas] = useState<string[]>(saved?.paras ?? []);
  const [text, setText] = useState(saved?.text ?? "");
  const box = useRef<HTMLTextAreaElement>(null);
  const insertWord = (w: string) => {
    const el = box.current;
    const at = el ? el.selectionStart : text.length;
    const before = text.slice(0, at);
    const pad = before && !/\s$/.test(before) ? " " : "";
    const next = `${before}${pad}${w} ${text.slice(at)}`;
    setText(next);
    requestAnimationFrame(() => {
      if (!el) return;
      el.focus();
      const pos = at + pad.length + w.length + 1;
      el.setSelectionRange(pos, pos);
    });
  };
  const [checks, setChecks] = useState<Record<string, boolean>>(saved?.checks ?? {});
  const finished = useRef(false);
  useEffect(() => {
    if (mode !== "practice") return;
    noteDraft();
    logEvent(saved ? "resume essay" : "start essay", prompt.title);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  useEffect(() => {
    if (mode !== "practice" || finished.current) return;
    const secs = Math.round(elapsed);
    update((s) => void (s.draft = { promptId: prompt.id, stepIdx, done, highlights, answers, plan, paras, text, checks, seconds: secs, started: saved?.started ?? new Date().toISOString() }));
    // elapsed is left out on purpose: saving on the clock would write every second.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mode, prompt.id, stepIdx, done, highlights, answers, plan, paras, text, checks]);
  const [hints, setHints] = useState(true);
  const [grading, setGrading] = useState(false);
  const [result, setResult] = useState<{ score: RubricScore; coins: number } | null>(null);
  const step = steps[stepIdx];

  const complete = (id: StepId) => {
    if (!done.includes(id)) {
      setDone((d) => [...d, id]);
      addXp(STEP_COINS);
      toast(`${STEPS.find((s) => s.id === id)!.icon} Step done! +${STEP_COINS} coins`);
    }
    setStepIdx((i) => Math.min(i + 1, steps.length - 1));
  };

  const finishPlan = () => {
    update((s) => {
      s.plansDone += 1;
      if (planComplete(plan)) s.plansDoneComplete = (s.plansDoneComplete ?? 0) + 1;
    });
    addXp(15);
    if (markMission("plan")) toast("🎉 Daily quest complete! +25 bonus coins");
    toastBadges(checkBadges());
  };

  const submit = async () => {
    setGrading(true);
    const allDone = [...new Set([...done, "proofread" as StepId])];
    const score = await gradeEssay(text, prompt);
    const coins = Math.round(score.total / 4) + (allDone.length === STEPS.length ? 15 : 0);
    finished.current = true;
    update((s) => {
      s.essays.push({ id: uid(), date: new Date().toISOString(), promptId: prompt.id, mode: "practice", text, plan, seconds: Math.round(elapsed), words: words(text), score, steps: allDone });
      if (s.draft?.promptId === prompt.id) delete s.draft;
    });
    logEvent("essay turned in", `${prompt.title}: ${score.total}/100, ${words(text)} words`);
    essayTurnedIn();
    addXp(coins + STEP_COINS);
    // A full essay includes planning, so it also counts for a Brainstorm Sprint task.
    const bonus = [markMission("plan"), markMission("write")].some(Boolean);
    if (bonus) toast("🎉 Daily quest complete! +25 bonus coins");
    toastBadges(checkBadges());
    giveChest(score.total >= 70 ? "silver" : "wood", `finishing an essay (${score.total} points)`);
    setDone(allDone);
    setResult({ score, coins: coins + STEP_COINS });
    setGrading(false);
  };

  if (result) return <Results score={result.score} coins={result.coins} steps={done} onAgain={onAgain} />;

  const qWords = prompt.question.split(" ");
  const hi = HELP_INFO[help];
  const a = analyze(text);

  return (
    <>
      <div className="card" style={{ padding: 14 }}>
        <div className="row">
          {steps.map((st, i) => (
            <button
              key={st.id}
              className={`pill ${done.includes(st.id) ? "good" : i === stepIdx ? "" : "warn"}`}
              style={{ border: 0, cursor: i <= Math.max(stepIdx, done.length) ? "pointer" : "default", opacity: i === stepIdx ? 1 : 0.75, outline: i === stepIdx ? "2px solid var(--brand)" : "none" }}
              onClick={() => i <= Math.max(stepIdx, done.length) && setStepIdx(i)}
            >
              {st.icon} {st.name}
            </button>
          ))}
          <span className="spacer" />
          <span className="timer">{mmss(elapsed)}</span>
        </div>
        <div className="help-badge small" title={hi.desc}>
          {hi.icon} <b>{hi.name}</b>: {hi.desc}
          {toNext !== null && <span className="muted"> {toNext} more complete plan{toNext === 1 ? "" : "s"} to level up your planning.</span>}
        </div>
      </div>

      <div className="writer">
        <div className="card">
          <h2>
            {step.icon} Step {stepIdx + 1}: {step.name}
          </h2>
          <p className="muted">{step.goal} <span className="small">(Test-day budget: {step.minutes} min)</span></p>

          {step.id === "unpack" && (
            <>
              {help === 1 && (
                <Coach demo={<p>In “Should recess be longer, even if the school day has to be longer too?” the key words are <b>Should</b>, <b>recess</b>, <b>longer</b>, and <b>school day longer</b>. It asks me to pick yes or no and prove it.</p>}>
                  Before you plan, find out exactly what the prompt wants. Tap the <b>key words</b>: the topic and the question word (should, which, why). Then answer the two questions below.
                </Coach>
              )}
              <p><b>Tap the key words</b> that tell you what to do:</p>
              <p style={{ fontSize: "1.15rem", lineHeight: 2 }}>
                {qWords.map((w, i) => (
                  <span
                    key={i}
                    onClick={() => setHighlights((h) => (h.includes(i) ? h.filter((x) => x !== i) : [...h, i]))}
                    style={{ cursor: "pointer", padding: "2px 3px", borderRadius: 6, background: highlights.includes(i) ? "var(--sun)" : "transparent", color: highlights.includes(i) ? "#1d1b3a" : undefined }}
                  >
                    {w}{" "}
                  </span>
                ))}
              </p>
              <PassageView p={prompt} />
              {UNPACK_QUESTIONS.map((q, qi) => (
                <div key={qi} style={{ marginTop: 14 }}>
                  <b>{q.q}</b>
                  {q.choices.map((c, ci) => (
                    <button
                      key={ci}
                      className={`choice ${answers[qi] === ci ? (ci === q.correct ? "right" : "wrong") : ""}`}
                      onClick={() => setAnswers((a) => a.map((x, j) => (j === qi ? ci : x)))}
                    >
                      {c}
                    </button>
                  ))}
                </div>
              ))}
              {prompt.passage && <p className="small muted">This prompt has an article. Your evidence should come from it. Use paragraph numbers to find facts fast.</p>}
              <button className="btn" disabled={highlights.length < 2 || answers.some((x, i) => x !== UNPACK_QUESTIONS[i].correct)} onClick={() => complete("unpack")}>
                Done unpacking →
              </button>
              {highlights.length < 2 && <span className="small muted"> Highlight at least 2 key words.</span>}
            </>
          )}

          {step.id === "brainstorm" && <BrainstormStep prompt={prompt} help={help} plan={plan} setPlan={setPlan} onDone={() => complete("brainstorm")} />}

          {step.id === "side" && <SideStep prompt={prompt} help={help} plan={plan} setPlan={setPlan} onDone={() => complete("side")} />}

          {step.id === "plan" && (
            <OutlineStep
              prompt={prompt}
              help={help}
              plan={plan}
              setPlan={setPlan}
              finishLabel={mode === "plan" ? "Finish plan ✅" : "Start writing →"}
              onDone={() => {
                complete("plan");
                if (mode === "plan") finishPlan();
              }}
            />
          )}

          {step.id === "draft" && help === 1 && !text && (
            <ParagraphDraft
              plan={plan}
              paras={paras}
              setParas={setParas}
              onDone={() => {
                setText(paras.filter((x) => x.trim()).map((x) => x.trim()).join("\n\n"));
                complete("draft");
              }}
            />
          )}

          {((step.id === "draft" && !(help === 1 && !text)) || step.id === "revise" || step.id === "proofread") && (
            <>
              {step.id === "draft" && help === 2 && (
                <div className="pm">
                  <div className="pm-head"><span className="pm-kind">🎯 Your essay recipe</span></div>
                  <ol className="pm-list">
                    <li><span className="ml-box">🍞</span><span><b>Introduction:</b> hook, then your opinion, then “because” and your reasons.</span></li>
                    <li><span className="ml-box">🥩</span><span><b>One paragraph per reason:</b> reason, “For example, …”, then “This shows that …”.</span></li>
                    {plan.counter?.claim && <li><span className="ml-box">🧀</span><span><b>Other side:</b> “Some people think …” then “However, …”.</span></li>}
                    <li><span className="ml-box">🍞</span><span><b>Conclusion:</b> “In conclusion,” your opinion in new words, and a final thought.</span></li>
                  </ol>
                </div>
              )}
              {step.id !== "proofread" && help <= 2 && (
                <details className="tb-details" open={help === 1}>
                  <summary className="small"><b>🌉 Transition word bank</b> (tap to add at your cursor)</summary>
                  <TransitionBank onPick={insertWord} />
                </details>
              )}
              {step.id === "draft" && <p className="small muted">Start with your hook and opinion. One paragraph per reason. Keep writing. Fix mistakes later!</p>}
              <textarea ref={box} className="essay-box" value={text} spellCheck={false} autoCorrect="off" autoCapitalize="off" onChange={(e) => setText(e.target.value)} placeholder="Type your essay here…" />
              <div className="row small muted" style={{ marginTop: 6 }}>
                <span>{words(text)} words</span>
                <span>{a.paragraphs} paragraphs</span>
                <span className="spacer" />
                <label>
                  <input type="checkbox" checked={hints} onChange={(e) => setHints(e.target.checked)} /> Coach hints
                </label>
              </div>
              {step.id === "draft" && (
                <button className="btn" style={{ marginTop: 10 }} disabled={words(text) < 60} onClick={() => complete("draft")}>
                  Draft done → Revise
                </button>
              )}
              {step.id === "draft" && words(text) < 60 && <span className="small muted"> Keep going: at least 60 words.</span>}
              {((step.id === "draft" && help <= 2) || step.id === "revise") && words(text) > 30 && <StructureScan text={text} />}
              {(step.id === "revise" || step.id === "proofread") && (
                <div style={{ marginTop: 14 }}>
                  <h3>{step.id === "revise" ? "Revise checklist: fix it, then check it" : "CAPS check: read one sentence at a time"}</h3>
                  {(step.id === "revise" ? REVISE_CHECKS : PROOF_CHECKS).map((c) => (
                    <label key={c} style={{ display: "flex", gap: 8, marginBottom: 6, alignItems: "flex-start" }}>
                      <input type="checkbox" checked={!!checks[c]} onChange={(e) => setChecks({ ...checks, [c]: e.target.checked })} style={{ marginTop: 5 }} />
                      <span>{c}</span>
                    </label>
                  ))}
                  {step.id === "revise" ? (
                    <button className="btn" disabled={!REVISE_CHECKS.every((c) => checks[c])} onClick={() => complete("revise")}>Revised → Proofread</button>
                  ) : (
                    <button className="btn good big" disabled={grading || !PROOF_CHECKS.every((c) => checks[c])} onClick={submit}>
                      {grading ? "Scoring… ⏳" : "Submit my essay 🚀"}
                    </button>
                  )}
                </div>
              )}
            </>
          )}
        </div>

        <aside>
          <div className="card">
            <h3>Prompt</h3>
            <p className="small">{prompt.question}</p>
            {prompt.passage && step.id !== "unpack" && (
              <details>
                <summary className="small">Show article</summary>
                <PassageView p={prompt} />
              </details>
            )}
          </div>
          {stepIdx >= 4 && !(help === 1 && step.id === "draft" && !text) && (
            <div className="card">
              <h3>🍔 Your plan</h3>
              <p className="small"><b>Hook:</b> {plan.hook}</p>
              <p className="small"><b>Opinion:</b> {plan.opinion}</p>
              {plan.reasons.map((r, i) => (
                <p key={i} className="small"><b>Reason {i + 1}:</b> {r.reason}{r.example && <> — <i>{r.example}</i></>}{r.explain && <> — {r.explain}</>}</p>
              ))}
              {plan.counter?.claim && <p className="small"><b>Other side:</b> {plan.counter.claim} {plan.counter.answer}</p>}
              <p className="small"><b>Ending:</b> {plan.ending}</p>
            </div>
          )}
          {stepIdx >= 4 && hints && a.words > 20 && (
            <div className="card">
              <h3>🧭 Coach hints</h3>
              {a.issues.length ? a.issues.slice(0, 5).map((iss, i) => <div key={i} className="hint">{iss.message}</div>) : <p className="small">Looking strong! Keep going.</p>}
              <p className="small muted">Hints are off during mock tests, just like the real test.</p>
            </div>
          )}
        </aside>
      </div>
      {mode === "plan" && done.includes("plan") && (
        <div className="card center">
          <h2>🗺️ Plan complete! +15 bonus coins</h2>
          <p>Planning fast is a superpower. Want to turn it into an essay now?</p>
          <div className="row" style={{ justifyContent: "center" }}>
            <button className="btn" onClick={() => go("write", prompt.id)}>Write this essay</button>
            <button className="btn ghost" onClick={onAgain}>Plan another</button>
          </div>
        </div>
      )}
    </>
  );
}

/* ---------------- Mock test: real conditions ---------------- */

const BUDGET = (() => {
  let t = 0;
  return STEPS.map((s) => {
    const from = t;
    t += s.minutes;
    return { ...s, from, to: t };
  });
})();

function MockTest({ prompt, mode, onFinish, onAgain }: { prompt: Prompt; mode: "mock" | "diagnostic"; onFinish?: (s: RubricScore) => void; onAgain: () => void }) {
  const limit = mode === "mock" ? 90 * 60 : 30 * 60;
  const scale = limit / (90 * 60);
  const [start, setStart] = useState<number | null>(null);
  const elapsed = useClock(start);
  const left = limit - elapsed;
  const [scratch, setScratch] = useState("");
  const [text, setText] = useState("");
  const [stage, setStage] = useState<"intro" | "writing" | "reflect" | "grading" | "done">("intro");
  const [selfSteps, setSelfSteps] = useState<StepId[]>([]);
  const [result, setResult] = useState<{ score: RubricScore; coins: number } | null>(null);
  const submitted = useRef(false);

  const minute = elapsed / 60 / scale;
  const nowStep = BUDGET.find((b) => minute < b.to) ?? BUDGET[BUDGET.length - 1];

  useEffect(() => {
    if (stage === "writing" && left <= 0 && !submitted.current) {
      submitted.current = true;
      setStage(mode === "mock" ? "reflect" : "grading");
    }
  }, [left, stage, mode]);

  useEffect(() => {
    if (stage !== "grading") return;
    (async () => {
      const score = await gradeEssay(text, prompt);
      const steps = mode === "mock" ? selfSteps : undefined;
      const coins = Math.round(score.total / 3) + (mode === "mock" ? 40 : 20);
      update((s) => {
        s.essays.push({ id: uid(), date: new Date().toISOString(), promptId: prompt.id, mode, text, seconds: elapsed, words: words(text), score, steps });
      });
      addXp(coins);
      if (mode === "mock" && markMission("mock")) toast("🎉 Daily quest complete! +25 bonus coins");
      if (mode === "mock") mockTurnedIn();
      giveChest(mode === "mock" ? "gold" : "silver", mode === "mock" ? "finishing a 90-minute mock test" : "finishing your starting check");
      toastBadges(checkBadges());
      setResult({ score, coins });
      setStage("done");
      onFinish?.(score);
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [stage]);

  const budgetLabel = useMemo(() => BUDGET.map((b) => `${b.icon} ${Math.round(b.from * scale)}–${Math.round(b.to * scale)} min: ${b.name}`), [scale]);

  if (stage === "intro") {
    return (
      <div className="card">
        <h1>{mode === "mock" ? "🎯 90-Minute Mock Test" : "📝 Starting Essay"}</h1>
        <p>
          {mode === "mock"
            ? "This is just like test day: one opinion essay, typed, 90 minutes. No spellcheck, no hints, no copy and paste. Use the scratch paper box (or real paper) to plan."
            : "Write one essay in 30 minutes. Do your best, there's no wrong answer. This helps the game figure out what to teach you."}
        </p>
        <h3>Time plan</h3>
        <ul>{budgetLabel.map((l) => <li key={l}>{l}</li>)}</ul>
        <button
          className="btn big"
          onClick={() => {
            setStart(Date.now());
            setStage("writing");
          }}
        >
          Start the clock ⏱️
        </button>
      </div>
    );
  }

  if (stage === "reflect") {
    return (
      <div className="card">
        <h2>Before we score it: which steps did you do?</h2>
        <p className="muted">Be honest! This trains your test-day habits.</p>
        {STEPS.map((st) => (
          <label key={st.id} style={{ display: "flex", gap: 8, marginBottom: 8 }}>
            <input type="checkbox" checked={selfSteps.includes(st.id)} onChange={(e) => setSelfSteps((s) => (e.target.checked ? [...s, st.id] : s.filter((x) => x !== st.id)))} />
            {st.icon} {st.name}
          </label>
        ))}
        <button className="btn big" onClick={() => setStage("grading")}>Score my essay 🚀</button>
      </div>
    );
  }

  if (stage === "grading") return <div className="card center"><h2>Scoring your essay… ⏳</h2><p className="muted">The coach is reading every word.</p></div>;

  if (stage === "done" && result) return <Results score={result.score} coins={result.coins} steps={mode === "mock" ? selfSteps : undefined} onAgain={mode === "diagnostic" ? () => go("home") : onAgain} />;

  return (
    <>
      <div className="row" style={{ marginBottom: 10 }}>
        <span className="pill">Now: {nowStep.icon} {nowStep.name}</span>
        <span className="spacer" />
        <span className={`timer ${left < 600 ? "low" : ""}`}>⏱️ {mmss(left)} left</span>
      </div>
      <div className="mock-shell">
        <div className="mock-head">
          <b>Extended Constructed Response</b>
          <span className="spacer" />
          <span>Time remaining: {mmss(left)}</span>
        </div>
        <div className="mock-body">
          <p><b>{prompt.question}</b></p>
          {prompt.passage && <PassageView p={prompt} />}
          <p style={{ fontSize: "0.92rem" }}>
            Remember to — clearly state your opinion • organize your writing • develop your ideas in detail • use evidence {prompt.passage ? "from the selection" : "and examples"} • use correct spelling, capitalization, punctuation, and grammar
          </p>
          <details style={{ marginBottom: 10 }} open>
            <summary>📄 Scratch paper (not scored)</summary>
            {mode === "diagnostic" || helpLevel(getState()) < 3 ? (
              <ScratchPlanner prompt={prompt} coached={mode === "diagnostic" || helpLevel(getState()) === 1} />
            ) : (
              <textarea spellCheck={false} value={scratch} onChange={(e) => setScratch(e.target.value)} style={{ minHeight: 120 }} placeholder="Plan here: both sides, your opinion, 3 reasons, examples…" />
            )}
          </details>
          <textarea
            spellCheck={false}
            autoCorrect="off"
            autoCapitalize="off"
            value={text}
            onChange={(e) => setText(e.target.value)}
            onPaste={(e) => e.preventDefault()}
            placeholder="Type your response here."
          />
          <div className="row" style={{ marginTop: 8 }}>
            <span style={{ fontSize: "0.9rem" }}>{words(text)} words</span>
            <span className="spacer" />
            <button
              className="btn"
              disabled={words(text) < 20}
              onClick={() => {
                if (left > 300 && !confirmFinish()) return;
                submitted.current = true;
                setStage(mode === "mock" ? "reflect" : "grading");
              }}
            >
              Submit
            </button>
          </div>
        </div>
      </div>
    </>
  );
}

// Inline confirmation without a browser dialog: a second click within 4s submits.
let lastAsk = 0;
function confirmFinish() {
  if (Date.now() - lastAsk < 4000) return true;
  lastAsk = Date.now();
  toast("You still have time! Revise and proofread first. Click Submit again to finish.");
  return false;
}
