import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  {
    // SDL Practice #9 banned functions (docs/sdl.md). Covered by tests/lint-bans.test.ts.
    rules: {
      // V1.3.2: no dynamic code execution.
      "no-eval": "error",
      "no-new-func": "error",
      "no-implied-eval": "error",
      // SR-9, V16.2.5: bodies, passwords, and tokens must not reach logs; use the project logger.
      "no-console": ["error", { allow: ["warn", "error"] }],
      "no-restricted-properties": [
        "error",
        // SR-7, V3.2.2: XSS sinks.
        { property: "innerHTML", message: "Banned (XSS). Use React's escaped rendering." },
        { property: "outerHTML", message: "Banned (XSS). Use React's escaped rendering." },
        // SR-8, V1.2.4: no string-built SQL.
        { property: "$queryRawUnsafe", message: "Banned (SQL injection). Use ORM calls or parameterized queries." },
        { property: "$executeRawUnsafe", message: "Banned (SQL injection). Use ORM calls or parameterized queries." },
        // V11.5.1: tokens, IDs, and passwords need a CSPRNG.
        { object: "Math", property: "random", message: "Banned for secrets and IDs. Use crypto.randomBytes or crypto.randomUUID." },
      ],
      "no-restricted-imports": [
        "error",
        // V1.2.5: no command execution.
        { paths: ["child_process", "node:child_process"].map((name) => ({ name, message: "Banned (command injection)." })) },
      ],
      "no-restricted-syntax": [
        "error",
        {
          // FW-3, A-5: Server Actions are hidden public POST endpoints; writes use Route Handlers only.
          selector: "ExpressionStatement[directive='use server']",
          message:
            'Server Actions ("use server") are banned. Use a Route Handler (app/api/**/route.ts). See AGENTS.md.',
        },
        {
          // SR-7, V3.2.2
          selector: "JSXAttribute[name.name='dangerouslySetInnerHTML']",
          message: "dangerouslySetInnerHTML is banned (XSS). Use React's escaped rendering.",
        },
        {
          // SR-2, V11.4.2: fast hashes are not for passwords.
          selector: "CallExpression:matches([callee.name='createHash'], [callee.property.name='createHash'])[arguments.0.value=/^(md5|sha1)$/i]",
          message: "MD5 and SHA-1 are banned. Use argon2id for passwords and SHA-256 or stronger elsewhere.",
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
