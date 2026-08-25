// Build the EMBEDDABLE transpiler bundle: SB3Creator + the embed entry,
// collapsed to one self-contained script with no node/browser deps, so a
// Rust binary (rquickjs/boa) or a Wasm host can `include_str!`/eval it and
// call bwTranspileC / bwRetarget / bwDevices in-process.
//
//   node scripts/bundle-embed.mjs            -> writes build/bw-transpiler.embed.js
//   node scripts/bundle-embed.mjs --check    -> build in memory, assert it is
//                                               free of node/browser globals; no write
//
// jszip is aliased to a stub (the C/retarget paths never touch a zip), which
// is the one dependency that would otherwise drag node resolution in.

import { build } from 'esbuild';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';
import { mkdirSync, writeFileSync } from 'node:fs';

const here = dirname(fileURLToPath(import.meta.url));
const root = resolve(here, '..');
const entry = resolve(root, 'src/embed/transpiler-entry.mjs');
const jszipStub = resolve(root, 'src/embed/jszip-stub.js');
const outFile = resolve(root, 'build/bw-transpiler.embed.js');

const check = process.argv.includes('--check');

const result = await build({
    entryPoints: [entry],
    bundle: true,
    format: 'iife',
    platform: 'neutral',      // no node, no browser assumptions
    target: 'es2020',         // QuickJS/boa-safe
    legalComments: 'none',
    alias: { jszip: jszipStub },
    write: false,
});

const code = result.outputFiles[0].text;

// Guard: the bundle must not reference node or DOM globals — those would
// fail in a bare engine. (A match inside a comment/string is a false
// positive; we scan for executable forms only.)
const banned = [
    /\brequire\s*\(/,
    /\bprocess\.(env|argv|platform|cwd)\b/,
    /\b__dirname\b/, /\b__filename\b/,
    /\bnode:(fs|path|os|crypto|child_process|url)\b/,
    /\bdocument\.(getElementById|createElement|querySelector)\b/,
];
const hits = banned.filter((re) => re.test(code)).map((re) => re.source);
if (hits.length) {
    console.error('bundle-embed: bundle references host globals a bare engine lacks:');
    for (const h of hits) console.error('  ' + h);
    process.exit(1);
}

if (check) {
    console.log(`bundle-embed --check: clean, ${(code.length / 1024).toFixed(0)} KiB (not written)`);
} else {
    mkdirSync(resolve(root, 'build'), { recursive: true });
    writeFileSync(outFile, code);
    console.log(`bundle-embed: wrote build/bw-transpiler.embed.js (${(code.length / 1024).toFixed(0)} KiB)`);
}
