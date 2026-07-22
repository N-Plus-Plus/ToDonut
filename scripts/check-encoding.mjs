import { readdir, readFile } from "node:fs/promises";
import { extname, join, relative, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(fileURLToPath(new URL("..", import.meta.url)));
const extensions = new Set([".css", ".html", ".md", ".ts", ".tsx"]);
const roots = ["src", "docs"];
const rootDocuments = ["CODEX.md", "DESIGN.md", "FEATURE_AUDIT.md", "PATTERNS.md", "README.md", "ROADMAP.md", "STYLE.md"];

export const mojibakeMarkers = [
  String.fromCodePoint(0x00c2),
  String.fromCodePoint(0x00c3),
  String.fromCodePoint(0x00e2),
  String.fromCodePoint(0x00ef, 0x00bf, 0x00bd),
  String.fromCodePoint(0xfffd),
];

export function findEncodingDefects(text) {
  return mojibakeMarkers.filter((marker) => text.includes(marker));
}

async function sourceFiles(directory) {
  const entries = await readdir(directory, { withFileTypes: true });
  const nested = await Promise.all(entries.map((entry) => {
    const path = join(directory, entry.name);
    return entry.isDirectory() ? sourceFiles(path) : extensions.has(extname(path)) ? [path] : [];
  }));
  return nested.flat();
}

export async function checkEncoding() {
  const files = [...rootDocuments.map((file) => join(root, file)), ...(await Promise.all(roots.map((directory) => sourceFiles(join(root, directory))))).flat()];
  const findings = [];
  for (const file of files) {
    const text = await readFile(file, "utf8");
    for (const marker of findEncodingDefects(text)) findings.push(`${relative(root, file)}: ${JSON.stringify(marker)}`);
  }
  return findings;
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const findings = await checkEncoding();
  if (findings.length) {
    console.error(`Encoding guard found ${findings.length} malformed sequence(s):\n${findings.join("\n")}`);
    process.exitCode = 1;
  } else {
    console.log("Encoding guard passed.");
  }
}
