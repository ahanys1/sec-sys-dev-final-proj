// CI guards that ESLint can't express (SDL #3 release gate item 7, SDL #9).
// FW-3/A-5: no Server Actions. T-52, SR-14: PostgreSQL must not publish a host port.
import { readdirSync, readFileSync, statSync } from "node:fs";
import { join } from "node:path";
import { pathToFileURL } from "node:url";

const SOURCE_DIRS = ["app", "src"];
const COMPOSE_FILE = /^(docker-)?compose(\..+)?\.ya?ml$/;

function walk(dir, out = []) {
  let entries;
  try {
    entries = readdirSync(dir);
  } catch {
    return out;
  }
  for (const name of entries) {
    if (name === "node_modules" || name === ".next" || name === ".git") continue;
    const path = join(dir, name);
    if (statSync(path).isDirectory()) walk(path, out);
    else out.push(path);
  }
  return out;
}

export function findServerActions(text) {
  return /^\s*['"]use server['"]/m.test(text);
}

export function findPublishedDbPorts(yaml) {
  const bad = [];
  const blocks = yaml.split(/^(?=  [\w-]+:\s*$)/m);
  for (const block of blocks) {
    if (/image:\s*\S*postgres/i.test(block) && /^\s+ports:/m.test(block)) {
      bad.push(block.split("\n")[0].trim());
    }
  }
  return bad;
}

export function run(root = ".") {
  const failures = [];
  for (const dir of SOURCE_DIRS) {
    for (const file of walk(join(root, dir))) {
      if (/\.(t|j)sx?$/.test(file) && findServerActions(readFileSync(file, "utf8"))) {
        failures.push(`Server Action directive in ${file}`);
      }
    }
  }
  for (const file of walk(root)) {
    if (COMPOSE_FILE.test(file.split("/").pop() ?? "")) {
      for (const svc of findPublishedDbPorts(readFileSync(file, "utf8"))) {
        failures.push(`PostgreSQL service ${svc} publishes a port in ${file}`);
      }
    }
  }
  return failures;
}

if (import.meta.url === pathToFileURL(process.argv[1] ?? "").href) {
  const failures = run();
  if (failures.length > 0) {
    for (const f of failures) console.error(`FAIL: ${f}`);
    process.exit(1);
  }
  process.stdout.write("ci-guards: ok\n");
}
