import { useState } from "react";
import TypingDrill, { type TypingResult } from "../components/TypingDrill";
import { TYPING_TEST_TEXT } from "../data/typing";
import { addXp, update } from "../lib/store";
import Write from "./Write";

// Starting check: 1-minute typing test, then a 30-minute essay. Sets the
// baseline the coach adapts from.

export default function Diagnostic() {
  const [stage, setStage] = useState<"intro" | "typing" | "typed" | "essay">("intro");
  const [typing, setTyping] = useState<TypingResult | null>(null);

  if (stage === "intro")
    return (
      <div className="card">
        <h1>⚔️ Starting Check</h1>
        <p>Two short challenges show the game your powers. Don't worry about being perfect!</p>
        <ol>
          <li><b>Typing test (1 minute).</b> Type the sentences. If you press a wrong key, the cursor waits for the right one.</li>
          <li><b>Starting essay (30 minutes).</b> One opinion essay. No hints, just like the real test.</li>
        </ol>
        <button className="btn big" onClick={() => setStage("typing")}>Begin</button>
      </div>
    );

  if (stage === "typing")
    return (
      <div className="card">
        <h2>Typing test</h2>
        <p className="muted">Rest your fingers on the home row. Type as accurately as you can. The clock starts with your first key.</p>
        <TypingDrill
          lines={[TYPING_TEST_TEXT, TYPING_TEST_TEXT]}
          timeLimit={60}
          onDone={(r) => {
            setTyping(r);
            update((s) => {
              s.typing.tests.push({ date: new Date().toISOString(), wpm: r.wpm, acc: r.acc });
              for (const [k, v] of Object.entries(r.keys)) {
                const rec = (s.keyStats[k] ??= { hits: 0, misses: 0 });
                rec.hits += v.hits;
                rec.misses += v.misses;
              }
            });
            addXp(15);
            setStage("typed");
          }}
        />
      </div>
    );

  if (stage === "typed" && typing)
    return (
      <div className="card center">
        <h2>⌨️ {typing.wpm} words per minute at {typing.acc}% accuracy</h2>
        <p className="muted">{typing.wpm >= 20 ? "Fast fingers! We'll polish your form." : "We'll build your speed and form in the Typing Dojo."}</p>
        <button className="btn big" onClick={() => setStage("essay")}>Next: the starting essay →</button>
      </div>
    );

  return (
    <Write
      mode="diagnostic"
      onFinish={() => {
        update((s) => void (s.diagnosticDone = true));
      }}
    />
  );
}
