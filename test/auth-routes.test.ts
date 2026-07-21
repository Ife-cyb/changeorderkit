import { NextRequest } from "next/server";
import { beforeEach, describe, expect, it, vi } from "vitest";

const exchangeCodeForSession = vi.fn();
const verifyOtp = vi.fn();

vi.mock("../src/lib/supabase/server", () => ({
  createSupabaseServerClient: vi.fn(async () => ({
    auth: {
      exchangeCodeForSession,
      verifyOtp
    }
  }))
}));

import { GET as callbackGet } from "../src/app/auth/callback/route";
import { GET as confirmGet } from "../src/app/auth/confirm/route";

beforeEach(() => {
  exchangeCodeForSession.mockReset();
  exchangeCodeForSession.mockResolvedValue({ error: null });
  verifyOtp.mockReset();
  verifyOtp.mockResolvedValue({ error: null });
});

describe("authentication continuation routes", () => {
  it("preserves a safe PKCE continuation after exchanging the code", async () => {
    const response = await callbackGet(
      new NextRequest(
        "https://changeorderkit.vercel.app/auth/callback?code=test&next=%2Fdashboard%2Fdocuments%2Fnew%3Ftype%3Dwork-order"
      )
    );

    expect(exchangeCodeForSession).toHaveBeenCalledWith("test");
    expect(response.headers.get("location")).toBe(
      "https://changeorderkit.vercel.app/dashboard/documents/new?type=work-order"
    );
  });

  it("falls back instead of following an unsafe PKCE continuation", async () => {
    const response = await callbackGet(
      new NextRequest(
        "https://changeorderkit.vercel.app/auth/callback?code=test&next=%2F%2Fevil.example"
      )
    );

    expect(response.headers.get("location")).toBe("https://changeorderkit.vercel.app/settings");
  });

  it("preserves a safe continuation from a token-hash RedirectTo URL", async () => {
    const redirectTo = encodeURIComponent(
      "https://changeorderkit.vercel.app/auth/callback?next=%2Fdashboard%2Fdocuments%2Fnew%3Ftype%3Dservice-agreement"
    );
    const response = await confirmGet(
      new NextRequest(
        `https://changeorderkit.vercel.app/auth/confirm?token_hash=test&type=email&redirect_to=${redirectTo}`
      )
    );

    expect(verifyOtp).toHaveBeenCalledWith({ token_hash: "test", type: "email" });
    expect(response.headers.get("location")).toBe(
      "https://changeorderkit.vercel.app/dashboard/documents/new?type=service-agreement"
    );
  });

  it("falls back instead of trusting a cross-origin token-hash RedirectTo URL", async () => {
    const redirectTo = encodeURIComponent(
      "https://evil.example/auth/callback?next=%2Fdashboard"
    );
    const response = await confirmGet(
      new NextRequest(
        `https://changeorderkit.vercel.app/auth/confirm?token_hash=test&type=email&redirect_to=${redirectTo}`
      )
    );

    expect(response.headers.get("location")).toBe("https://changeorderkit.vercel.app/settings");
  });
});
