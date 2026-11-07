import { readFileSync, statSync } from "node:fs";
import path from "node:path";

// API keys: a value in the project's .env wins over the same name exported in
// your shell. That's the opposite of Next's usual rule, on purpose: someone can
// put their own key in .env without unsetting the one in their shell.
//
// The file is re-read when it changes, so editing .env takes effect without a
// restart. Values are never logged; only where a key came from is reported.

export type KeySource = "env-file" | "shell" | null;

let cachedAt = -1;
let cachedFile = new Map<string, string>();

function dotEnv(): Map<string, string> {
  const file = path.join(process.cwd(), ".env");
  let mtime: number;
  try {
    mtime = statSync(file).mtimeMs;
  } catch {
    cachedAt = -1;
    cachedFile = new Map();
    return cachedFile;
  }
  if (mtime === cachedAt) return cachedFile;
  cachedAt = mtime;
  cachedFile = parseDotEnv(readFileSync(file, "utf8"));
  return cachedFile;
}

// Enough of the .env format for keys: NAME=value, optional "export ", quotes,
// and comments after unquoted values.
export function parseDotEnv(text: string): Map<string, string> {
  const out = new Map<string, string>();
  for (const line of text.split(/\r?\n/)) {
    const m = line.match(/^\s*(?:export\s+)?([A-Za-z_][A-Za-z0-9_]*)\s*=\s*(.*)$/);
    if (!m) continue;
    let value = m[2].trim();
    const quote = value[0];
    if ((quote === '"' || quote === "'") && value.lastIndexOf(quote) > 0) value = value.slice(1, value.lastIndexOf(quote));
    else value = value.replace(/\s+#.*$/, "").trim();
    out.set(m[1], value);
  }
  return out;
}

export function secret(name: string): { value: string | undefined; source: KeySource } {
  const fromFile = dotEnv().get(name);
  if (fromFile) return { value: fromFile, source: "env-file" };
  const fromShell = process.env[name];
  if (fromShell) return { value: fromShell, source: "shell" };
  return { value: undefined, source: null };
}
