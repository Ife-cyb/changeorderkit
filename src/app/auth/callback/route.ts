import { type NextRequest, NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export async function GET(request: NextRequest) {
  const code = request.nextUrl.searchParams.get("code");
  const redirectTo = request.nextUrl.clone();
  redirectTo.pathname = "/settings";
  redirectTo.search = "";

  if (code) {
    const supabase = await createSupabaseServerClient();

    if (supabase) {
      const { error } = await supabase.auth.exchangeCodeForSession(code);

      if (!error) {
        return NextResponse.redirect(redirectTo);
      }
    }
  }

  redirectTo.pathname = "/sign-in";
  redirectTo.searchParams.set(
    "error",
    "The confirmation link is invalid or expired. Request a new signup email and try again."
  );
  return NextResponse.redirect(redirectTo);
}
