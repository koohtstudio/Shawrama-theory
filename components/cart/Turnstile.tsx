"use client";
import { useEffect, useRef } from "react";
import { isMock, publicEnv } from "@/lib/env";

type TurnstileApi = { render: (el: HTMLElement, o: { sitekey: string; callback: (t: string) => void }) => string; remove: (id: string) => void };

/** Cloudflare Turnstile. Renders nothing in mock mode (the server stub always passes). */
export function Turnstile({ onToken }: { onToken: (t: string) => void }) {
  const ref = useRef<HTMLDivElement>(null);
  const siteKey = publicEnv.NEXT_PUBLIC_TURNSTILE_SITE_KEY;

  useEffect(() => {
    if (isMock || !siteKey || !ref.current) return;
    let id: string | undefined;
    const el = ref.current;
    const mount = () => {
      const api = (window as unknown as { turnstile?: TurnstileApi }).turnstile;
      if (api && !id) id = api.render(el, { sitekey: siteKey, callback: onToken });
    };
    if (!document.querySelector("script[data-turnstile]")) {
      const s = document.createElement("script");
      s.src = "https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit";
      s.async = true;
      s.dataset.turnstile = "1";
      s.onload = mount;
      document.head.appendChild(s);
    } else mount();
    return () => {
      const api = (window as unknown as { turnstile?: TurnstileApi }).turnstile;
      if (id && api) api.remove(id);
    };
  }, [siteKey, onToken]);

  return isMock ? null : <div ref={ref} className="min-h-[65px]" />;
}
