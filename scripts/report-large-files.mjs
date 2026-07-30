import { readdir, readFile } from "node:fs/promises";
import { join, relative } from "node:path";

const root = process.cwd();
const limit = Number(process.env.MAX_SOURCE_LINES || 600);
const include = new Set([".ts", ".tsx"]);
const ignoredDirectories = new Set(["node_modules", "dist", ".next", "coverage"]);
const exceptions = new Set(["BE/prisma/schema.prisma", "BE/prisma/seed.ts"]);

async function walk(directory) {
  const entries = await readdir(directory, { withFileTypes: true });
  return (await Promise.all(entries.map(async (entry) => {
    const fullPath = join(directory, entry.name);
    if (entry.isDirectory()) {
      return ignoredDirectories.has(entry.name) || entry.name.startsWith(".next") || entry.name === ".cache"
        ? []
        : walk(fullPath);
    }
    if (!entry.isFile()) return [];
    const relativePath = relative(root, fullPath).replaceAll("\\", "/");
    const extension = entry.name.slice(entry.name.lastIndexOf("."));
    if (!include.has(extension) || exceptions.has(relativePath)) return [];
    const lines = (await readFile(fullPath, "utf8")).split(/\r?\n/).length;
    return lines > limit ? [{ relativePath, lines }] : [];
  }))).flat();
}

const oversized = (await walk(root)).sort((a, b) => b.lines - a.lines);
if (oversized.length === 0) {
  console.log(`No source files exceed ${limit} lines.`);
} else {
  console.warn(`Warning: ${oversized.length} source file(s) exceed ${limit} lines.`);
  for (const item of oversized) console.warn(`  ${item.lines.toString().padStart(5)}  ${item.relativePath}`);
}
