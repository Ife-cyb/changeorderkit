import { NextResponse } from "next/server";
import { isSupabaseConfigured } from "@/lib/supabase/config";

export const dynamic = "force-dynamic";
const builtAt = new Date().toISOString();

export function GET() {
  const supabaseConfigured = isSupabaseConfigured();

  return NextResponse.json(
    {
      status: supabaseConfigured ? "ok" : "degraded",
      supabaseConfigured,
      commit: (process.env.VERCEL_GIT_COMMIT_SHA ?? "dev").slice(0, 7),
      builtAt
    },
    {
      status: supabaseConfigured ? 200 : 503,
      headers: {
        "Cache-Control": "no-store"
      }
    }
  );
}
