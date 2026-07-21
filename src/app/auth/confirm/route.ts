import type { EmailOtpType } from "@supabase/supabase-js";
import { type NextRequest, NextResponse } from "next/server";
import { safeNextPath, safeNextPathFromRedirectUrl } from "@/lib/auth-redirect";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export async function GET(request: NextRequest) {
  const tokenHash = request.nextUrl.searchParams.get("token_hash");
  const type = request.nextUrl.searchParams.get("type") as EmailOtpType | null;
  const redirectUrl = request.nextUrl.searchParams.get("redirect_to");
  const next = redirectUrl
    ? safeNextPathFromRedirectUrl(redirectUrl, request.nextUrl.origin, "/settings")
    : safeNextPath(request.nextUrl.searchParams.get("next"), "/settings");
  const redirectTo = new URL(next, request.url);

  if (tokenHash && type) {
    const supabase = await createSupabaseServerClient();

    if (supabase) {
      const { error } = await supabase.auth.verifyOtp({
        type,
        token_hash: tokenHash
      });

      if (!error) {
        return NextResponse.redirect(redirectTo);
      }

      console.error("Supabase Auth token verification failed.", {
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
