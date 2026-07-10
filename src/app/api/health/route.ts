import { NextResponse } from "next/server";
import { isSupabaseConfigured } from "@/lib/supabase/config";

export const dynamic = "force-dynamic";

export function GET() {
  const supabaseConfigured = isSupabaseConfigured();

  return NextResponse.json(
    {
      status: supabaseConfigured ? "ok" : "degraded",
      supabaseConfigured
    },
    {
      status: supabaseConfigured ? 200 : 503,
      headers: {
        "Cache-Control": "no-store"
      }
    }
  );
}
