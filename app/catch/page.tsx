import { Suspense } from "react";
import { CatchInner } from "./CatchInner";

export default function CatchPage() {
  return (
    <Suspense
      fallback={
        <div className="flex flex-1 items-center justify-center px-4 py-24 text-sm text-slate-400">
          波を読み込んでいます…
        </div>
      }
    >
      <CatchInner />
    </Suspense>
  );
}
