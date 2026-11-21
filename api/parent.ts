import type { VercelRequest, VercelResponse } from "@vercel/node";
import { isUnlocked, safeEqual } from "./_passcode.js";

// Checks the parent PIN for the Parents page. PARENT_PIN lives only in
// the Vercel environment variables. Unset = no PIN needed.

const tries = new Map<string, { n: number; until: number }>();

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (!(await isUnlocked(req.headers.cookie))) return res.status(401).json({ error: "Family passcode required" });
  const pin = (process.env.PARENT_PIN ?? "").trim();
  if (req.method === "GET") return res.status(200).json({ required: Boolean(pin) });
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });
  if (!pin) return res.status(200).json({ ok: true });
  const ip = String(req.headers["x-forwarded-for"] ?? "").split(",")[0];
  const t = tries.get(ip);
  if (t && t.n >= 5 && Date.now() < t.until) return res.status(429).json({ error: "Too many tries. Wait a minute." });
  const got = String((req.body ?? {}).pin ?? "").trim();
  if (safeEqual(got, pin)) {
    tries.delete(ip);
    return res.status(200).json({ ok: true });
  }
  const n = (t && Date.now() < t.until ? t.n : 0) + 1;
  tries.set(ip, { n, until: Date.now() + 60_000 });
  return res.status(403).json({ error: "Wrong PIN" });
}
