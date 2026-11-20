import type { NextConfig } from "next";
import { STATIC_HEADERS } from "./src/lib/security-headers";

const nextConfig: NextConfig = {
  // FW-5, NFR-2, ASVS V13.4.2: don't disclose the framework via X-Powered-By.
  poweredByHeader: false,
  // Smaller runtime image: only the traced files are copied (see Dockerfile).
  output: "standalone",
  // FW-4, ASVS V15.2.2: disable the image optimizer; no remotePatterns, so no SSRF surface.
  images: { unoptimized: true },
  // C-7, T-49: the same security headers on build output, which proxy.ts does not match.
  async headers() {
    return [{ source: "/:path*", headers: Object.entries(STATIC_HEADERS).map(([key, value]) => ({ key, value })) }];
  },
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
};

export default nextConfig;
