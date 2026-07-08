import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import { getSupabaseConfig } from "@/lib/supabase/config";
import type { Database } from "@/lib/supabase/types";

function nextResponse(request: NextRequest) {
  return NextResponse.next({
    request: {
      headers: request.headers
    }
  });
}

export async function updateSession(request: NextRequest) {
  const config = getSupabaseConfig();
  let response = nextResponse(request);

  if (!config) {
    return response;
  }

  const supabase = createServerClient<Database>(config.url, config.publishableKey, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet, headers) {
        cookiesToSet.forEach(({ name, value }) => {
          request.cookies.set(name, value);
        });

        response = nextResponse(request);

        cookiesToSet.forEach(({ name, value, options }) => {
          response.cookies.set(name, value, options);
        });

        Object.entries(headers).forEach(([key, value]) => {
          response.headers.set(key, value);
        });
      }
    }
  });

  await supabase.auth.getClaims();

  return response;
}
