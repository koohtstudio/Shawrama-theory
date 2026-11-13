import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import type { Database } from "@/lib/database.types";

/** Refreshes the auth cookie. Returns who is signed in and whether they are staff. Edge-safe. */
export async function updateSession(request: NextRequest, response: NextResponse) {
  const supabase = createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll: () => request.cookies.getAll(),
        setAll: (list) => {
          for (const { name, value, options } of list) {
            request.cookies.set(name, value);
            response.cookies.set(name, value, options);
          }
        },
      },
    },
  );
  const { data } = await supabase.auth.getUser();
  if (!data.user) return { userId: null, isStaff: false };
  const { data: profile } = await supabase.from("profiles").select("role").eq("user_id", data.user.id).maybeSingle();
  return { userId: data.user.id, isStaff: !!profile };
}
