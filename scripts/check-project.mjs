import { readFile, access } from "node:fs/promises";

const requiredFiles = [
  "index.html",
  "styles.css",
  "script.js",
  "favicon.svg",
  "site.webmanifest",
  "README.md",
  "LICENSE",
  "SECURITY.md",
  "CHANGELOG.md",
  "AGENTS.md",
  ".gitignore",
  ".editorconfig",
  ".nojekyll",
];

await Promise.all(requiredFiles.map((file) => access(file)));

const [html, css, script, manifestSource, packageSource] = await Promise.all([
  readFile("index.html", "utf8"),
  readFile("styles.css", "utf8"),
  readFile("script.js", "utf8"),
  readFile("site.webmanifest", "utf8"),
  readFile("package.json", "utf8"),
]);

let manifest;
let packageData;
try {
  manifest = JSON.parse(manifestSource);
  packageData = JSON.parse(packageSource);
} catch (error) {
  console.error(`Invalid project JSON: ${error.message}`);
  process.exit(1);
}

const failures = [];
const assert = (condition, message) => {
  if (!condition) failures.push(message);
};

const ids = [...html.matchAll(/\sid="([^"]+)"/g)].map((match) => match[1]);
const duplicateIds = [...new Set(ids.filter((id, index) => ids.indexOf(id) !== index))];
assert(duplicateIds.length === 0, `Duplicate IDs: ${duplicateIds.join(", ")}`);

const queriedIds = [...script.matchAll(/document\.querySelector\("#([^" ]+)"\)/g)].map(
  (match) => match[1],
);
for (const queriedId of queriedIds) {
  assert(ids.includes(queriedId), `JavaScript queries missing ID: ${queriedId}`);
}

const behaviorNames = [
  "lookAway",
  "hide",
  "wave",
  "expression",
  "delay",
  "refuse",
  "leave",
  "draw",
  "turn",
  "replace",
];

for (const behavior of behaviorNames) {
  assert(new RegExp(`\\b${behavior}: \\{`).test(script), `Missing behavior: ${behavior}`);
}

assert(html.includes('aria-live="polite"'), "Missing polite live region");
assert(html.includes('id="mirror-scene"') && html.includes('tabindex="0"'), "Scene must be keyboard focusable");
assert(html.includes('id="sync-progress"'), "Missing sync progress element");
assert(html.includes("Content-Security-Policy"), "Missing Content Security Policy");
assert(html.includes('rel="manifest"'), "Missing web app manifest link");
assert(html.includes('rel="canonical"'), "Missing canonical production URL");
assert(!/\sstyle=/.test(html) && !script.includes(".style."), "Inline styles weaken the Content Security Policy");
assert(css.includes("prefers-reduced-motion: reduce"), "Missing reduced-motion styles");
assert(script.includes("prefers-reduced-motion: reduce"), "Missing reduced-motion behavior support");
assert(script.includes("AudioContext"), "Missing generated Web Audio support");
assert(script.includes("state.real") && script.includes("state.reflection"), "Missing separate character state");
assert(manifest.start_url === "./" && manifest.scope === "./", "Manifest must remain project-path safe");
assert(packageData.private === true, "Package must remain private to prevent accidental publication");

if (failures.length > 0) {
  console.error("ShyMirror checks failed:");
  failures.forEach((failure) => console.error(`- ${failure}`));
  process.exitCode = 1;
} else {
  console.log(`ShyMirror checks passed: ${requiredFiles.length} files, ${ids.length} unique IDs, ${behaviorNames.length} behaviors.`);
}
