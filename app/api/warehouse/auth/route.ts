import { NextResponse } from "next/server";
import { clearWarehouseCookie, isWarehouseConfigured, setWarehouseCookie } from "@/lib/warehouse-auth";

export const runtime = "nodejs";

export async function POST(req: Request) {
  if (!isWarehouseConfigured()) {
    return NextResponse.json({ error: "WAREHOUSE_PASSWORD が未設定です。" }, { status: 503 });
  }
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }
  const raw = (body as { password?: unknown }).password;
  if (typeof raw !== "string") {
    return NextResponse.json({ error: "password が必要です。" }, { status: 400 });
  }
  const expected = process.env.WAREHOUSE_PASSWORD!.trim();
  if (raw !== expected) {
    return NextResponse.json({ error: "パスワードが違います。" }, { status: 401 });
  }
  await setWarehouseCookie();
  return NextResponse.json({ ok: true });
}

export async function DELETE() {
  await clearWarehouseCookie();
  return NextResponse.json({ ok: true });
}
