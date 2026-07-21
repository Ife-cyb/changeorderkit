import { type NextRequest, NextResponse } from "next/server";
import { safeNextPath } from "@/lib/auth-redirect";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export async function GET(request: NextRequest) {
  const code = request.nextUrl.searchParams.get("code");
  const next = safeNextPath(request.nextUrl.searchParams.get("next"), "/settings");
  const redirectTo = new URL(next, request.url);

  if (code) {
    const supabase = await createSupabaseServerClient();

    if (supabase) {
      const { error } = await supabase.auth.exchangeCodeForSession(code);

      if (!error) {
        return NextResponse.redirect(redirectTo);
      }

      console.error("Supabase Auth code exchange failed.", {
        code: error.code,
        message: error.message,
        status: error.status
      });
    }
  }

  const errorRedirect = new URL("/sign-in", request.url);
  errorRedirect.searchParams.set("next", next);
  errorRedirect.searchParams.set(
    "error",
    "The confirmation link is invalid or expired. Request a new signup email and try again."
  );
  return NextResponse.redirect(errorRedirect);
}
