"use client";
import { useCallback, useState } from "react";

/** Tiny toast for admin forms. `say` shows a message; `node` renders it. */
export function useSay() {
  const [msg, setMsg] = useState<{ text: string; bad: boolean } | null>(null);
  const say = useCallback((text: string, bad = false) => {
    setMsg({ text, bad });
    setTimeout(() => setMsg(null), 3200);
  }, []);
  const node = (
    <div role="status" className={`pointer-events-none fixed bottom-6 left-1/2 z-50 -translate-x-1/2 rounded-full px-5 py-3 font-semibold transition-all duration-500 ${msg ? "translate-y-0 opacity-100" : "translate-y-5 opacity-0"} ${msg?.bad ? "bg-sumac text-cream" : "bg-coal text-cream"}`}>
      {msg?.text ?? " "}
    </div>
  );
  return { say, node };
}
