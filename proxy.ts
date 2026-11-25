import { NextResponse, type NextRequest } from "next/server";
import { buildCsp, newNonce, NO_STORE, STATIC_HEADERS } from "@/src/lib/security-headers";

// Next 16 renamed "middleware" to "proxy". This file sets security headers and the CSP nonce ONLY.
// It must never authenticate or authorize: every handler and page checks the session itself (C-2, FW-1, SR-5).
export function proxy(request: NextRequest) {
  const nonce = newNonce();
  const csp = buildCsp(nonce, process.env.NODE_ENV === "development");
  // T-43, CVE-2025-29927: a client must never be able to claim an internal subrequest.
  if (request.headers.has("x-middleware-subrequest")) {
    return new NextResponse(null, {
      status: 400,
      headers: { ...STATIC_HEADERS, "Content-Security-Policy": csp, "Cache-Control": NO_STORE },
    });
  }

  // Next reads the nonce from the request's CSP header while rendering.
  const requestHeaders = new Headers(request.headers);
  requestHeaders.set("x-nonce", nonce);
  requestHeaders.set("Content-Security-Policy", csp);

  const response = NextResponse.next({ request: { headers: requestHeaders } });
  response.headers.set("Content-Security-Policy", csp);
  response.headers.set("Cache-Control", NO_STORE);
  for (const [name, value] of Object.entries(STATIC_HEADERS)) response.headers.set(name, value);
  return response;
}

// Every path except build output, which next.config.ts covers with the static headers (T-49).
export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
