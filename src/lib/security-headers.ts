// C-7, SR-16 (ASVS V3.4.1 to V3.4.6): one source of truth for response security headers.
// Used by proxy.ts (every page, API, and error response) and next.config.ts (static files too).

/** Headers that don't depend on the request. No CORS headers: the app is same-origin only. */
export const STATIC_HEADERS: Record<string, string> = {
  "Strict-Transport-Security": "max-age=63072000; includeSubDomains",
  "X-Content-Type-Options": "nosniff",
  "Referrer-Policy": "no-referrer",
  "X-Frame-Options": "DENY",
  "Permissions-Policy": "camera=(), microphone=(), geolocation=(), payment=(), usb=()",
  "Cross-Origin-Opener-Policy": "same-origin",
  "Cross-Origin-Resource-Policy": "same-origin",
};

/** CSP with a per-request nonce (T-22, T-29). 'unsafe-eval' and websockets are for `next dev` only. */
export function buildCsp(nonce: string, isDev: boolean): string {
  const directives = [
    "default-src 'self'",
    `script-src 'self' 'nonce-${nonce}' 'strict-dynamic'${isDev ? " 'unsafe-eval'" : ""}`,
    `style-src 'self' 'nonce-${nonce}'`,
    "img-src 'self' data:",
    "font-src 'self'",
    `connect-src 'self'${isDev ? " ws:" : ""}`,
    "object-src 'none'",
    "base-uri 'self'",
    "form-action 'self'",
    "frame-ancestors 'none'",
  ];
  if (!isDev) directives.push("upgrade-insecure-requests");
  return directives.join("; ");
}

/** Authenticated pages and APIs must not be cached (T-30, ASVS V14.3.2). */
export const NO_STORE = "no-store";

/** A fresh, unguessable nonce for every request. */
export function newNonce(): string {
  return btoa(crypto.randomUUID());
}
