import { cookies } from "next/headers";

export const SESSION_COOKIE = "bottle_sid";

export async function getOrCreateSessionId(): Promise<string> {
  const jar = await cookies();
  const existing = jar.get(SESSION_COOKIE)?.value;
  if (existing && existing.length >= 8) return existing;
  const sid = crypto.randomUUID();
  jar.set(SESSION_COOKIE, sid, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 24 * 365,
  });
  return sid;
}

export async function getSessionId(): Promise<string | null> {
  const jar = await cookies();
  const v = jar.get(SESSION_COOKIE)?.value;
  return v && v.length >= 8 ? v : null;
}
