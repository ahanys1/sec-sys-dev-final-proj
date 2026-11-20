// T-50, ASVS V15.3.4: trust X-Forwarded-For only from the proxy in front of the app. Caddy overwrites the
// header with the client address, so with TRUSTED_PROXY_HOPS=1 the rightmost value is the verified one.
export function clientIp(headers: Headers, hops = Number(process.env.TRUSTED_PROXY_HOPS ?? "1")): string {
  const forwarded = headers.get("x-forwarded-for");
  if (!forwarded || !Number.isInteger(hops) || hops < 1) return "unknown";
  const parts = forwarded.split(",").map((part) => part.trim()).filter(Boolean);
  const ip = parts[parts.length - hops];
  return ip && ip.length <= 45 ? ip : "unknown";
}
