#!/usr/bin/env node
// Zerosolved "mindset" renderer: JSON spec → 17 s 1080×1920 reel (MP4) or 1080×1350 image post (JPG).
// usage: node mindset/render-mindset.mjs mindset/specs/<id>.json [--preview]
//   reel  → output/video/<id>.mp4      post → output/instagram/<id>.jpg
//   --preview writes stills + a contact sheet to mindset/previews/<id>/ (reel) or the JPG itself (post).
// Run from reel-maker/. See mindset/README.md for the spec format and rules.
import fs from "node:fs";
import path from "node:path";
import { spawn } from "node:child_process";
import { fileURLToPath, pathToFileURL } from "node:url";
import puppeteer from "puppeteer-core";
import { makeMusic } from "../lib/music.mjs";

const HERE = path.dirname(fileURLToPath(import.meta.url));
const RM = path.dirname(HERE);                       // reel-maker/
const ROOT = path.dirname(RM);
const args = process.argv.slice(2);
const flag = (f) => args.includes(f);
const specPath = args.find((a) => !a.startsWith("--"));
if (!specPath) { console.error("usage: node mindset/render-mindset.mjs <spec.json> [--preview]"); process.exit(2); }
const preview = flag("--preview");
const spec = JSON.parse(fs.readFileSync(specPath, "utf8"));

// ---------- spec checks ----------
const errors = [], warns = [];
const MOTIONS = ["steady", "restart", "stall", "idle", "late", "burst"];
const OBJECTS = ["bricks", "stairs"];
const COLORS = ["white", "lime", "orange"];
if (!/^[a-z0-9-]{3,60}$/.test(spec.id || "")) errors.push('id must be lowercase letters, digits and dashes (e.g. "mr-2026-11-16-am")');
if (!["reel", "post"].includes(spec.type)) errors.push('type must be "reel" or "post"');
const texts = [];
const need = (k) => { if (typeof spec[k] !== "string" || !spec[k].trim()) errors.push(`missing "${k}"`); else texts.push([k, spec[k]]); };
if (spec.type === "reel") {
  need("title"); need("punchline");
  if (!Array.isArray(spec.lanes) || spec.lanes.length !== 2) errors.push("a reel needs exactly 2 lanes");
  else spec.lanes.forEach((L, i) => {
    if (!L.label) errors.push(`lane ${i + 1}: missing label`); else texts.push([`lane ${i + 1} label`, L.label]);
    if (L.sub) texts.push([`lane ${i + 1} sub`, L.sub]);
    if (!MOTIONS.includes(L.motion)) errors.push(`lane ${i + 1}: motion must be one of ${MOTIONS.join(", ")}`);
    if (L.object && !OBJECTS.includes(L.object)) errors.push(`lane ${i + 1}: object must be one of ${OBJECTS.join(", ")}`);
    if (L.color && !COLORS.includes(L.color)) errors.push(`lane ${i + 1}: color must be one of ${COLORS.join(", ")}`);
  });
  if (spec.lanes?.length === 2 && spec.lanes[0].motion === spec.lanes[1].motion) warns.push("both lanes use the same motion — the contrast won't read");
} else if (spec.type === "post") {
  if (spec.variant === "equation") {
    if (!Array.isArray(spec.terms) || spec.terms.length < 3 || spec.terms.length > 5) errors.push("an equation needs 3–5 terms (words and ops)");
    else spec.terms.forEach((t, i) => {
      if (t.op) { if (!["+", "−", "-", "=", "≠", "×", "÷", ">", "<"].includes(t.op)) errors.push(`term ${i + 1}: op must be + − = ≠ × ÷ > <`); }
      else if (!t.word) errors.push(`term ${i + 1}: needs "word" or "op"`); else { texts.push([`term ${i + 1}`, t.word]); if (t.label) texts.push([`term ${i + 1} label`, t.label]); }
    });
    if (spec.line) texts.push(["line", spec.line]);
  } else need("text");
}
// Case mode: a piece built from one zerosolved.com case file. Numbers are allowed only when
// they appear in that saved page. Without "case", the piece is motivational and carries no numbers.
const caseMode = spec.case !== undefined;
let sourceText = null;
if (caseMode) {
  if (!/^ZS-\d{4}$/.test(spec.case || "")) errors.push('case must look like "ZS-0270"');
  if (typeof spec.sourceFile !== "string" || !/^sources\/[a-z0-9-]+\.txt$/.test(spec.sourceFile)) errors.push('case pieces need "sourceFile": "sources/<name>.txt" (the saved zerosolved.com page)');
  else {
    const f = path.join(RM, spec.sourceFile);
    if (!fs.existsSync(f)) errors.push(`source file not found: ${spec.sourceFile}`);
    else sourceText = fs.readFileSync(f, "utf8");
  }
  if (sourceText && spec.case && !sourceText.includes(spec.case)) errors.push(`${spec.case} does not appear in ${spec.sourceFile}`);
  if (!spec.footnote) errors.push('case pieces need a "footnote" naming the case and source, e.g. "ZS-0270 · zerosolved.com · verified 2026-08-13"');
}
if (spec.footnote) texts.push(["footnote", spec.footnote]);
if (spec.kicker) texts.push(["kicker", spec.kicker]);
if (spec.caption) texts.push(["caption", spec.caption]);
const inSource = (n) => sourceText && new RegExp(`(^|[^\\d])${n.replace(/[.,]/g, (c) => "\\" + c)}([^\\d]|$)`).test(sourceText);
for (const [k, v] of texts) {
  // The numbers rule: every number must come from the case file, copied exactly.
  if (/\d/.test(v)) {
    if (!caseMode) errors.push(`${k}: no digits allowed in motivational pieces (numbers must come from a case file) — "${v.slice(0, 60)}"`);
    else for (const n of v.match(/\d(?:[\d,.]*\d)?/g)) if (!inSource(n)) errors.push(`${k}: "${n}" is not in ${spec.sourceFile} — copy numbers exactly from the case file or leave them out`);
  }
  if (/!/.test(v)) errors.push(`${k}: no exclamation marks (brand voice)`);
  if (/ZeroSolved|Zero Solved|ZEROSOLVED/.test(v)) errors.push(`${k}: write the name as "Zerosolved"`);
  const lime = (v.match(/\[lime\]/g) || []).length;
  if ((v.match(/\[lime\]/g) || []).length !== (v.match(/\[\/lime\]/g) || []).length) errors.push(`${k}: unbalanced [lime] tags`);
  if (["title", "punchline", "text"].includes(k)) {
    const words = (v.match(/\[lime\]([\s\S]*?)\[\/lime\]/g) || []).join(" ").replace(/\[\/?lime\]/g, "").trim().split(/\s+/).filter(Boolean).length;
    if (!lime) warns.push(`${k}: add 1–3 [lime] words on the key idea`);
    else if (words > 3) warns.push(`${k}: ${words} lime words — keep it to 1–3`);
    if (!/[.?]\s*$/.test(v.replace(/\[\/?lime\]/g, ""))) warns.push(`${k}: end the line with a period (sentence case)`);
  }
}
if (errors.length) { console.error("Spec errors:\n - " + errors.join("\n - ")); process.exit(2); }
if (warns.length) console.warn("STYLE WARNINGS:\n - " + warns.join("\n - "));

// ---------- browser ----------
function findBrowser() {
  const c = [process.env.CHROME_PATH, process.env.EDGE_PATH,
    "C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe", "C:/Program Files/Microsoft/Edge/Application/msedge.exe",
    "C:/Program Files/Google/Chrome/Application/chrome.exe", "/usr/bin/google-chrome", "/usr/bin/chromium"].filter(Boolean);
  const f = c.find((p) => fs.existsSync(p));
  if (!f) throw new Error("No Chrome/Edge found. Set CHROME_PATH.");
  return f;
}
const H = spec.type === "post" ? 1350 : 1920;
const browser = await puppeteer.launch({ executablePath: findBrowser(), headless: true,
  args: ["--allow-file-access-from-files", "--force-color-profile=srgb", "--hide-scrollbars", "--mute-audio"] });
const page = await browser.newPage();
page.on("pageerror", (e) => console.error("page error:", e.message));
const PAGE_FILES = [path.join(HERE, "template"), path.join(RM, "node_modules", "@fontsource")];
await page.setRequestInterception(true);
page.on("request", (req) => {
  const u = req.url();
  if (u.startsWith("data:") || u.startsWith("about:")) return req.continue();
  if (u.startsWith("file:")) {
    const p = fileURLToPath(u);
    if (PAGE_FILES.some((d) => { const r = path.relative(d, p); return r && !r.startsWith("..") && !path.isAbsolute(r); })) return req.continue();
  }
  console.error(`renderer blocked a request: ${u.slice(0, 120)}`);
  req.abort();
});
await page.setViewport({ width: 1080, height: H, deviceScaleFactor: 1 });
await page.goto(pathToFileURL(path.join(HERE, "template/index.html")).href, { waitUntil: "load" });
const info = await page.evaluate(async (d) => {
  await Promise.all(["600 40px Sora", "700 40px Sora", "400 20px Inter", "500 20px 'JetBrains Mono'", "700 20px 'JetBrains Mono'"].map((f) => document.fonts.load(f)));
  const r = window.__init(d); await document.fonts.ready; return r;
}, spec);
const fontsOk = await page.evaluate(() => ["700 40px Sora", "400 20px Inter", "500 20px 'JetBrains Mono'"].every((f) => document.fonts.check(f)));
if (!fontsOk) console.warn("WARNING: brand fonts did not load — check node_modules/@fontsource");
const lint = await page.evaluate(() => window.__lint());
console.log(`spec: ${spec.id} · ${spec.type}${spec.type === "reel" ? ` · ${info.duration}s` : ""}`);
console.log(lint.length ? "LAYOUT WARNINGS:\n - " + lint.join("\n - ") : "layout: OK (text inside the safe area)");

function run(cmd, a, input) {
  return new Promise((res, rej) => {
    const p = spawn(cmd, a, { stdio: [input ? "pipe" : "ignore", "ignore", "pipe"] });
    let err = ""; p.stderr.on("data", (d) => (err += d));
    p.on("close", (code) => (code === 0 ? res() : rej(new Error(`${cmd} exited ${code}\n${err.slice(-2000)}`))));
    if (input) input(p.stdin);
  });
}

if (spec.type === "post") {
  const out = path.join(ROOT, "output", "instagram", `${spec.id}.jpg`);
  fs.mkdirSync(path.dirname(out), { recursive: true });
  await page.screenshot({ path: out, type: "jpeg", quality: 95 });
  await browser.close();
  console.log(`done: ${out}`);
  process.exit(0);
}

if (preview) {
  const dir = path.join(HERE, "previews", spec.id);
  fs.mkdirSync(dir, { recursive: true });
  for (const f of fs.readdirSync(dir)) if (/^(still_.*\.png|sheet\.jpg|list\.txt)$/.test(f)) fs.unlinkSync(path.join(dir, f));
  const times = [1.0, 4.0, 7.0, 10.5, 13.4, 16.0];
  let k = 0;
  for (const t of times) { await page.evaluate((x) => window.__seek(x), t); await page.screenshot({ path: path.join(dir, `still_${String(++k).padStart(2, "0")}_${t}s.png`) }); }
  const list = fs.readdirSync(dir).filter((f) => f.endsWith(".png")).sort();
  fs.writeFileSync(path.join(dir, "list.txt"), list.map((f) => `file '${f}'`).join("\n"));
  await run("ffmpeg", ["-y", "-v", "error", "-f", "concat", "-safe", "0", "-i", path.join(dir, "list.txt"),
    "-vf", "scale=360:-1,tile=6x1:padding=8:color=0x222222", "-frames:v", "1", path.join(dir, "sheet.jpg")]);
  fs.unlinkSync(path.join(dir, "list.txt"));
  console.log(`preview: ${times.length} stills + contact sheet in ${dir}`);
  await browser.close();
  process.exit(0);
}

const fps = 30;
const outFile = path.join(ROOT, "output", "video", `${spec.id}.mp4`);
fs.mkdirSync(path.dirname(outFile), { recursive: true });
const tmp = fs.mkdtempSync(path.join(fs.realpathSync(process.env.TEMP || process.env.TMPDIR || "/tmp"), "zsmind-"));
const wav = path.join(tmp, "music.wav");
const m = spec.music || {};
fs.writeFileSync(wav, makeMusic({ duration: info.duration, cuts: info.cuts, bpm: m.bpm || 92, seed: m.seed || 11, progression: m.progression || ["Am", "F", "C", "G"] }));
const frames = Math.round(info.duration * fps), silent = path.join(tmp, "video.mp4"), t0 = Date.now();
await run("ffmpeg", ["-y", "-v", "error", "-f", "image2pipe", "-framerate", String(fps), "-c:v", "mjpeg", "-i", "-",
  "-c:v", "libx264", "-preset", "medium", "-crf", "16", "-pix_fmt", "yuv420p", "-profile:v", "high", "-r", String(fps), silent],
  async (stdin) => {
    for (let i = 0; i < frames; i++) {
      await page.evaluate((x) => window.__seek(x), i / fps);
      const jpg = await page.screenshot({ type: "jpeg", quality: 94, optimizeForSpeed: true });
      if (!stdin.write(jpg)) await new Promise((r) => stdin.once("drain", r));
      if (i % fps === 0) process.stdout.write(`\rframe ${i}/${frames} (${((Date.now() - t0) / 1000).toFixed(0)}s)`);
    }
    stdin.end();
  });
process.stdout.write(`\rframes: ${frames} rendered in ${((Date.now() - t0) / 1000).toFixed(0)}s\n`);
await browser.close();
await run("ffmpeg", ["-y", "-v", "error", "-i", silent, "-i", wav, "-map", "0:v", "-map", "1:a", "-c:v", "copy",
  "-af", "loudnorm=I=-14:TP=-1.5:LRA=11", "-c:a", "aac", "-b:a", "192k", "-ar", "44100", "-shortest", "-movflags", "+faststart", outFile]);
fs.rmSync(tmp, { recursive: true, force: true });
console.log(`done: ${outFile}`);
