#!/usr/bin/env node
/**
 * scripts/build-itch.mjs
 *
 * One-shot build pipeline that produces a drag-and-drop itch.io-ready
 * HTML5 bundle:
 *   1. Clean & `vite build` into dist/
 *   2. Verify dist/index.html exists and is under 4 MB (itch cap)
 *   3. Copy dist/ → bugsmasher-itch-html5/  (playable folder)
 *   4. Add cover.svg, thumbnail.svg, wheel.png (if present) for
 *      itch.io project assets (not bundled in the build itself)
 *   5. Zip bugsmasher-itch-html5/ → bugsmasher-itch-html5.zip
 *
 * Usage:
 *   node scripts/build-itch.mjs
 *
 * Then drag bugsmasher-itch-html5.zip onto
 * https://itch.io/game/new — done.
 *
 * After upload, paste this URL into "This game will be embedded
 * on an HTML5 page" and tick "Automatically start game on page load"
 * (recommended) or "Click-to-play" (mobile-friendly).
 */
import { execSync } from 'node:child_process';
import { existsSync, mkdirSync, cpSync, rmSync, statSync, readFileSync, writeFileSync } from 'node:fs';
import { resolve, dirname, basename, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const ROOT = resolve(__dirname, '..');
const DIST = resolve(ROOT, 'dist');
const OUT_DIR = resolve(ROOT, 'bugsmasher-itch-html5');
const ZIP_PATH = resolve(ROOT, 'bugsmasher-itch-html5.zip');
const COVER_DIR = resolve(ROOT, 'public', 'itch');

const log = (m) => console.log(`\x1b[36m▸\x1b[0m ${m}`);
const ok = (m) => console.log(`\x1b[32m✓\x1b[0m ${m}`);
const warn = (m) => console.log(`\x1b[33m!\x1b[0m ${m}`);
const err = (m) => console.log(`\x1b[31m✗\x1b[0m ${m}`);

const ITCH_MAX_BYTES = 4 * 1024 * 1024 * 1024 - 100 * 1024 * 1024; // itch hard-cap ~3.9GB

function run(cmd, cwd = ROOT) {
  log(`$ ${cmd}`);
  execSync(cmd, { cwd, stdio: 'inherit', shell: true });
}

function bytes(path) {
  return statSync(path).size;
}
function bytesHuman(n) {
  if (n < 1024) return `${n} B`;
  if (n < 1024 * 1024) return `${(n / 1024).toFixed(1)} KB`;
  if (n < 1024 * 1024 * 1024) return `${(n / 1024 / 1024).toFixed(2)} MB`;
  return `${(n / 1024 / 1024 / 1024).toFixed(2)} GB`;
}

console.log('\n\x1b[1m\x1b[33m═══ BugSmasher → itch.io HTML5 Build ═══\x1b[0m\n');

// ── 1. Pre-flight checks ─────────────────────────────────────────────
if (!existsSync(join(ROOT, 'vite.config.ts'))) {
  err('vite.config.ts not found. Run from project root.');
  process.exit(1);
}
log('Pre-flight checks passed.');

// ── 2. Clean previous builds ────────────────────────────────────────
for (const p of [DIST, OUT_DIR, ZIP_PATH]) {
  if (existsSync(p)) {
    rmSync(p, { recursive: true, force: true });
    log(`Cleaned ${basename(p)}`);
  }
}
mkdirSync(OUT_DIR, { recursive: true });

// ── 3. Build with Vite ─────────────────────────────────────────────
run('npm run build');

// ── 4. Sanity check the dist output ─────────────────────────────────
if (!existsSync(join(DIST, 'index.html'))) {
  err('Build did not produce dist/index.html — aborting.');
  process.exit(1);
}
ok(`dist/index.html present (${bytesHuman(bytes(join(DIST, 'index.html')))}).`);

// ── 5. Copy dist → OUT_DIR ──────────────────────────────────────────
log(`Copying dist/ → ${basename(OUT_DIR)}/ ...`);
cpSync(DIST, OUT_DIR, { recursive: true });
ok(`Copied ${bytesHuman(bytes(DIST))} of assets.`);

// ── 6. Embed-meta tag injection for itch.io ─────────────────────────
const indexPath = join(OUT_DIR, 'index.html');
let html = readFileSync(indexPath, 'utf-8');

// Inject viewport meta if missing (mobile critical)
if (!html.includes('viewport')) {
  html = html.replace('<head>', '<head>\n<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover, user-scalable=no">');
}

// Open graph tags for itch sharing
const ogTags = `
<meta property="og:title" content="BugSmasher — Squash bugs with a spatula">
<meta property="og:description" content="A 5-minute arcade where you smash bioluminescent bugs with a kitchen spatula. The most satisfying clicker on the web.">
<meta property="og:type" content="game">
<meta name="twitter:card" content="summary_large_image">
<meta name="theme-color" content="#0a0a08">
`;
html = html.replace('</head>', `${ogTags}\n</head>`);

// Tell itch the game's frame dimensions
html = html.replace('</head>', `<meta name="itch:width" content="960"><meta name="itch:height" content="540"></head>`);

// Prevent pinch-zoom on mobile (itch iframe catches right-clicks)
html = html.replace('</head>', `<style>html,body{touch-action:none;overscroll-behavior:none;-webkit-user-select:none;user-select:none;}</style></head>`);

writeFileSync(indexPath, html);
ok('Injected itch.io embed meta tags + mobile CSS.');

// ── 7. Copy cover-art assets (if present) ──────────────────────────
if (existsSync(COVER_DIR)) {
  log(`Copying cover assets from ${basename(COVER_DIR)}/ ...`);
  for (const f of ['cover.png', 'cover.jpg', 'cover.svg', 'thumbnail.png', 'thumbnail.jpg', 'thumbnail.svg', 'screenshot1.png', 'screenshot2.png', 'screenshot3.png']) {
    const src = join(COVER_DIR, f);
    if (existsSync(src)) {
      cpSync(src, join(OUT_DIR, f));
      ok(`  ${f} (${bytesHuman(bytes(src))})`);
    }
  }
} else {
  warn(`No ${basename(COVER_DIR)}/ directory yet. Add cover.png (640x480), thumbnail.png (315x250), and 3 screenshots before uploading.`);
}

// ── 8. Add a README for the upload helper ──────────────────────────
const uploadReadme = `# BugSmasher — itch.io Upload Helper

## How to upload

1. Go to https://itch.io/game/new
2. **Title**: BugSmasher
3. **Project URL**: pick a slug like \`fahad-ibrahim/bugsmasher\`
4. **Classification**: Game → Arcade (or Action)
5. **Embed**:
   - Kind of project: **HTML5 game** ✓
   - This file will be served as: \`index.html\`
   - Viewport dimensions: **960 × 540** (16:9)
   - Click-to-play: ✓ (mobile-friendly; uncheck for instant play)
   - Mobile friendly: ✓
   - Automatically start: depends on preference
6. **Uploads**:
   - Cover art: \`cover.png\` (630×500 recommended)
   - Thumbnail: \`thumbnail.png\` (315×250)
   - Screenshots: 3+ at 16:9
7. **Pricing**: pay-what-you-want ≥ $0, OR free with a "tip jar"
8. Drag the **bugsmasher-itch-html5.zip** file in. Click Save.
9. Hit "Embed" to preview. Hit "View public page" once tested.

## Recommended metadata

- **Genre tags**: Arcade, Clicker, Action, Idler
- **Made with**: React, Vite, Web Audio API
- **Average session**: 5 minutes
- **Player count**: 1
- **Controls**: Mouse / touch — click to squash
- **Status**: In development, fully playable
- **Accessibility**: high-contrast colorblind mode, reduced motion, gamepad support

## Marketing copy (paste in description)

> Squash bioluminescent bugs with a kitchen spatula.
> A 5-minute arcade built around a single sublime action: the
> whack, the splat, the satisfying squish.
>
> Built with React 19 + Vite + Web Audio synthesis.
> No ads, no tracking, no nonsense — just bugs and a spatula.
>
> Free to play. Tip if it makes you smile.

## First-time setup

itch.io iframe will fire keyboard/mouse events. Make sure the
embedded game initializes the AudioContext on first click
(already handled via \`soundManager.init()\` on pointerdown).
`;
writeFileSync(join(OUT_DIR, 'ITCH_UPLOAD.md'), uploadReadme);
ok('ITCH_UPLOAD.md written.');

// ── 9. Size check ───────────────────────────────────────────────────
let totalBytes = 0;
function dirSize(p) {
  if (!existsSync(p)) return 0;
  const s = statSync(p);
  if (s.isFile()) return s.size;
  if (s.isDirectory()) {
    let total = 0;
    for (const child of require('node:fs').readdirSync(p)) {
      total += dirSize(join(p, child));
    }
    return total;
  }
  return 0;
}
totalBytes = dirSize(OUT_DIR);
ok(`Bundle size: ${bytesHuman(totalBytes)}`);

if (totalBytes > ITCH_MAX_BYTES) {
  err(`Bundle exceeds itch.io limit (${bytesHuman(ITCH_MAX_BYTES)})!`);
  process.exit(1);
}
if (totalBytes > 200 * 1024 * 1024) {
  warn(`Bundle is over 200 MB — consider lazy-loading audio assets.`);
}

// ── 10. Zip the output ─────────────────────────────────────────────
log(`Zipping → ${basename(ZIP_PATH)} ...`);
try {
  // Try PowerShell Compress-Archive on Windows (always available)
  if (process.platform === 'win32') {
    run(`powershell -NoProfile -Command "Compress-Archive -Path '${OUT_DIR}\\*' -DestinationPath '${ZIP_PATH}' -Force"`);
  } else {
    run(`zip -r '${ZIP_PATH}' '${OUT_DIR}'`);
  }
} catch (e) {
  warn('Zip command failed. You can zip manually or upload the folder directly to itch.io.');
}

if (existsSync(ZIP_PATH)) {
  ok(`Done! → ${basename(ZIP_PATH)} (${bytesHuman(bytes(ZIP_PATH))})`);
  console.log('\n\x1b[1m\x1b[32m✓ Ready to upload. Drag the zip onto https://itch.io/game/new\x1b[0m\n');
} else {
  console.log('\n\x1b[1m\x1b[33m✓ Build ready. Upload the folder: ' + OUT_DIR + '\x1b[0m\n');
}
