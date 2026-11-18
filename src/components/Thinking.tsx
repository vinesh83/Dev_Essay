import { useEffect, useState, type ReactNode } from "react";
import {
  ANSWER_STARTERS, BODY_STARTERS, COUNTER_STARTERS, DEMO, END_STARTERS, EXAMPLE_KINDS, EXAMPLE_STARTERS,
  EXPLAIN_STARTERS, HOOK_KINDS, SPARKS, STRENGTH_LABEL, strength,
} from "../data/coach";
import type { Prompt } from "../data/prompts";
import type { Help } from "../lib/scaffold";
import type { Idea, Plan } from "../lib/store";
import type { ParaKind } from "../lib/structure";
import { JOBS_FOR, LessonReminder, ParaMission, TransitionBank } from "./StructureTools";

// The guided thinking steps: brainstorm both sides, test each reason, pick a
// side, build the outline, and (with training wheels) write one paragraph at
// a time. How much help shows depends on the training-wheels level.

type StepProps = { prompt: Prompt; help: Help; plan: Plan; setPlan: (p: Plan) => void; onDone: () => void };

const filled = (xs?: Idea[]) => (xs ?? []).filter((x) => x.text.trim());
const lower = (s: string) => (s ? s[0].toLowerCase() + s.slice(1) : s);
const trimDot = (s: string) => s.trim().replace(/[.!?]+$/, "");
export const sideClaim = (side: string) => lower(side.replace(/^(yes|no)[,!.]?\s*/i, ""));

/* ---------------- Coach bubble ---------------- */

export function Coach({ children, demo, demoLabel = "Show me how" }: { children: ReactNode; demo?: ReactNode; demoLabel?: string }) {
  const [show, setShow] = useState(false);
  return (
    <div className="coach">
      <div className="coach-face" aria-hidden>🦉</div>
      <div className="coach-body">
        <div className="coach-name">Professor Quill</div>
        <div>{children}</div>
        {demo && (
          <>
            <button className="btn ghost small-btn" onClick={() => setShow(!show)}>{show ? "Hide example" : `👀 ${demoLabel}`}</button>
            {show && (
              <div className="demo">
                <div className="demo-tag">Example for: “{DEMO.question}”</div>
                {demo}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}

function Chips({ items, onPick }: { items: string[]; onPick: (s: string) => void }) {
  return (
    <div className="chips">
      {items.map((s) => (
        <button key={s} type="button" className="chip" onClick={() => onPick(s)}>{s}</button>
      ))}
    </div>
  );
}

/** Put a starter in an empty box, or at the start of a new sentence. */
const withStarter = (cur: string, starter: string) => (cur.trim() ? `${cur.trimEnd()} ${starter} ` : `${starter} `);

/* ---------------- Step: brainstorm both sides ---------------- */

function IdeaList({ ideas, onChange, placeholder, min }: { ideas: Idea[]; onChange: (xs: Idea[]) => void; placeholder: string; min: number }) {
  const rows = ideas.length >= min ? ideas : [...ideas, ...Array.from({ length: min - ideas.length }, () => ({ text: "" }))];
  const set = (i: number, text: string) => onChange(rows.map((x, j) => (j === i ? { ...x, text } : x)));
  return (
    <div className="idea-list">
      {rows.map((x, i) => (
        <div key={i} className="idea-row">
          <span className="idea-num">{i + 1}</span>
          <input className="field" value={x.text} spellCheck={false} placeholder={i === 0 ? placeholder : "Another reason…"} onChange={(e) => set(i, e.target.value)} />
        </div>
      ))}
      {rows.length < 6 && (
        <button type="button" className="btn ghost small-btn" onClick={() => onChange([...rows, { text: "" }])}>+ Add another reason</button>
      )}
    </div>
  );
}

function Sparks() {
  const [q, setQ] = useState("");
  return (
    <div>
      <p className="small muted" style={{ marginBottom: 6 }}>Stuck? Tap an idea spark:</p>
      <Chips items={SPARKS.map((s) => `${s.icon} ${s.label}`)} onPick={(lbl) => setQ(SPARKS.find((s) => `${s.icon} ${s.label}` === lbl)!.q)} />
      {q && <div className="spark-q">💡 {q}</div>}
    </div>
  );
}

function RateIdea({ idea, onChange, why }: { idea: Idea; onChange: (x: Idea) => void; why: boolean }) {
  const yn = (key: "example" | "matters", label: string) => (
    <div className="rate-q">
      <span>{label}</span>
      <button type="button" className={`yn ${idea[key] === true ? "on yes" : ""}`} onClick={() => onChange({ ...idea, [key]: true })}>Yes</button>
      <button type="button" className={`yn ${idea[key] === false ? "on no" : ""}`} onClick={() => onChange({ ...idea, [key]: false })}>No</button>
    </div>
  );
  const st = strength(idea.example, idea.matters);
  return (
    <div className={`rate-card s${st}`}>
      <div className="row">
        <b>{idea.text}</b>
        <span className="spacer" />
        <span className="pill">{STRENGTH_LABEL[st]}</span>
      </div>
      {yn("example", "Can you think of a real example?")}
      {yn("matters", "Does it really matter to people?")}
      {why && (
        <input className="field" style={{ marginTop: 6 }} value={idea.why ?? ""} spellCheck={false} placeholder="Why? (optional)" onChange={(e) => onChange({ ...idea, why: e.target.value })} />
      )}
    </div>
  );
}

export function BrainstormStep({ prompt, help, plan, setPlan, onDone }: StepProps) {
  const [a, b] = prompt.sides;
  const pros = plan.pros ?? [];
  const cons = plan.cons ?? [];
  const minA = help === 3 ? 2 : 3;
  const minB = help === 3 ? 1 : 2;
  const [phase, setPhase] = useState<"a" | "b" | "test">(help === 1 ? "a" : "test");
  const setPros = (xs: Idea[]) => setPlan({ ...plan, pros: xs });
  const setCons = (xs: Idea[]) => setPlan({ ...plan, cons: xs });
  const nA = filled(pros).length;
  const nB = filled(cons).length;
  const all = [...filled(pros).map((x) => ({ x, side: 0 as const })), ...filled(cons).map((x) => ({ x, side: 1 as const }))];
  const rated = all.every(({ x }) => x.example !== undefined && x.matters !== undefined);

  const updateIdea = (side: 0 | 1, idea: Idea, next: Idea) => {
    const list = side === 0 ? pros : cons;
    const out = list.map((y) => (y === idea ? next : y));
    setPlan(side === 0 ? { ...plan, pros: out } : { ...plan, cons: out });
  };

  // Solo: quick T-chart, no testing.
  if (help === 3) {
    return (
      <>
        <p>Quick T-chart. Jot reasons for both sides, then move on. Speed matters on test day!</p>
        <div className="tchart">
          <div><h3 className="side-a">🔵 {a}</h3><IdeaList ideas={pros} onChange={setPros} placeholder="Reason…" min={minA} /></div>
          <div><h3 className="side-b">🟠 {b}</h3><IdeaList ideas={cons} onChange={setCons} placeholder="Reason…" min={minB} /></div>
        </div>
        <button className="btn" disabled={nA < minA || nB < minB} onClick={onDone}>Pick my side →</button>
      </>
    );
  }

  // Full help: one side at a time, then test each reason.
  if (help === 1 && phase === "a") {
    return (
      <>
        <Coach
          demo={
            <ul>{DEMO.pros.map((p) => <li key={p.text}>{p.text}</li>)}</ul>
          }
        >
          Great writers think about <b>both</b> sides before they choose. Let's start with this side:
          <div className="side-banner side-a">🔵 {a}</div>
          Write every reason you can think of, one per box. Short is fine. Don't judge them yet!
        </Coach>
        <IdeaList ideas={pros} onChange={setPros} placeholder="My first reason…" min={minA} />
        <Sparks />
        <div className="row" style={{ marginTop: 12 }}>
          <button className="btn" disabled={nA < minA} onClick={() => setPhase("b")}>Now flip sides →</button>
          {nA < minA && <span className="small muted">Write at least {minA} reasons.</span>}
        </div>
      </>
    );
  }

  if (help === 1 && phase === "b") {
    return (
      <>
        <Coach demo={<ul>{DEMO.cons.map((p) => <li key={p.text}>{p.text}</li>)}</ul>}>
          Now be a lawyer for the <b>other</b> side. Even if you don't agree, what would someone on this side say?
          <div className="side-banner side-b">🟠 {b}</div>
          Thinking about the other side helps you pick the best side, and later you can answer them in your essay.
        </Coach>
        <IdeaList ideas={cons} onChange={setCons} placeholder="Someone on this side would say…" min={minB} />
        <Sparks />
        <div className="row" style={{ marginTop: 12 }}>
          <button className="btn ghost" onClick={() => setPhase("a")}>← Back</button>
          <button className="btn" disabled={nB < minB} onClick={() => setPhase("test")}>Test my reasons →</button>
          {nB < minB && <span className="small muted">Write at least {minB} reasons.</span>}
        </div>
      </>
    );
  }

  // Test phase (full help), or everything on one page (coach nearby).
  return (
    <>
      {help === 2 && (
        <>
          <p>List reasons for <b>both</b> sides. Then test each one.</p>
          <div className="tchart">
            <div><h3 className="side-a">🔵 {a}</h3><IdeaList ideas={pros} onChange={setPros} placeholder="Reason…" min={minA} /></div>
            <div><h3 className="side-b">🟠 {b}</h3><IdeaList ideas={cons} onChange={setCons} placeholder="Reason…" min={minB} /></div>
          </div>
          <details style={{ margin: "8px 0 14px" }}>
            <summary className="small">💡 Need idea sparks?</summary>
            <Sparks />
          </details>
        </>
      )}
      {help === 1 ? (
        <Coach
          demo={
            <>
              {DEMO.pros.slice(0, 2).concat(DEMO.cons.slice(1, 2)).map((p) => (
                <p key={p.text} className="small">
                  <b>{p.text}</b>: real example? {p.example ? "Yes" : "No"}. Matters? {p.matters ? "Yes" : "No"}. → {STRENGTH_LABEL[strength(p.example, p.matters)]}
                </p>
              ))}
            </>
          }
        >
          Now let's <b>test</b> each reason with two questions. A strong reason is one you can <b>prove with an example</b> and that <b>really matters</b>.
        </Coach>
      ) : (
        <h3 style={{ marginTop: 6 }}>Test each reason</h3>
      )}
      {(nA < minA || nB < minB) && help === 2 ? (
        <p className="small muted">Write at least {minA} reasons for 🔵 and {minB} for 🟠 first.</p>
      ) : (
        <div className="tchart">
          <div>
            <h3 className="side-a">🔵 {a}</h3>
            {filled(pros).map((x, i) => <RateIdea key={i} idea={x} why={help === 1} onChange={(n) => updateIdea(0, x, n)} />)}
          </div>
          <div>
            <h3 className="side-b">🟠 {b}</h3>
            {filled(cons).map((x, i) => <RateIdea key={i} idea={x} why={help === 1} onChange={(n) => updateIdea(1, x, n)} />)}
          </div>
        </div>
      )}
      <div className="row" style={{ marginTop: 12 }}>
        {help === 1 && <button className="btn ghost" onClick={() => setPhase("b")}>← Back</button>}
        <button className="btn" disabled={nA < minA || nB < minB || !rated} onClick={onDone}>Pick my side →</button>
        {!rated && nA >= minA && nB >= minB && <span className="small muted">Answer both questions for every reason.</span>}
      </div>
    </>
  );
}

/* ---------------- Step: pick a side ---------------- */

const power = (xs: Idea[]) =>
  filled(xs)
    .map((x) => strength(x.example, x.matters))
    .sort((p, q) => q - p)
    .slice(0, 3)
    .reduce((s: number, v) => s + v, 0);

export function SideStep({ prompt, help, plan, setPlan, onDone }: StepProps) {
  const [a, b] = prompt.sides;
  const pa = power(plan.pros ?? []);
  const pb = power(plan.cons ?? []);
  const rec = pa === pb ? null : pa > pb ? 0 : 1;
  const strongCount = (xs?: Idea[]) => filled(xs).filter((x) => strength(x.example, x.matters) === 3).length;
  const solo = help === 3;

  return (
    <>
      {help === 1 ? (
        <Coach demo={<p>{DEMO.pick}</p>}>
          Look at your reasons. Pick the side you can <b>prove best</b>, not the one that sounds smartest. There is no wrong side!
          {rec !== null && (
            <> Your strongest reasons are on the <b>{rec === 0 ? "🔵" : "🟠"} {prompt.sides[rec]}</b> side.</>
          )}
        </Coach>
      ) : (
        <p>Which side can you prove best?</p>
      )}
      <div className="tchart">
        {[0, 1].map((i) => {
          const xs = i === 0 ? plan.pros : plan.cons;
          return (
            <button key={i} className={`side-pick ${plan.side === i ? "picked" : ""} ${i === 0 ? "side-a" : "side-b"}`} onClick={() => setPlan({ ...plan, side: i as 0 | 1 })}>
              <h3>{i === 0 ? "🔵" : "🟠"} {i === 0 ? a : b}</h3>
              {!solo && <div className="small">{strongCount(xs)} strong reason{strongCount(xs) === 1 ? "" : "s"} {rec === i ? "⭐ best choice" : ""}</div>}
              <ul>
                {filled(xs).map((x, j) => (
                  <li key={j}>{x.text} {!solo && <span className="small">{STRENGTH_LABEL[strength(x.example, x.matters)].split(" ")[0]}</span>}</li>
                ))}
              </ul>
              {plan.side === i && <div className="picked-tag">✅ My side</div>}
            </button>
          );
        })}
      </div>
      <button className="btn" style={{ marginTop: 12 }} disabled={plan.side === undefined} onClick={onDone}>Lock it in →</button>
    </>
  );
}

/* ---------------- Step: outline (the burger) ---------------- */

export function OutlineStep({ prompt, help, plan, setPlan, onDone, finishLabel }: StepProps & { finishLabel: string }) {
  const side = plan.side ?? 0;
  const mine = filled(side === 0 ? plan.pros : plan.cons);
  const theirs = filled(side === 0 ? plan.cons : plan.pros);
  const sideText = prompt.sides[side];
  const passage = !!prompt.passage;

  // Start the outline from his strongest reasons on the side he picked.
  useEffect(() => {
    if (plan.reasons.every((r) => !r.reason.trim()) && mine.length) {
      const top = [...mine].sort((p, q) => strength(q.example, q.matters) - strength(p.example, p.matters)).slice(0, 3);
      setPlan({ ...plan, reasons: plan.reasons.map((r, i) => ({ ...r, reason: top[i]?.text ?? "" })) });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const setR = (i: number, patch: Partial<Plan["reasons"][number]>) => setPlan({ ...plan, reasons: plan.reasons.map((r, j) => (j === i ? { ...r, ...patch } : r)) });
  const buildOpinion = () =>
    setPlan({ ...plan, opinion: `I believe ${sideClaim(sideText)} because ${plan.reasons.map((r) => lower(trimDot(r.reason))).filter(Boolean).join(", ").replace(/, ([^,]*)$/, ", and $1")}.` });
  const needExplain = help !== 3;
  const ready =
    plan.opinion.trim() && plan.hook.trim() && plan.ending.trim() &&
    plan.reasons.every((r) => r.reason.trim() && r.example.trim() && (!needExplain || (r.explain ?? "").trim()));
  const full = help === 1;
  const exampleKinds = EXAMPLE_KINDS.filter((k) => passage || k.id !== "article");

  if (help === 3) {
    return (
      <>
        <p>Quick outline. Short notes, not sentences.</p>
        <div className="burger">
          <div className="layer bun">🍞 Hook + opinion
            <input className="field" placeholder="Hook" value={plan.hook} onChange={(e) => setPlan({ ...plan, hook: e.target.value })} />
            <input className="field" placeholder="I believe…" value={plan.opinion} onChange={(e) => setPlan({ ...plan, opinion: e.target.value })} />
          </div>
          {plan.reasons.map((r, i) => (
            <div key={i} className={`layer ${i === 1 ? "lettuce" : "patty"}`}>Reason {i + 1}
              <input className="field" placeholder="Reason" value={r.reason} onChange={(e) => setR(i, { reason: e.target.value })} />
              <input className="field" placeholder={passage ? "Evidence (¶ #)" : "Example"} value={r.example} onChange={(e) => setR(i, { example: e.target.value })} />
            </div>
          ))}
          <div className="layer bun">🍞 Ending
            <input className="field" placeholder="Restate + final thought" value={plan.ending} onChange={(e) => setPlan({ ...plan, ending: e.target.value })} />
          </div>
        </div>
        <button className="btn" style={{ marginTop: 12 }} disabled={!ready} onClick={onDone}>{finishLabel}</button>
      </>
    );
  }

  return (
    <>
      {full && (
        <Coach>
          Now build your <b>burger</b>. The buns hold your hook, opinion, and ending. Each patty is one reason with an <b>example</b> and a <b>“this shows that”</b> sentence. I filled in your strongest reasons to start. Change anything you want!
        </Coach>
      )}
      <div className="burger">
        <div className="layer bun">
          🍞 Top bun: Hook
          {full && <p className="layer-tip">A hook grabs the reader. Pick a kind:</p>}
          {full && <Chips items={HOOK_KINDS.map((h) => `${h.icon} ${h.label}`)} onPick={(l) => { const h = HOOK_KINDS.find((k) => `${k.icon} ${k.label}` === l)!; setPlan({ ...plan, hookKind: h.id, hook: plan.hook.trim() ? plan.hook : h.starter }); }} />}
          <input className="field" placeholder="Hook: a question, a surprising fact, or a quick scene" value={plan.hook} onChange={(e) => setPlan({ ...plan, hook: e.target.value })} />
          {full && <p className="layer-ex">Example: “{DEMO.hook}”</p>}
          <div style={{ marginTop: 8 }}>Opinion sentence</div>
          <div className="row" style={{ gap: 6 }}>
            <input className="field" style={{ flex: 1 }} placeholder="I believe ___ because ___, ___, and ___." value={plan.opinion} onChange={(e) => setPlan({ ...plan, opinion: e.target.value })} />
            {full && <button type="button" className="btn ghost small-btn" onClick={buildOpinion}>✨ Build it from my reasons</button>}
          </div>
        </div>

        {plan.reasons.map((r, i) => (
          <div key={i} className={`layer ${i === 1 ? "lettuce" : "patty"}`}>
            {i === 1 ? "🥬" : "🍖"} Reason {i + 1}
            <select className="field" value="" onChange={(e) => e.target.value && setR(i, { reason: e.target.value })}>
              <option value="">Swap in another reason from your list…</option>
              {mine.map((x) => <option key={x.text} value={x.text}>{x.text}</option>)}
            </select>
            <input className="field" placeholder="Reason" value={r.reason} onChange={(e) => setR(i, { reason: e.target.value })} />
            {full && <p className="layer-tip">Pick an example kind:</p>}
            {full && <Chips items={exampleKinds.map((k) => `${k.icon} ${k.label}`)} onPick={(l) => { const k = exampleKinds.find((x) => `${x.icon} ${x.label}` === l)!; setR(i, { kind: k.id, example: r.example.trim() ? r.example : k.starter }); }} />}
            <input className="field" placeholder={passage ? "Evidence from the article (paragraph #)" : "Example: a time it happened to you, a fact, or a what-if"} value={r.example} onChange={(e) => setR(i, { example: e.target.value })} />
            {full && <p className="layer-ex">Example: “{DEMO.reasons[i].example}”</p>}
            {full && <Chips items={EXPLAIN_STARTERS} onPick={(s) => setR(i, { explain: (r.explain ?? "").trim() ? r.explain : `${s} ` })} />}
            <input className="field" placeholder="This shows that…" value={r.explain ?? ""} onChange={(e) => setR(i, { explain: e.target.value })} />
            {full && <p className="layer-ex">Example: “{DEMO.reasons[i].explain}”</p>}
          </div>
        ))}

        <div className="layer cheese">
          🧀 Bonus: answer the other side <span className="small">(optional, makes your argument stronger)</span>
          {full && theirs.length > 0 && <p className="layer-tip">Pick the other side's best reason:</p>}
          {theirs.length > 0 && (
            <Chips items={theirs.map((x) => x.text)} onPick={(t) => setPlan({ ...plan, counter: { claim: `Some people think ${lower(trimDot(t))}.`, answer: plan.counter?.answer ?? "But " } })} />
          )}
          <input className="field" placeholder="Some people think…" value={plan.counter?.claim ?? ""} onChange={(e) => setPlan({ ...plan, counter: { claim: e.target.value, answer: plan.counter?.answer ?? "" } })} />
          <input className="field" placeholder="But…" value={plan.counter?.answer ?? ""} onChange={(e) => setPlan({ ...plan, counter: { claim: plan.counter?.claim ?? "", answer: e.target.value } })} />
          {full && <p className="layer-ex">Example: “{DEMO.counter.claim} {DEMO.counter.answer}”</p>}
        </div>

        <div className="layer bun">
          🍞 Bottom bun: Ending
          {full && <Chips items={END_STARTERS} onPick={(s) => setPlan({ ...plan, ending: plan.ending.trim() ? plan.ending : `${s} ` })} />}
          <input className="field" placeholder="Restate your opinion in new words + a final thought" value={plan.ending} onChange={(e) => setPlan({ ...plan, ending: e.target.value })} />
          {full && <p className="layer-ex">Example: “{DEMO.ending}”</p>}
        </div>
      </div>
      <div className="row" style={{ marginTop: 12 }}>
        <button className="btn" disabled={!ready} onClick={onDone}>{finishLabel}</button>
        {!ready && <span className="small muted">Fill in the hook, opinion, ending, and every reason's example{needExplain ? " and “this shows that”" : ""}.</span>}
      </div>
    </>
  );
}

/* ---------------- Training wheels: write one paragraph at a time ---------------- */

type Para = { kind: ParaKind; title: string; plan: ReactNode; starters: string[]; sample: string };

export function buildParas(plan: Plan): Para[] {
  const body = plan.reasons.map((r, i): Para => ({
    kind: "body",
    title: `Body paragraph ${i + 1}: Reason ${i + 1}`,
    plan: (
      <>
        <b>Reason:</b> {r.reason}<br /><b>Example:</b> {r.example}<br /><b>This shows that:</b> {r.explain}
      </>
    ),
    starters: [BODY_STARTERS[i === 2 ? 3 : i], ...EXAMPLE_STARTERS.slice(0, 1), ...EXPLAIN_STARTERS.slice(0, 1)],
    sample: `${BODY_STARTERS[i === 2 ? 3 : i]} ${lower(DEMO.reasons[i].reason)}. ${DEMO.reasons[i].example} ${DEMO.reasons[i].explain}`,
  }));
  const paras: Para[] = [
    {
      kind: "intro",
      title: "Introduction: hook + opinion",
      plan: (<><b>Hook:</b> {plan.hook}<br /><b>Opinion:</b> {plan.opinion}</>),
      starters: ["Have you ever", "Did you know that", "Picture this:", "I believe", "because"],
      sample: `${DEMO.hook} Recess is the best part of the day for a lot of kids. ${DEMO.opinion}`,
    },
    ...body,
  ];
  if (plan.counter?.claim.trim()) {
    paras.push({
      kind: "counter",
      title: "Answer the other side",
      plan: (<>{plan.counter.claim} {plan.counter.answer}</>),
      starters: [...COUNTER_STARTERS.slice(0, 1), ...ANSWER_STARTERS.slice(0, 1)],
      sample: `${DEMO.counter.claim} ${DEMO.counter.answer}`,
    });
  }
  paras.push({
    kind: "end",
    title: "Conclusion: say it again in new words",
    plan: (<><b>Ending:</b> {plan.ending}</>),
    starters: END_STARTERS.slice(0, 2),
    sample: DEMO.ending,
  });
  return paras;
}

const wc = (t: string) => (t.match(/[A-Za-z']+/g) ?? []).length;

export function ParagraphDraft({ plan, paras, setParas, onDone }: { plan: Plan; paras: string[]; setParas: (p: string[]) => void; onDone: () => void }) {
  const list = buildParas(plan);
  const vals = list.map((_, i) => paras[i] ?? "");
  const [open, setOpen] = useState(0);
  const [sample, setSample] = useState<number | null>(null);
  const set = (i: number, v: string) => setParas(vals.map((x, j) => (j === i ? v : x)));
  const total = vals.reduce((s, v) => s + wc(v), 0);
  const ok = vals.every((v) => wc(v) >= 8) && total >= 60;

  return (
    <>
      <Coach>
        Write one paragraph at a time. Your plan for each one is right above its box. Turn the notes into full sentences. Tap a starter if you need one. Keep going, and fix mistakes later!
      </Coach>
      {list.map((p, i) => (
        <div key={i} className={`para-card ${open === i ? "open" : ""} ${wc(vals[i]) >= 8 ? "done" : ""}`}>
          <button type="button" className="para-head" onClick={() => setOpen(i)}>
            <span>{wc(vals[i]) >= 8 ? "✅" : `${i + 1}.`} {p.title}</span>
            <span className="small muted">{wc(vals[i])} words</span>
          </button>
          {open === i && (
            <div className="para-body">
              <ParaMission kind={p.kind} text={vals[i]} />
              <div className="para-plan">🍔 Your plan: <div>{p.plan}</div></div>
              {p.kind === "intro" ? (
                <Chips items={p.starters} onPick={(s) => set(i, withStarter(vals[i], s))} />
              ) : (
                <details className="tb-details" open={i === 1}>
                  <summary className="small"><b>🌉 Transition words</b> (tap one to add it)</summary>
                  <TransitionBank jobs={JOBS_FOR[p.kind]} onPick={(s) => set(i, withStarter(vals[i], s))} />
                </details>
              )}
              <textarea className="essay-box para-box" value={vals[i]} spellCheck={false} autoCorrect="off" autoCapitalize="off" onChange={(e) => set(i, e.target.value)} placeholder="Write this paragraph here…" />
              <div className="row">
                <button type="button" className="btn ghost small-btn" onClick={() => setSample(sample === i ? null : i)}>{sample === i ? "Hide sample" : "👀 Show a sample paragraph"}</button>
                <LessonReminder kind={p.kind} />
                <span className="spacer" />
                {i < list.length - 1 && <button type="button" className="btn small-btn" disabled={wc(vals[i]) < 8} onClick={() => setOpen(i + 1)}>Next paragraph →</button>}
              </div>
              {sample === i && <div className="demo"><div className="demo-tag">Sample for: “{DEMO.question}”</div>{p.sample}</div>}
            </div>
          )}
        </div>
      ))}
      <div className="row" style={{ marginTop: 12 }}>
        <span className="small muted">{total} words total</span>
        <span className="spacer" />
        <button className="btn" disabled={!ok} onClick={onDone}>Draft done → Revise</button>
      </div>
      {!ok && <p className="small muted">Every paragraph needs at least one full sentence, and at least 60 words total.</p>}
    </>
  );
}

/* ---------------- Timed tests: a structured scratch page ---------------- */

export function ScratchPlanner({ prompt, coached }: { prompt: Prompt; coached: boolean }) {
  const [a, setA] = useState("");
  const [b, setB] = useState("");
  const [o, setO] = useState("");
  const [r, setR] = useState(["", "", ""]);
  const [end, setEnd] = useState("");
  const tip = (t: string) => (coached ? <div className="scratch-tip">{t}</div> : null);
  return (
    <div className="scratch">
      {tip("1. Jot reasons for BOTH sides. 2. Circle (pick) the side you can prove best. 3. Plan 3 reasons with an example each.")}
      <div className="scratch-grid">
        <label>Reasons: {prompt.sides[0]}<textarea spellCheck={false} value={a} onChange={(e) => setA(e.target.value)} placeholder={"-\n-\n-"} /></label>
        <label>Reasons: {prompt.sides[1]}<textarea spellCheck={false} value={b} onChange={(e) => setB(e.target.value)} placeholder={"-\n-"} /></label>
      </div>
      <label>My opinion{tip("I believe ___ because ___, ___, and ___.")}<input spellCheck={false} value={o} onChange={(e) => setO(e.target.value)} /></label>
      {r.map((v, i) => (
        <label key={i}>Reason {i + 1} + example<input spellCheck={false} value={v} onChange={(e) => setR(r.map((x, j) => (j === i ? e.target.value : x)))} placeholder="reason — example — this shows that…" /></label>
      ))}
      <label>Ending<input spellCheck={false} value={end} onChange={(e) => setEnd(e.target.value)} /></label>
    </div>
  );
}
