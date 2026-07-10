"use client";

import { createBrowserClient } from "@supabase/ssr";
import { getSupabaseConfig } from "@/lib/supabase/config";
import type { Database } from "@/lib/supabase/types";

export function createSupabaseBrowserClient() {
  const config = getSupabaseConfig();

  if (!config) {
    return null;
  }

  return createBrowserClient<Database>(config.url, config.publishableKey);
}
