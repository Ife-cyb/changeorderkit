import { type NextRequest, NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export async function GET(request: NextRequest) {
  const code = request.nextUrl.searchParams.get("code");
  const redirectTo = request.nextUrl.clone();
  redirectTo.pathname = "/update-password";
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

  redirectTo.pathname = "/forgot-password";
  redirectTo.searchParams.set(
    "error",
    "The password-reset link is invalid or expired. Request a new link and try again."
  );
  return NextResponse.redirect(redirectTo);
}
