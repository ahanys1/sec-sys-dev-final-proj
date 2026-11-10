import { describe, expect, it } from "vitest";
import nextConfig from "@/next.config";

describe("next.config hardening", () => {
  it("hides X-Powered-By (FW-5, NFR-2, V13.4.2)", () => {
    expect(nextConfig.poweredByHeader).toBe(false);
  });

  it("disables the image optimizer with no remote patterns (FW-4, V15.2.2)", () => {
    expect(nextConfig.images?.unoptimized).toBe(true);
    expect(nextConfig.images?.remotePatterns).toBeUndefined();
  });
});
