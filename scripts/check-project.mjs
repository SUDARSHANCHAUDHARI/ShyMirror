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

const effectiveRootTokens = (source) => {
  const tokens = {};
  for (const match of source.matchAll(/:root\s*\{([\s\S]*?)\}/g)) {
    for (const declaration of match[1].matchAll(/(--[\w-]+)\s*:\s*([^;]+);/g)) {
      tokens[declaration[1]] = declaration[2].trim();
    }
  }
  return tokens;
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

const tokens = effectiveRootTokens(css);
for (const [name, expected] of Object.entries({
  "--ink": "#15152a",
  "--paper": "#fff5df",
  "--coral": "#ff5d5d",
  "--blue": "#4f7cff",
  "--sun": "#ffd166",
  "--glass": "#58d6a9",
  "--lilac": "#b695ff",
})) {
  assert(tokens[name]?.toLowerCase() === expected, `${name} must resolve to ${expected}`);
}
assert(/--display-font:\s*Impact/.test(css), "Display typography must use the condensed family stack");
assert(/--body-font:\s*"Arial Rounded MT Bold"/.test(css), "Body typography must use the rounded family stack");
assert(/body\s*\{[\s\S]*min-width:\s*0;[\s\S]*overflow-x:\s*clip;[\s\S]*overflow-y:\s*auto;/.test(css), "Body must allow vertical scrolling without a positive minimum width");
assert(/html\s*\{[\s\S]*min-width:\s*0;/.test(css), "HTML must not impose a positive minimum width");
assert(/#mirror-scene:focus-visible\s*\{[\s\S]*outline:\s*4px solid var\(--blue\)/.test(css), "Scene focus must use TinyChaos blue");
assert(/\.primary-button:focus-visible,[\s\S]*outline:\s*4px solid var\(--blue\)/.test(css), "Control focus must use TinyChaos blue");
assert(/\.tinychaos-credit a:focus-visible\s*\{[\s\S]*outline:\s*4px solid var\(--blue\)/.test(css), "Footer gallery link needs the shared visible focus ring");
assert(/\.primary-button,[\s\S]*\.icon-button\s*\{[\s\S]*border:\s*3px solid var\(--ink\)/.test(css), "Primary controls need heavy ink outlines");
assert(/\.primary-button\s*\{[\s\S]*box-shadow:\s*4px 4px 0 var\(--ink\)/.test(css), "Primary controls need solid ink offset shadows");
assert(html.includes('href="https://sudarshanchaudhari.github.io/TinyChaos/"'), "TinyChaos gallery link is required");
assert(html.includes("ShyMirror · by Sudarshan Chaudhari"), "Author attribution is required");

if (failures.length > 0) {
  console.error("ShyMirror checks failed:");
  failures.forEach((failure) => console.error(`- ${failure}`));
  process.exitCode = 1;
} else {
  console.log(`ShyMirror checks passed: ${requiredFiles.length} files, ${ids.length} unique IDs, ${behaviorNames.length} behaviors.`);
}
