import { createHash, timingSafeEqual } from "crypto";
import { cookies } from "next/headers";

const COOKIE = "warehouse_sess";
const COOKIE_VERSION = "v1";

/** ログイン用パスワードと同一の値を環境変数に設定 */
export function isWarehouseConfigured(): boolean {
  const p = process.env.WAREHOUSE_PASSWORD?.trim();
  return Boolean(p && p.length >= 8);
}

function sessionToken(): string {
  const p = process.env.WAREHOUSE_PASSWORD!.trim();
  return createHash("sha256")
    .update(`${COOKIE_VERSION}:${p}`)
    .digest("hex");
}

export async function assertWarehouseAccess(): Promise<void> {
  const { redirect } = await import("next/navigation");
  if (!isWarehouseConfigured()) {
    redirect("/warehouse/login?reason=unset");
  }
  const jar = await cookies();
  const got = jar.get(COOKIE)?.value;
  const exp = Buffer.from(sessionToken(), "utf8");
  const g = got ? Buffer.from(got, "utf8") : Buffer.alloc(0);
  if (g.length !== exp.length || !timingSafeEqual(g, exp)) {
    redirect("/warehouse/login");
  }
}

export async function setWarehouseCookie(): Promise<void> {
  const jar = await cookies();
  jar.set(COOKIE, sessionToken(), {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/warehouse",
    maxAge: 60 * 60 * 24 * 7,
  });
}

export async function clearWarehouseCookie(): Promise<void> {
  const jar = await cookies();
  jar.set(COOKIE, "", { httpOnly: true, path: "/warehouse", maxAge: 0 });
}
