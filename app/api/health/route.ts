import { jsonResponse, methodNotAllowed } from "@/src/lib/http";

// EP-03: liveness only. No version, hostname, or database details (V13.4.5).
export function GET() {
  return jsonResponse({ status: "ok" });
}

// T-48: Next answers OPTIONS itself; refuse it explicitly. Other methods get 405 from Next.
export function OPTIONS() {
  return methodNotAllowed(["GET"]);
}
