#!/usr/bin/env node
// Generate the runtime/hardware extension registry from the actual extension sources.
//
// Each Brickwright hardware extension is a Scratch VM extension that exposes its block
// surface via `getInfo()`. Rather than hand-code ~30 opcodes × dozens of LEGO extensions,
// we execute each extension against a permissive mock Scratch API, capture getInfo(), and
// emit `{ extId: { runtime, ops: { opcode: {kind, method, args} } } }`. This is how the
// pluggable-driver convention "works for all our own extensions".
//
// Sources: pinned copies in reference/extensions/, else fetched from CrispStrobe/extensions
// (via the gallery slug). Output: src/utils/runtimeRegistry.generated.js.
//
//   node scripts/gen-runtime-registry.mjs            # regenerate from the HARDWARE list
//   node scripts/gen-runtime-registry.mjs --check    # fail if the output would change

import { readFile, writeFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import vm from 'node:vm';
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
    'CrispStrobe/ev3_lms_transpile'
].map(slug => [slug, `${slug.split('/').pop()}.js`]);

const BLOCK_KIND = { command: 'command', reporter: 'reporter', Boolean: 'boolean', conditional: 'command', loop: 'command', hat: 'hat', event: 'hat' };

async function loadSource (slug, file) {
    const local = path.join(root, 'reference', 'extensions', file);
    try { return await readFile(local, 'utf8'); } catch { /* fetch */ }
    const url = `https://crispstrobe.github.io/extensions/${slug}.js`;
    const res = await fetch(url);
    if (!res.ok) throw new Error(`fetch ${url}: ${res.status}`);
    return res.text();
}

// A permissive mock: any access/call/construct returns the same proxy, so extension code
// that touches BLE / DOM / runtime internals during load doesn't crash getInfo().
function permissive () {
    const p = new Proxy(function () {}, {
        get: (_, k) => (k === Symbol.toPrimitive ? () => '' : k === 'then' ? undefined : p),
        apply: () => p, construct: () => p
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
        Scratch: mockScratch(captured), console: { log () {}, warn () {}, error () {}, info () {} },
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
    '// Runtime/hardware extension block surface (source: github.com/CrispStrobe/extensions),\n' +
    '// consumed by the pluggable-driver convention in sb3Creator.js. See reference/runtime-drivers.md.\n';
const body = `${banner}export const RUNTIME_EXTENSIONS = ${JSON.stringify(registry, null, 4)};\n\n` +
    `export const RUNTIME_EXTENSION_URLS = ${JSON.stringify(urls, null, 4)};\n`;
const outPath = path.join(root, 'src', 'utils', 'runtimeRegistry.generated.js');

if (process.argv.includes('--check')) {
    const current = await readFile(outPath, 'utf8').catch(() => '');
    if (current.trim() !== body.trim()) { console.error('\nruntimeRegistry.generated.js is stale — run: node scripts/gen-runtime-registry.mjs'); process.exit(1); }
    console.log('\nregistry up to date.');
} else {
    await writeFile(outPath, body);
    console.log(`\nwrote ${path.relative(root, outPath)} — ${Object.keys(registry).length} extensions, ${failures.length} skipped.`);
}
