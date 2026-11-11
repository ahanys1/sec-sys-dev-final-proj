import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  {
    rules: {
      // FW-3, A-5: Server Actions are hidden public POST endpoints; writes use Route Handlers only.
      "no-restricted-syntax": [
        "error",
        {
          selector: "ExpressionStatement[directive='use server']",
          message:
            'Server Actions ("use server") are banned. Use a Route Handler (app/api/**/route.ts). See AGENTS.md.',
        },
      ],
    },
  },
  // Override default ignores of eslint-config-next.
  globalIgnores([
    // Default ignores of eslint-config-next:
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
  ]),
]);

export default eslintConfig;
