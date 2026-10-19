import { readdir, readFile } from "node:fs/promises";
import path from "node:path";
import process from "node:process";

const root = process.cwd();
const ignoredDirectories = new Set([".git", ".next", "node_modules", "coverage", ".vercel"]);
const ignoredFiles = new Set([".env.local"]);
const ignoredExtensions = new Set([".exe", ".png", ".jpg", ".jpeg", ".gif", ".ico"]);
const secretPatterns = [
  { name: "token-like value", pattern: /\b(?:sk|st)_[A-Za-z0-9_-]{16,}\b/ },
  { name: "server token assignment", pattern: /ANTHROPIC_AUTH_TOKEN\s*=\s*(?!replace-with|<)[^\s#]+/i },
];

async function collectFiles(directory) {
  const entries = await readdir(directory, { withFileTypes: true });
  const files = [];
  for (const entry of entries) {
    if (entry.isDirectory() && ignoredDirectories.has(entry.name)) continue;
    if (entry.isFile() && !ignoredFiles.has(entry.name) && !ignoredExtensions.has(path.extname(entry.name).toLowerCase())) files.push(path.join(directory, entry.name));
    if (entry.isDirectory()) files.push(...await collectFiles(path.join(directory, entry.name)));
  }
  return files;
}

const matches = [];
for (const file of await collectFiles(root)) {
  const content = await readFile(file, "utf8");
  for (const { name, pattern } of secretPatterns) {
    if (pattern.test(content)) matches.push(`${path.relative(root, file)}: ${name}`);
  }
}

if (matches.length > 0) {
  console.error("Potential secret detected. Values are intentionally not printed:");
  for (const match of matches) console.error(`- ${match}`);
  process.exit(1);
}

console.log("Secret scan passed: no token-like values found in publishable files.");
