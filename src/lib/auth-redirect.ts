const redirectBase = "https://changeorderkit.invalid";
const unsafeRedirectCharacters = /[\\\u0000-\u001f\u007f]/;

export function safeNextPath(value: unknown, fallback = "/dashboard") {
  const raw = typeof value === "string" ? value : "";

  if (!raw.startsWith("/") || unsafeRedirectCharacters.test(raw)) {
    return fallback;
  }

  try {
    const url = new URL(raw, redirectBase);

    if (url.origin !== redirectBase) {
      return fallback;
    }

    return `${url.pathname}${url.search}${url.hash}`;
  } catch {
    return fallback;
  }
}

export function safeNextPathFromRedirectUrl(
  value: unknown,
  expectedOrigin: string,
  fallback = "/settings"
) {
  if (typeof value !== "string") {
    return fallback;
  }

  try {
    const redirectUrl = new URL(value);
    const origin = new URL(expectedOrigin);

    if (
      (redirectUrl.protocol !== "http:" && redirectUrl.protocol !== "https:") ||
      redirectUrl.origin !== origin.origin
    ) {
      return fallback;
    }

    return safeNextPath(redirectUrl.searchParams.get("next"), fallback);
  } catch {
    return fallback;
  }
}
