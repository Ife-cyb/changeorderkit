import { describe, expect, it } from "vitest";
import { safeNextPath, safeNextPathFromRedirectUrl } from "../src/lib/auth-redirect";

describe("safeNextPath", () => {
  it("keeps same-origin paths, queries, and fragments", () => {
    expect(safeNextPath("/dashboard/documents/new?type=work-order#form")).toBe(
      "/dashboard/documents/new?type=work-order#form"
    );
  });

  it.each([
    "https://evil.example/path",
    "//evil.example/path",
    "/\\evil.example/path",
    "/dashboard\nSet-Cookie: stolen=true",
    "dashboard"
  ])("rejects redirect escape %j", (value) => {
    expect(safeNextPath(value, "/safe")).toBe("/safe");
  });

  it("uses the fallback for non-string values", () => {
    expect(safeNextPath(null, "/safe")).toBe("/safe");
  });
});

describe("safeNextPathFromRedirectUrl", () => {
  it("extracts a safe continuation from a same-origin Supabase RedirectTo URL", () => {
    expect(
      safeNextPathFromRedirectUrl(
        "https://changeorderkit.vercel.app/auth/callback?next=%2Fdashboard%2Fdocuments%2Fnew%3Ftype%3Dwork-order",
        "https://changeorderkit.vercel.app"
      )
    ).toBe("/dashboard/documents/new?type=work-order");
  });

  it.each([
    "https://evil.example/auth/callback?next=%2Fdashboard",
    "javascript:alert(1)",
    "not a URL"
  ])("rejects an untrusted RedirectTo URL: %s", (value) => {
    expect(
      safeNextPathFromRedirectUrl(value, "https://changeorderkit.vercel.app", "/safe")
    ).toBe("/safe");
  });

  it("rejects an unsafe nested continuation", () => {
    expect(
      safeNextPathFromRedirectUrl(
        "https://changeorderkit.vercel.app/auth/callback?next=%2F%2Fevil.example",
        "https://changeorderkit.vercel.app",
        "/safe"
      )
    ).toBe("/safe");
  });
});
