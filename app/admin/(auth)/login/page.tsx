import Image from "next/image";
import type { Metadata } from "next";
import { LoginForm } from "@/components/admin/LoginForm";
import { isMock } from "@/lib/env";
import { createClient } from "@/lib/supabase/server";
import { demoLogin, signOut } from "../actions";

export const metadata: Metadata = { title: "Staff sign in", robots: { index: false, follow: false } };
export const dynamic = "force-dynamic";

export default async function LoginPage({ searchParams }: { searchParams: Promise<{ error?: string }> }) {
  const sp = await searchParams;
  const { data } = await (await createClient()).auth.getUser();
  return (
    <main className="flex min-h-dvh items-center justify-center bg-coal p-5">
      <div className="w-full max-w-[420px] rounded-[28px] bg-cream p-8">
        <Image src="/brand/shawarma-theory-logo.png" alt="Shawarma Theory" width={72} height={72} className="mb-5 size-[72px] rounded-full" />
        <h1 className="font-display text-[32px]">Staff sign in</h1>
        {sp.error ? <p role="alert" className="mt-3 rounded-xl bg-sand px-3.5 py-2.5 text-sm font-semibold text-sumac">That link expired. Request a new one.</p> : null}
        {data.user ? (
          <form action={signOut} className="mt-3">
            <p role="alert" className="mb-3 rounded-xl bg-sand px-3.5 py-2.5 text-sm font-semibold text-sumac">This account isn&apos;t staff. Sign out and use a staff account.</p>
            <button type="submit" className="btn btn-line w-full">Sign out</button>
          </form>
        ) : null}
        <div className="mt-6 flex flex-col gap-4">
          <LoginForm />
          {isMock ? (
            <form action={demoLogin} className="border-t border-line pt-4">
              <button type="submit" className="btn btn-coal w-full">Demo login</button>
              <p className="mt-2 text-center text-xs text-faint">Demo mode only. Signs in as the seeded owner.</p>
            </form>
          ) : null}
        </div>
      </div>
    </main>
  );
}
