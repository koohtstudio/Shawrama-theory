"use client";
import { useActionState } from "react";
import { sendMagicLink } from "@/app/admin/(auth)/actions";

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
