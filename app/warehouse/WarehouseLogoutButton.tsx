"use client";

export function WarehouseLogoutButton() {
  async function logout() {
    await fetch("/api/warehouse/auth", { method: "DELETE" });
    window.location.href = "/warehouse/login";
  }
  return (
    <button
      type="button"
      onClick={() => void logout()}
      className="rounded-lg border border-white/20 bg-white/5 px-3 py-1.5 text-xs text-slate-200 hover:bg-white/10"
    >
      ログアウト
    </button>
  );
}
