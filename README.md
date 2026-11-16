# Writing Quest

A typing and essay-writing practice game for Dev, built around the
**Sudie L. Williams Talented and Gifted Academy** (Dallas ISD) on-site essay.

## What the test asks for

From the 2026-27 Sudie TAG application packet:

- One **argumentative/opinion essay**, typed on a Chromebook, **90 minutes**.
- Prompts are not published. They test expression, not facts.
- Scored out of 100, aligned to the STAAR grades 3-5 rubric:
  - Opinion, Organization, Evidence, Word Choice: 15 points each (15/10/5/0)
  - Conventions (sentences, punctuation, capitals, grammar, spelling): 40 points (40/20/0)

## What the app does

| Area | How it works |
| --- | --- |
| Starting check | 1-minute typing test plus a 30-minute essay set the baseline. |
| Typing Dojo | 10 touch-typing levels, color-coded finger guide, stop-on-error drills, a 1-minute speed test, and weak-key training built from the keys Dev misses most. |
| 7-step essay path | Unpack the prompt, pick a side, brainstorm, plan (hamburger), draft, revise, proofread (CAPS). Coins for every step. |
| Mock test | A plain 90-minute text box like test day: no spellcheck, no hints, no paste, scratch paper, and a time-budget guide. |
| Skill drills | 60 short drills mapped to the rubric. Spaced repetition: misses come back sooner, mastered items fade out. |
| Adaptive coach | Daily quest picks typing, drills, and writing tasks from his weakest skills, recent essay feedback, and typing speed. |
| Grading | Claude scores each essay on the Sudie rubric and gives kid-friendly glows, grows, and a "level-up sentence". A built-in checker is the fallback. |
| Rewards | XP, levels, streaks, badges, and a Quest Shop where coins buy gear for his hero. |
| Parent page | Score and typing charts, rubric areas, process habits, skill mastery, essay history, manual re-scoring, backup/restore. |

Progress is saved in the browser (localStorage). Use **Parents > Backup progress** to move it to another device.

## Run locally

```bash
npm install
npm run dev     # app at http://localhost:5173 (built-in grading only)
npm test
```

## Deploy (Vercel)

1. Import this repo in Vercel. Framework preset: Vite. No other settings needed.
2. In the Vercel project, open **Settings > Environment Variables** and add
   `ANTHROPIC_API_KEY` with your key. Redeploy.
3. The Parents page shows "AI rubric grading on" once the key works.

The key stays on the server (`api/grade.ts`). It is never sent to the browser.

## Family passcode

Set `FAMILY_PASSCODE` in the Vercel project's environment variables (Production), then redeploy. Every page and `/api/grade` then asks for the passcode once per device. A correct entry is remembered for a year. Changing the passcode signs out every device. Parents can lock a device from the Parents page. If the variable is unset, the app stays open.
