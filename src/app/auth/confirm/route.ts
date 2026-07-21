import type { EmailOtpType } from "@supabase/supabase-js";
import { type NextRequest, NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export async function GET(request: NextRequest) {
  const tokenHash = request.nextUrl.searchParams.get("token_hash");
  const type = request.nextUrl.searchParams.get("type") as EmailOtpType | null;
  const redirectTo = request.nextUrl.clone();
  redirectTo.pathname = "/settings";
  redirectTo.search = "";

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
    }
  }

  redirectTo.pathname = "/sign-in";
  redirectTo.searchParams.set(
    "error",
    "The confirmation link is invalid or expired. Request a new signup email and try again."
  );
  return NextResponse.redirect(redirectTo);
}
