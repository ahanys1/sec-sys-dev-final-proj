import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // FW-5, NFR-2, ASVS V13.4.2: don't disclose the framework via X-Powered-By.
  poweredByHeader: false,
  // FW-4, ASVS V15.2.2: disable the image optimizer; no remotePatterns, so no SSRF surface.
  images: { unoptimized: true },
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
