const { spawnSync } = require("node:child_process");
const { mkdtempSync, existsSync } = require("node:fs");
const { tmpdir } = require("node:os");
const { join, resolve } = require("node:path");
const { pathToFileURL } = require("node:url");
const browser = process.env.TEST_BROWSER || [
  "C:/Program Files/Google/Chrome/Application/chrome.exe",
  "C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe"
].find(existsSync);
if (!browser) throw new Error("Set TEST_BROWSER to a Chromium browser executable.");
const profile = mkdtempSync(join(tmpdir(), "paste-assistant-test-"));
const result = spawnSync(browser, [
  "--headless", "--no-first-run", "--no-default-browser-check", "--disable-background-networking",
  "--disable-gpu", "--allow-file-access-from-files", `--user-data-dir=${profile}`,
  "--dump-dom", "--virtual-time-budget=30000", pathToFileURL(resolve(__dirname, "browser.html")).href
], { encoding: "utf8", timeout: 60000, maxBuffer: 4 * 1024 * 1024, windowsHide: true });
if (result.error) throw result.error;
const match = result.stdout.match(/<pre id="results">([\s\S]*?)<\/pre>/);
if (!match || match[1] === "Running") {
  console.error(result.stderr.slice(-4000));
  throw new Error(`Browser tests did not finish. Browser exit: ${result.status}`);
}
const report = JSON.parse(match[1].replace(/&quot;/g, '"').replace(/&gt;/g, ">").replace(/&lt;/g, "<").replace(/&amp;/g, "&"));
for (const item of report.results) console.log(`${item.ok ? "PASS" : "FAIL"} ${item.name}${item.error ? `: ${item.error}` : ""}`);
console.log(`${report.passed}/${report.total} browser tests passed.`);
process.exitCode = report.passed === report.total ? 0 : 1;
