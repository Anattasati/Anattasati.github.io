import assert from "node:assert/strict";
import { access, readFile, readdir } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const repositoryRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const outputRoot = path.join(repositoryRoot, "dist");

const expectedFiles = [
  "index.html",
  "404.html",
  "CNAME",
  "LICENSE",
  "favicon.svg",
  "robots.txt",
  "feed.xml",
  "reflections/index.html",
  "reflections/hello-world/index.html",
  "reflections/starlight-and-seeing/index.html",
  "reflections/when-the-searching-stops/index.html",
  "meditations/index.html",
  "meditations/calm-ease/index.html",
];

const walk = async (directory) => {
  const entries = await readdir(directory, { withFileTypes: true });
  const files = await Promise.all(
    entries.map(async (entry) => {
      const target = path.join(directory, entry.name);
      return entry.isDirectory() ? walk(target) : [target];
    }),
  );
  return files.flat();
};

const localPathToFile = (urlPath) => {
  const decoded = decodeURIComponent(urlPath.split(/[?#]/, 1)[0]);
  const relative = decoded.replace(/^\/+/, "");

  if (!relative) return "index.html";
  if (decoded.endsWith("/")) return path.join(relative, "index.html");
  return relative;
};

for (const relative of expectedFiles) {
  await access(path.join(outputRoot, relative));
}

const htmlFiles = (await walk(outputRoot)).filter((file) => file.endsWith(".html"));
const expectedHtmlFiles = expectedFiles.filter((file) => file.endsWith(".html"));
assert.ok(
  htmlFiles.length >= expectedHtmlFiles.length,
  `Expected at least ${expectedHtmlFiles.length} generated HTML pages`,
);

for (const htmlFile of htmlFiles) {
  const html = await readFile(htmlFile, "utf8");
  const label = path.relative(outputRoot, htmlFile);

  assert.match(html, /<!doctype html>/i, `${label} is missing its HTML doctype`);
  assert.match(html, /<html[^>]+lang="en"/i, `${label} is missing its language`);
  assert.match(html, /<main[^>]+id="main-content"/i, `${label} is missing its main landmark`);
  assert.match(html, /<h1\b/i, `${label} is missing its primary heading`);
  assert.doesNotMatch(html, /https?:\/\/(?:fonts\.googleapis|fonts\.gstatic|unpkg|cdn\.jsdelivr)\./i, `${label} loads a remote runtime asset`);
  assert.doesNotMatch(html, /javascript:/i, `${label} contains a javascript URL`);

  const references = html.matchAll(/(?:href|src)="([^"]+)"/g);
  for (const [, reference] of references) {
    if (!reference.startsWith("/") || reference.startsWith("//")) continue;

    const target = path.join(outputRoot, localPathToFile(reference));
    await access(target).catch(() => {
      assert.fail(`${label} links to missing local asset or route: ${reference}`);
    });
  }
}

const feed = await readFile(path.join(outputRoot, "feed.xml"), "utf8");
for (const postPath of [
  "/reflections/hello-world/",
  "/reflections/starlight-and-seeing/",
  "/reflections/when-the-searching-stops/",
  "/meditations/calm-ease/",
]) {
  assert.ok(feed.includes(postPath), `RSS feed is missing ${postPath}`);
}

const cname = (await readFile(path.join(outputRoot, "CNAME"), "utf8")).trim();
assert.equal(cname, "anattasati.org", "CNAME must preserve the custom domain");

console.log(`Verified ${htmlFiles.length} pages, ${expectedFiles.length} required outputs, internal links, and RSS routes.`);
