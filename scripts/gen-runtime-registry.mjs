#!/usr/bin/env node
// Generate the runtime/hardware extension registry from the actual extension sources.
//
// Each Brickwright hardware extension is a Scratch VM extension that exposes its block
// surface via `getInfo()`. Rather than hand-code ~30 opcodes × dozens of LEGO extensions,
// we execute each extension against a permissive mock Scratch API, capture getInfo(), and
// emit `{ extId: { runtime, ops: { opcode: {kind, method, args} } } }`. This is how the
// pluggable-driver convention "works for all our own extensions".
//
// Sources: in-repo copies in reference/extensions/ where they exist, else fetched from
// CrispStrobe/extensions AT A PINNED COMMIT. Output: src/utils/runtimeRegistry.generated.js.
//
// PROVENANCE (fixed 2026-08-24). This script used to fall back to
//   https://crispstrobe.github.io/extensions/<slug>.js
// which is a GitHub Pages URL — no version in it, no way to ask which build answered. Of the
// 16 hardware slugs below only 4 have an in-repo copy, so TWELVE of the entries in the
// generated registry came off that URL at whatever content it happened to serve, while the
// generated file's own banner said "source: github.com/CrispStrobe/extensions" — a repo name,
// naming no revision. A regeneration a week apart could produce a different block surface with
// nothing recording which was which.
//
// The fix is the one brickwright-lite's sync-bw-board.mjs already uses: address the content by
// sha, not by name. EXTENSIONS_COMMIT below pins the revision, fetches go to
// raw.githubusercontent.com/<repo>/<sha>/..., and the resolved sha plus a sha256 per source
// lands in the generated file. Bumping the pin is then a deliberate commit whose diff shows
// exactly which block surfaces moved — instead of a silent re-fetch.
//
//   node scripts/gen-runtime-registry.mjs            # regenerate from the HARDWARE list
//   node scripts/gen-runtime-registry.mjs --check    # fail if the output would change
//
// To bump: `gh api repos/CrispStrobe/extensions/commits/master --jq .sha`, put it in
// EXTENSIONS_COMMIT, regenerate, and review the diff.

import { readFile, writeFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import vm from 'node:vm';
import { createHash } from 'node:crypto';
import path from 'node:path';

const here = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(here, '..');

// Gallery slugs for the hardware extensions (filename derived as `${slug}.js`). Pure/data
// extensions (planetemaths, arrays) are hand-mapped in sb3Creator, not here. Transpiler
// extensions are included — they also expose a block surface via getInfo().
const HARDWARE = [
    'CrispStrobe/gamepad',
    'CrispStrobe/legoboost_universal',
    'CrispStrobe/lego_poweredup',
    'CrispStrobe/lego_wedo2_universal',
    'CrispStrobe/legospikeprime_ble',
    'CrispStrobe/legospike_ble',
    'CrispStrobe/legospikeprime_btc_scratchlink',
    'CrispStrobe/legospike_bridge',
    'CrispStrobe/ev3_universal',
    'CrispStrobe/ev3_direct',
    'CrispStrobe/legonxt_transpile_universal',
    'CrispStrobe/legospike_turbowarp_transpile',
    'CrispStrobe/ev3dev_py_transpile',
    'CrispStrobe/ev3_lms_transpile',
    'CrispStrobe/circuit',
    'CrispStrobe/ledcube',
    'CrispStrobe/stc12live'
].map(slug => [slug, `${slug.split('/').pop()}.js`]);

const BLOCK_KIND = { command: 'command', reporter: 'reporter', Boolean: 'boolean', conditional: 'command', loop: 'command', hat: 'hat', event: 'hat' };

// The pinned revision of github.com/CrispStrobe/extensions that network-sourced
// extensions are read from. A full 40-hex sha, never a branch: a branch name would
// put us back to quoting a freshness we do not have.
const EXTENSIONS_REPO = 'CrispStrobe/extensions';
const EXTENSIONS_COMMIT = 'c681d995ef521ef289bc0eb9b6b0b1a4ffabe12a';
if (!/^[0-9a-f]{40}$/.test(EXTENSIONS_COMMIT))
    throw new Error(`EXTENSIONS_COMMIT must be a full 40-character sha, got "${EXTENSIONS_COMMIT}"`);

const sha256 = (s) => createHash('sha256').update(s).digest('hex');

/** Where each extension's source came from, recorded into the generated file. */
const provenance = {};

async function loadSource (slug, file) {
    const local = path.join(root, 'reference', 'extensions', file);
    try {
        const src = await readFile(local, 'utf8');
        provenance[slug] = { from: `reference/extensions/${file}`, sha256: sha256(src) };
        return src;
    } catch { /* not vendored in-repo; fall through to the pinned fetch */ }
    // sha-addressed, so the bytes cannot change under a fixed EXTENSIONS_COMMIT.
    const url = `https://raw.githubusercontent.com/${EXTENSIONS_REPO}/${EXTENSIONS_COMMIT}/`
        + `extensions/${slug}.js`;
    const res = await fetch(url);
    if (!res.ok) throw new Error(`fetch ${url}: ${res.status}`);
    const src = await res.text();
    provenance[slug] = { from: url, sha256: sha256(src) };
    return src;
}

// A permissive mock: any access/call/construct returns the same proxy, so extension code
// that touches BLE / DOM / runtime internals during load doesn't crash getInfo().
function permissive () {
    const p = new Proxy(function () {}, {
        get: (_, k) => {
            if (k === Symbol.toPrimitive) return () => '';           // string/number coercion
            if (k === Symbol.toStringTag) return 'Object';
            if (k === Symbol.iterator) return function* () {};       // spread / for-of
            if (k === 'valueOf') return () => 0;
            if (k === 'toString') return () => '';
            if (k === 'then') return undefined;                      // not a thenable
            return p;
        },
        has: () => true, apply: () => p, construct: () => p
    });
    return p;
}

function mockScratch (capture) {
    const any = permissive();
    return {
        BlockType: { COMMAND: 'command', REPORTER: 'reporter', BOOLEAN: 'Boolean', HAT: 'hat', EVENT: 'event', CONDITIONAL: 'conditional', LOOP: 'loop', BUTTON: 'button', LABEL: 'label', XML: 'xml' },
        ArgumentType: { NUMBER: 'number', STRING: 'string', BOOLEAN: 'Boolean', ANGLE: 'angle', COLOR: 'color', MATRIX: 'matrix', NOTE: 'note', IMAGE: 'image', COSTUME: 'costume', SOUND: 'sound' },
        TargetType: { SPRITE: 'sprite', STAGE: 'stage' },
        translate: (m) => (m && typeof m === 'object' ? (m.default || '') : m),
        extensions: { register: (inst) => capture.push(inst), unsandboxed: true, isPenguinMod: false },
        vm: any, runtime: any, Cast: any, gui: any, renderer: any,
        canFetch: () => Promise.resolve(false), fetch: () => Promise.resolve(any), openWindow: () => {}, redirect: () => {}
    };
}

function extract (source) {
    const captured = [];
    // Known globals get real mocks; any OTHER global the extension touches at load resolves
    // to a permissive stub, so BLE/DOM/rAF/timers etc. never throw before getInfo() runs.
    const known = {
        Scratch: mockScratch(captured),
        console: new Proxy({}, { get: () => () => {} }),   // any console.* method is a no-op
        setTimeout: () => 0, clearTimeout: () => {}, setInterval: () => 0, clearInterval: () => {},
        module: { exports: null }, exports: {}
    };
    const sandbox = new Proxy(known, {
        has: () => true,
        get: (t, k) => (k in t ? t[k] : (t[k] = permissive()))
    });
    try { vm.createContext(sandbox); vm.runInContext(source, sandbox, { timeout: 8000 }); } catch { /* getInfo may still have registered */ }
    let inst = captured[0];
    const moduleExport = known.module.exports;
    if (!inst && moduleExport) { try { inst = typeof moduleExport === 'function' ? new moduleExport() : moduleExport; } catch { /* ignore */ } }
    if (!inst || typeof inst.getInfo !== 'function') return null;
    let info;
    try { info = inst.getInfo(); } catch { return null; }
    if (!info || !info.id || !Array.isArray(info.blocks)) return null;
    const ops = {};
    for (const b of info.blocks) {
        if (!b || typeof b !== 'object' || !b.opcode) continue;
        const kind = BLOCK_KIND[b.blockType];
        if (!kind) continue; // skip HAT/EVENT/BUTTON/LABEL for now
        ops[b.opcode] = { kind, method: b.opcode, args: Object.keys(b.arguments || {}) };
    }
    return Object.keys(ops).length ? { id: info.id, runtime: info.id.replace(/[^a-z0-9]/gi, ''), ops } : null;
}

const registry = {};
const urls = {};
const failures = [];
for (const [slug, file] of HARDWARE) {
    try {
        const src = await loadSource(slug, file);
        const res = extract(src);
        if (res) {
            registry[res.id] = { runtime: res.runtime, ops: res.ops };
            urls[res.id] = `https://crispstrobe.github.io/extensions/${slug}.js`;
            console.log(`  ok    ${res.id.padEnd(20)} ${Object.keys(res.ops).length} ops  (${file})`);
        } else { failures.push(file); console.log(`  SKIP  ${file} (no extractable getInfo)`); }
    } catch (e) { failures.push(file); console.log(`  FAIL  ${file}: ${e.message}`); }
}

const banner = '// GENERATED by scripts/gen-runtime-registry.mjs — do not edit by hand.\n' +
    '// Runtime/hardware extension block surface, consumed by the pluggable-driver convention\n' +
    '// in sb3Creator.js. See reference/runtime-drivers.md.\n' +
    '//\n' +
    `// Sources: in-repo copies under reference/extensions/, else ${EXTENSIONS_REPO} pinned at\n` +
    `// ${EXTENSIONS_COMMIT}. RUNTIME_EXTENSION_SOURCES below records, per\n` +
    '// slug, WHICH of those answered and the sha256 of the bytes that were parsed — so this\n' +
    '// file names a revision rather than a repository. Regenerate to change it.\n';
const body = `${banner}export const RUNTIME_EXTENSIONS = ${JSON.stringify(registry, null, 4)};\n\n` +
    `export const RUNTIME_EXTENSION_URLS = ${JSON.stringify(urls, null, 4)};\n\n` +
    `export const RUNTIME_EXTENSION_SOURCES = ${JSON.stringify(
        { repo: EXTENSIONS_REPO, commit: EXTENSIONS_COMMIT, slugs: provenance }, null, 4)};\n`;
const outPath = path.join(root, 'src', 'utils', 'runtimeRegistry.generated.js');

if (process.argv.includes('--check')) {
    const current = await readFile(outPath, 'utf8').catch(() => '');
    if (current.trim() !== body.trim()) { console.error('\nruntimeRegistry.generated.js is stale — run: node scripts/gen-runtime-registry.mjs'); process.exit(1); }
    console.log('\nregistry up to date.');
} else {
    await writeFile(outPath, body);
    console.log(`\nwrote ${path.relative(root, outPath)} — ${Object.keys(registry).length} extensions, ${failures.length} skipped.`);
}
