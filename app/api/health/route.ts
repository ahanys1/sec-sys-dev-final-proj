import { jsonResponse, methodNotAllowed } from "@/src/lib/http";

// EP-03: liveness only. No version, hostname, or database details (V13.4.5).
export function GET() {
  return jsonResponse({ status: "ok" });
}

// NFR-2, ASVS V16.5.1: unsupported methods use the same JSON error and Allow header.
export function OPTIONS() {
  return methodNotAllowed(["GET", "HEAD"]);
}

export const POST = () => methodNotAllowed(["GET", "HEAD"]);

export const PUT = () => methodNotAllowed(["GET", "HEAD"]);

export const PATCH = () => methodNotAllowed(["GET", "HEAD"]);

export const DELETE = () => methodNotAllowed(["GET", "HEAD"]);
