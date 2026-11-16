// Family passcode. Vinesh sets FAMILY_PASSCODE in the Vercel project's
// environment variables. It never lives in the repo. When it is unset,
// the app stays open so nothing breaks before it is configured.
//
// After a correct passcode, the browser gets an HttpOnly cookie holding an
// HMAC of a fixed label keyed by the passcode. Changing the passcode
// signs every device out.

export const COOKIE = "dwq_family";
const LABEL = "dev-writing-quest family session v1";

export const passcode = () => (process.env.FAMILY_PASSCODE ?? "").trim();

export async function sessionToken(code: string): Promise<string> {
  const enc = new TextEncoder();
  const key = await crypto.subtle.importKey("raw", enc.encode(code), { name: "HMAC", hash: "SHA-256" }, false, ["sign"]);
  const sig = await crypto.subtle.sign("HMAC", key, enc.encode(LABEL));
  return [...new Uint8Array(sig)].map((b) => b.toString(16).padStart(2, "0")).join("");
}

export function safeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return diff === 0;
}

export function readCookie(header: string | null | undefined, name: string): string {
  for (const part of (header ?? "").split(";")) {
    const [k, ...v] = part.trim().split("=");
    if (k === name) return decodeURIComponent(v.join("="));
  }
  return "";
}

/** True when no passcode is set, or the cookie matches the current one. */
export async function isUnlocked(cookieHeader: string | null | undefined): Promise<boolean> {
  const code = passcode();
  if (!code) return true;
  const got = readCookie(cookieHeader, COOKIE);
  return !!got && safeEqual(got, await sessionToken(code));
}
