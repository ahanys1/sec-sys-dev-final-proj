// NH-4, T-62 (ASVS V6.3.2): the only way to create the first administrator. No setup page and no default
// account. The username and password are prompted (hidden on a terminal) or read from piped stdin, never from
// argv or the environment. Writes a `user.create` audit record with the system actor (DC-3).
import { readFileSync } from "node:fs";
import { createFirstAdmin } from "../src/lib/auth/create-admin";
import { getDb } from "../src/lib/db";

const out = (text: string) => process.stdout.write(text);

function makePrompt(): (question: string, hidden: boolean) => Promise<string> {
  if (!process.stdin.isTTY) {
    const lines = readFileSync(0, "utf8").split("\n");
    return async () => lines.shift()?.replace(/\r$/, "") ?? "";
  }
  const { stdin } = process;
  return (question, hidden) =>
    new Promise((resolve) => {
      out(question);
      let value = "";
      stdin.setRawMode(true);
      stdin.resume();
      stdin.setEncoding("utf8");
      const onData = (chunk: string) => {
        for (const ch of chunk) {
          const code = ch.charCodeAt(0);
          if (code === 13 || code === 10) {
            stdin.setRawMode(false);
            stdin.pause();
            stdin.off("data", onData);
            out("\n");
            return resolve(value);
          }
          if (code === 3) process.exit(130); // Ctrl-C
          if (code === 127) value = value.slice(0, -1);
          else value += ch;
          if (!hidden && code !== 127) out(ch);
        }
      };
      stdin.on("data", onData);
    });
}

async function main() {
  const ask = makePrompt();
  const username = await ask("Admin username: ", false);
  const password = await ask("Password (15 to 128 characters): ", true);
  if (password !== (await ask("Repeat password: ", true))) throw new Error("Passwords do not match.");

  const db = getDb();
  const user = await createFirstAdmin(db, { username, password });
  out(`Created administrator "${user.username}".\n`);
  await db.$disconnect();
}

main().catch((err: unknown) => {
  process.stderr.write(`create-admin failed: ${err instanceof Error ? err.message : "unknown error"}\n`);
  process.exit(1);
});
