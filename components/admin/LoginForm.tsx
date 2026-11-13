"use client";
import { useActionState } from "react";
import { demoLogin, sendMagicLink } from "@/app/admin/(auth)/actions";

export function LoginForm() {
  const [state, action, pending] = useActionState(sendMagicLink, undefined);
  return (
    <form action={action} className="flex flex-col gap-3">
      <label className="field">Email<input type="email" name="email" required autoComplete="email" placeholder="you@shawarmatheory.ca" /></label>
      <button type="submit" className="btn btn-fire" disabled={pending}>{pending ? "Sending…" : "Email me a sign-in link"}</button>
      {state?.message ? <p role="status" className="text-sm font-medium text-muted">{state.message}</p> : null}
    </form>
  );
}

export function DemoLoginForm({ needsCode }: { needsCode: boolean }) {
  const [state, action, pending] = useActionState(demoLogin, undefined);
  return (
    <form action={action} className="flex flex-col gap-3 border-t border-line pt-4">
      {needsCode ? (
        <label className="field">Access code<input type="password" name="code" required autoComplete="off" placeholder="From the person who shared this demo" /></label>
      ) : null}
      <button type="submit" className="btn btn-coal w-full" disabled={pending}>{pending ? "Signing in…" : "Demo login"}</button>
      <p className="text-center text-xs text-faint">Demo mode only. Signs in as the demo owner.</p>
      {state?.error ? <p role="alert" className="text-center text-sm font-semibold text-sumac">{state.error}</p> : null}
    </form>
  );
}
