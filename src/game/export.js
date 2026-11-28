// Game export: current SB3 graph + assets -> an editable, runnable game project.
//
//   target 'web'    : index.html (ES modules, serve over http), play.html (one
//                     self-contained file that also opens from disk), game.js,
//                     bwgame.js, bwgame-web.js, manifest.json, assets/
//   target 'pygame' : main.py, game.py, bwgame.py, manifest.json, assets/,
//                     requirements.txt
//
// Both carry export-report.json (capability report, source and asset hashes) and
// a README. Unsupported blocks refuse the export unless allowUnsupported is set.

import JSZip from 'jszip';
import { buildGameModel, MODEL_VERSION } from './model.js';
import { emitGame } from './emit.js';
import { RUNTIME_SOURCES } from './runtime/sources.generated.js';
import { rasterJobs, encodeRaster } from './raster.js';

export const EXPORT_CONTRACT = 'bwgame-export-v1';

const enc = s => new TextEncoder().encode(s);
const toBytes = d => (typeof d === 'string' ? enc(d) : (d instanceof Uint8Array ? d : new Uint8Array(d.buffer ? d.buffer.slice(d.byteOffset, d.byteOffset + d.byteLength) : d)));

async function sha256 (data) {
    const buf = await globalThis.crypto.subtle.digest('SHA-256', toBytes(data));
    return [...new Uint8Array(buf)].map(b => b.toString(16).padStart(2, '0')).join('');
}

function base64 (bytes) {
    if (typeof globalThis.Buffer !== 'undefined') return globalThis.Buffer.from(bytes).toString('base64');
    let s = '';
    for (let i = 0; i < bytes.length; i += 0x8000) s += String.fromCharCode(...bytes.subarray(i, i + 0x8000));
    return btoa(s);
}

const MIME = { svg: 'image/svg+xml', png: 'image/png', jpg: 'image/jpeg', jpeg: 'image/jpeg', wav: 'audio/wav', mp3: 'audio/mpeg', ogg: 'audio/ogg' };

// Load an .sb3 (bytes / ArrayBuffer / Blob) into { project, files }.
export async function loadSb3 (data) {
    const zip = await JSZip.loadAsync(data);
    const projectFile = zip.file('project.json');
    if (!projectFile) throw new Error('not an .sb3: project.json missing');
    const project = JSON.parse(await projectFile.async('string'));
    const files = {};
    for (const name of Object.keys(zip.files)) {
        if (name === 'project.json' || zip.files[name].dir) continue;
        files[name] = await zip.file(name).async('uint8array');
    }
    return { project, files };
}

// From a live SB3Creator: use its own .sb3 writer so the export sees exactly the
// bytes a saved project would contain.
export async function loadCreator (creator) {
    const blob = await creator.generateSB3();
    return loadSb3(await blob.arrayBuffer());
}

function slug (s) { return String(s || 'game').replace(/[^\w-]+/g, '-').replace(/^-+|-+$/g, '').toLowerCase() || 'game'; }

function htmlEscape (s) { return String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c])); }

const PAGE_CSS = `html,body{margin:0;height:100%;background:#1e1f26;color:#eee;font:14px system-ui,sans-serif}
main{display:flex;flex-direction:column;align-items:center;justify-content:center;min-height:100%;gap:10px;padding:12px;box-sizing:border-box}
#bar{display:flex;gap:8px;align-items:center;width:min(96vw,960px)}
#bar h1{font-size:15px;font-weight:600;margin:0 auto 0 0}
button{font:inherit;background:#2c2f3a;color:#eee;border:1px solid #444a5a;border-radius:6px;padding:6px 12px;cursor:pointer}
button:hover{background:#383c4a}
#stage{width:min(96vw,960px,calc((100vh - 90px)*4/3));aspect-ratio:4/3;background:#fff;border-radius:6px;outline:none;touch-action:none}
footer{opacity:.6;font-size:12px}`;

function pageHtml (title, scriptTag) {
    return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<link rel="icon" href="data:,">
<title>${htmlEscape(title)}</title>
<style>${PAGE_CSS}</style>
</head>
<body>
<main>
  <div id="bar"><h1>${htmlEscape(title)}</h1>
    <button id="flag" title="Green flag: start all 'when flag clicked' scripts">&#9873; Start</button>
    <button id="stop" title="Stop all scripts">&#9632; Stop</button>
    <button id="restart" title="Reset every sprite and variable, then start">&#8635; Restart</button>
  </div>
  <canvas id="stage" width="480" height="360" tabindex="0"></canvas>
  <footer>Made with Brickwright &middot; bwgame-v1</footer>
</main>
${scriptTag}
</body>
</html>
`;
}

const START_CALL = `{ canvas: document.getElementById('stage'), manifest, setup, base: BASE,
    controls: { flag: document.getElementById('flag'), stop: document.getElementById('stop'), restart: document.getElementById('restart') } }`;

// Module paths used inside the generated page (built, so scanners of this file do
// not read the page template as imports of the exporter itself).
const WEB_HOST = './' + 'bwgame-web.js';
const GAME_MODULE = './' + 'game.js';

function moduleIndex (title) {
    return pageHtml(title, `<script type="module">
import { start } from ${JSON.stringify(WEB_HOST)};
import setup from ${JSON.stringify(GAME_MODULE)};
const BASE = './';
const manifest = await (await fetch('manifest.json')).json();
start(${START_CALL});
</script>`);
}

// Strip ES-module syntax so runtime + host + game can share one classic script.
function unmodule (src) {
    return src
        .replace(/^import\s[^;]*;\s*$/gm, '')
        .replace(/^export default function /gm, 'function ')
        .replace(/^export (class|function|const|let|async function) /gm, '$1 ');
}

function standalonePage (title, gameJs, manifest, files) {
    const inlined = JSON.parse(JSON.stringify(manifest));
    const dataUrl = (file) => {
        const name = file.replace(/^assets\//, '');
        const bytes = files[name];
        if (!bytes) return file;
        const ext = name.split('.').pop().toLowerCase();
        return `data:${MIME[ext] || 'application/octet-stream'};base64,${base64(toBytes(bytes))}`;
    };
    for (const t of [inlined.stage, ...inlined.sprites]) {
        for (const c of t.costumes) { c.file = dataUrl(c.file); if (c.raster) c.raster = dataUrl(c.raster); }
        for (const s of t.sounds) s.file = dataUrl(s.file);
    }
    const code = [
        unmodule(RUNTIME_SOURCES['bwgame.js']),
        unmodule(RUNTIME_SOURCES['bwgame-web.js']),
        unmodule(gameJs),
        'const BASE = \'\';',
        `const manifest = ${JSON.stringify(inlined)};`,
        `start(${START_CALL});`
    ].join('\n').replace(/<\/script/gi, '<\\/script');
    return pageHtml(title, `<script>\n(function () {\n'use strict';\n${code}\n})();\n</script>`);
}

function readme (title, target, report) {
    const approx = Object.entries(report.approximate).map(([op, e]) => `- \`${op}\` (${e.count}×): ${e.note}`).join('\n') || '- none';
    const common = `# ${title}

Exported from Brickwright (game export ${EXPORT_CONTRACT}, runtime bwgame-v1).

- \`game.${target === 'web' ? 'js' : 'py'}\` is your game: every Scratch script became a function. Edit it freely.
- \`bwgame.${target === 'web' ? 'js' : 'py'}\` is the runtime (scheduler, sprites, pen, input). You normally don't need to touch it.
- \`manifest.json\` lists sprites, costumes, sounds, variables and their starting values; \`assets/\` holds the files.
- \`export-report.json\` records what was exported and how exactly each block is reproduced.

Edits to the exported code do not flow back into the Brickwright project.

## Behaviour notes

${approx}
- ${report.notes.join('\n- ')}
`;
    if (target === 'web') {
        return `${common}
## Run it

- **Quick:** open \`play.html\` (one self-contained file) in a browser.
- **Editable:** serve the folder and open \`index.html\`, e.g. \`python -m http.server 8000\` and visit http://localhost:8000/.
  (ES modules do not load from \`file://\`.)

Controls: the page's Start/Stop/Restart buttons; the game's own keys and mouse.
`;
    }
    return `${common}
## Run it

\`\`\`
python -m pip install -r requirements.txt
python main.py
\`\`\`

Keys: F5 = green flag, Ctrl+Shift+R = restart from the initial state, Esc = quit.
Headless check without a window: \`python bwgame.py trace . trace.json\`.

Packaging a stand-alone app (PyInstaller etc.) must be built on each target OS;
pygame is LGPL-licensed — keep its notice when you redistribute.
`;
}

function manifestCostume (manifest, key) {
    for (const t of [manifest.stage, ...manifest.sprites]) for (const c of t.costumes) if (c.file === `assets/${key}`) return c;
    return null;
}

export async function exportGame (input, opts = {}) {
    const target = opts.target === 'pygame' || opts.target === 'py' ? 'pygame' : 'web';
    const { project, files } = input;
    const title = opts.title || (project.meta && project.meta.title) || 'Brickwright game';
    // Costume rasters (opts.rasterize: jobs -> results, see raster.js) give both runtimes
    // Scratch's pixel geometry and admit touching-colour. Without them: box geometry.
    let pixels = typeof opts.rasterize === 'function';
    let built = buildGameModel(project, files, { pixels });
    let rastered = null;
    if (pixels) {
        const jobs = rasterJobs(built.manifest, files);
        rastered = jobs.length ? await opts.rasterize(jobs) : [];
        if (!rastered) { pixels = false; built = buildGameModel(project, files, { pixels: false }); }
    }
    const { manifest, code, report } = built;
    manifest.title = title;
    if (report.unsupported.length && !opts.allowUnsupported) {
        const reasons = report.unsupported.map(u => `${u.target}: ${u.opcode}${u.detail ? ` (${u.detail})` : ''}`);
        return { ok: false, report, reasons, files: {} };
    }
    const model = { manifest, code };
    const out = {};
    const rasterFiles = {};
    if (rastered) {
        const byKey = new Map(rastered.filter(r => !r.error).map(r => [r.key, r]));
        const failed = rastered.filter(r => r.error);
        if (failed.length) report.notes.push(`${failed.length} costume(s) could not be rasterized; they use box geometry: ${failed.map(f => f.key).join(', ')}`);
        const encoded = new Map();
        for (const [key, r] of byKey) {
            const rgba = Uint8Array.from(atob(r.b64), ch => ch.charCodeAt(0));
            const job = { width: r.width, height: r.height };
            const scale = r.scale ?? (r.width / Math.max(1e-9, (manifestCostume(manifest, key) || {}).width || r.width));
            let minX = Infinity, minY = Infinity, maxX = -1, maxY = -1;
            for (let y = 0; y < job.height; y++) {
                for (let x = 0; x < job.width; x++) {
                    if (rgba[(((y * job.width) + x) * 4) + 3] === 0) continue;
                    if (x < minX) minX = x; if (x > maxX) maxX = x; if (y < minY) minY = y; if (y > maxY) maxY = y;
                }
            }
            const path = `raster/${key}.bwr`;
            rasterFiles[path] = await encodeRaster({ width: r.width, height: r.height, scale, rgba });
            encoded.set(key, { path, scale, bounds: maxX < 0 ? null : [minX / scale, minY / scale, (maxX + 1) / scale, (maxY + 1) / scale] });
        }
        for (const t of [manifest.stage, ...manifest.sprites]) {
            for (const c of t.costumes) {
                const e = encoded.get(c.file.replace(/^assets\//, ''));
                if (!e) continue;
                c.raster = `assets/${e.path}`;
                if (e.bounds) c.bounds = e.bounds;
            }
        }
        for (const [path, bytes] of Object.entries(rasterFiles)) out[`assets/${path}`] = bytes;
        report.notes.push(`Costume pixels: ${encoded.size} costume(s) rasterized for pixel-accurate touching, fencing and colour sensing.`);
    }
    const usedAssets = new Set([manifest.stage, ...manifest.sprites].flatMap(t => [...t.costumes, ...t.sounds].map(a => a.file.replace(/^assets\//, ''))));
    for (const name of usedAssets) if (files[name]) out[`assets/${name}`] = toBytes(files[name]);
    out['manifest.json'] = `${JSON.stringify(manifest, null, 2)}\n`;
    const meta = { title };
    if (target === 'web') {
        const gameJs = emitGame(model, 'js', meta);
        out['game.js'] = gameJs;
        out['bwgame.js'] = RUNTIME_SOURCES['bwgame.js'];
        out['bwgame-web.js'] = RUNTIME_SOURCES['bwgame-web.js'];
        out['index.html'] = moduleIndex(title);
        out['play.html'] = standalonePage(title, gameJs, manifest, { ...files, ...rasterFiles });
    } else {
        out['game.py'] = emitGame(model, 'py', meta);
        out['bwgame.py'] = RUNTIME_SOURCES['bwgame.py'];
        out['main.py'] = `"""${title.replace(/"""/g, '')} — run with: python main.py"""
import os
import sys

HERE = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, HERE)

from bwgame import run_window  # noqa: E402
from game import setup  # noqa: E402

if __name__ == "__main__":
    run_window(os.path.join(HERE, "manifest.json"), setup, title=${JSON.stringify(title)})
`;
        out['requirements.txt'] = 'pygame>=2.5  # pygame-ce also works\n';
    }
    const assetHashes = [];
    for (const name of [...usedAssets].sort()) if (files[name]) assetHashes.push({ file: `assets/${name}`, sha256: await sha256(files[name]) });
    const exportReport = {
        contract: EXPORT_CONTRACT, runtime: 'bwgame-v1', model: MODEL_VERSION, target, title,
        source: { projectSha256: await sha256(JSON.stringify(project)), assets: assetHashes },
        runtimeSha256: Object.fromEntries(await Promise.all(Object.entries(RUNTIME_SOURCES)
            .filter(([k]) => (target === 'web' ? k.endsWith('.js') : k.endsWith('.py')))
            .map(async ([k, v]) => [k, await sha256(v)]))),
        capability: report
    };
    out['export-report.json'] = `${JSON.stringify(exportReport, null, 2)}\n`;
    out['README.md'] = readme(title, target, report);
    return { ok: true, report, files: out, name: slug(title) };
}

export async function zipExport (files, folder) {
    const zip = new JSZip();
    const root = folder ? zip.folder(folder) : zip;
    for (const [path, data] of Object.entries(files)) root.file(path, data);
    return zip.generateAsync({ type: 'uint8array', compression: 'DEFLATE' });
}
