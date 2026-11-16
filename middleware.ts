import { next } from "@vercel/functions";
import { COOKIE, isUnlocked, passcode, safeEqual, sessionToken } from "./api/_passcode.js";

// Locks the whole site, including /api/grade, behind the family passcode.
// Runs on Vercel before any page, asset, or function is served.

export const config = { matcher: "/:path*" };

const YEAR = 60 * 60 * 24 * 365;

export default async function middleware(request: Request): Promise<Response> {
  const url = new URL(request.url);

  if (url.pathname === "/__lock") {
    return new Response(null, {
      status: 303,
      headers: { Location: "/", "Set-Cookie": `${COOKIE}=; Path=/; Max-Age=0; HttpOnly; Secure; SameSite=Lax` },
    });
  }

  if (url.pathname === "/__unlock" && request.method === "POST") {
    const code = passcode();
    const form = await request.formData().catch(() => null);
    const tried = String(form?.get("passcode") ?? "").trim();
    if (code && tried && safeEqual(await sessionToken(tried), await sessionToken(code))) {
      return new Response(null, {
        status: 303,
        headers: {
          Location: "/",
          "Set-Cookie": `${COOKIE}=${await sessionToken(code)}; Path=/; Max-Age=${YEAR}; HttpOnly; Secure; SameSite=Lax`,
        },
      });
    }
    await new Promise((r) => setTimeout(r, 800)); // slow down guessing
    return lockPage(true);
  }

  if (await isUnlocked(request.headers.get("cookie"))) return next();

  if (url.pathname.startsWith("/api/")) {
    return Response.json({ error: "Family passcode required" }, { status: 401 });
  }
  return lockPage(false);
}

function lockPage(wrong: boolean): Response {
  const html = `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1">
<title>Writing Quest</title><meta name="robots" content="noindex">
<style>
:root{color-scheme:dark}
*{box-sizing:border-box}
body{margin:0;min-height:100vh;display:grid;place-items:center;padding:16px;font-family:system-ui,-apple-system,"Segoe UI",sans-serif;color:#f4efff;
background:radial-gradient(ellipse at top,#3a2f7a 0%,#1a1640 55%,#0e0b26 100%)}
.box{width:100%;max-width:380px;background:rgba(255,255,255,.07);border:1px solid rgba(255,255,255,.15);border-radius:20px;padding:28px;text-align:center}
.icon{font-size:52px}
h1{margin:8px 0 4px;font-size:1.6rem;color:#ffd166}
p{margin:0 0 18px;color:#c9c3ee}
input{width:100%;font-size:1.2rem;padding:12px 14px;border-radius:12px;border:2px solid #6f66c9;background:#fffaf0;color:#1d1b3a;text-align:center;letter-spacing:.12em}
button{margin-top:14px;width:100%;font-size:1.1rem;font-weight:800;padding:12px;border:0;border-radius:12px;background:linear-gradient(180deg,#ffd66b,#e3a92b);color:#2a1d00;cursor:pointer}
.err{color:#ff8f9b;font-weight:700;margin:12px 0 0}
</style></head><body>
<form class="box" method="post" action="/__unlock">
<div class="icon">🏰</div>
<h1>Writing Quest</h1>
<p>Enter the family passcode to open the gates.</p>
<input name="passcode" type="password" autocomplete="current-password" autofocus aria-label="Family passcode" required>
<button type="submit">Open the gates</button>
${wrong ? '<p class="err" role="alert">That passcode didn\'t work. Try again.</p>' : ""}
</form></body></html>`;
  return new Response(html, {
    status: 401,
    headers: { "Content-Type": "text/html; charset=utf-8", "Cache-Control": "no-store" },
  });
}
