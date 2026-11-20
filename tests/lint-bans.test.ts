import { describe, expect, it } from "vitest";
import { ESLint } from "eslint";

// SDL Practice #9: every banned function must fail lint (SR-2, SR-7, SR-8, SR-9, FW-3; V1.2.4, V1.3.2, V1.2.5, V11.5.1).
const eslint = new ESLint();

async function messages(code: string) {
  const [result] = await eslint.lintText(code, { filePath: "app/example.tsx" });
  return result.messages;
}

const banned: Record<string, string> = {
  eval: "eval('1');",
  "new Function": "new Function('return 1');",
  "string setTimeout": "setTimeout('alert(1)', 10);",
  "console.log": "console.log('body');",
  innerHTML: "document.body.innerHTML = 'x';",
  outerHTML: "document.body.outerHTML = 'x';",
  $queryRawUnsafe: "export const f = (db: any, q: string) => db.$queryRawUnsafe(q);",
  $executeRawUnsafe: "export const f = (db: any, q: string) => db.$executeRawUnsafe(q);",
  "Math.random": "export const t = Math.random();",
  child_process: "import { exec } from 'child_process'; exec('ls');",
  "node:child_process": "import { spawn } from 'node:child_process'; spawn('ls');",
  md5: "import { createHash } from 'crypto'; createHash('md5');",
  sha1: "import { createHash } from 'crypto'; createHash('sha1');",
  "use server": "'use server';\nexport async function a() {}",
  dangerouslySetInnerHTML: "export const C = () => <div dangerouslySetInnerHTML={{ __html: 'x' }} />;",
};

describe("banned functions fail lint (SDL #9)", () => {
  for (const [name, code] of Object.entries(banned)) {
    it(`rejects ${name}`, async () => {
      const found = await messages(code);
      expect(found.some((m) => m.severity === 2)).toBe(true);
    });
  }

  it("allows sha256 and crypto.randomUUID", async () => {
    const found = await messages(
      "import { createHash, randomUUID } from 'crypto'; export const h = createHash('sha256'); export const id = randomUUID();",
    );
    expect(found.filter((m) => m.severity === 2)).toEqual([]);
  });
});
