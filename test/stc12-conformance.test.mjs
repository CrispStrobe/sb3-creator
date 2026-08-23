// Conformance: every copy of an extension that a host might load must define
// every opcode sb3Creator.js emits, with the same argument shapes and the same
// menu kinds.
//
// Three copies exist and they are three hand-maintained forks, not derivatives:
//   1. reference/extensions/stc12.js            in-repo, canonical
//   2. test/fixtures/downstream/gallery-*.js    what crispstrobe.github.io serves
//   3. test/fixtures/downstream/lite-*.js       what brickwright-lite bundles
//
// A menu with acceptReporters:false compiles to a FIELD. If a copy changes that,
// saved projects silently break: fields become inputs with shadow blocks and no
// longer match what sb3-creator wrote.
//
// WHY THE DOWNSTREAM COPIES ARE VENDORED
// --------------------------------------
// They used to be read from sibling checkouts, and the tests carried
// `skip: !source && 'file not found'`. sb3-creator's CI clones one repo, so five
// of seven tests skipped and every run was green — including the five days when
// the bundled extension was eight opcodes short and one shipped example was
// quietly inert. A skipped gate and a passing gate look identical in the summary
// line, so nothing here is allowed to skip. See test/STC12-CONFORMANCE-FINDING.md
// and scripts/vendor-downstream-extensions.mjs.

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { snapshots, loadExtension, blocksByOpcode, unwrap, MANIFEST } from './helpers/downstream.mjs';

const here = dirname(fileURLToPath(import.meta.url));

// ---- the opcodes sb3-creator emits (derived, not hand-maintained) ------------
// Scan sb3Creator.js for every opcode created by createBlock / cmd / B / push.
// Matching the creation call rather than the bare string means no exclusion list
// is needed (`_stc12_pins` is a variable name, not a createBlock call).

const sb3CreatorSource = readFileSync(resolve(here, '../src/utils/sb3Creator.js'), 'utf8');

function deriveEmitted (prefix, { stopAtReturn = false } = {}) {
    const opcodes = new Set();
    const args = {};
    const add = (op) => { opcodes.add(op); if (!args[op]) args[op] = new Set(); return args[op]; };
    for (const m of sb3CreatorSource.matchAll(new RegExp(`(?:createBlock|cmd)\\('${prefix}_([a-z0-9_]+)'`, 'g'))) {
        const bag = add(m[1]);
        // A fixed window picks up neighbouring blocks when they are packed close
        // together, so ledcube stops at the `return ret(` that ends the call.
        const window = sb3CreatorSource.slice(m.index, m.index + 400);
        const cut = stopAtReturn ? window.indexOf('return ret(') : -1;
        const after = cut > 0 ? window.slice(0, cut) : window;
        for (const f of after.matchAll(/(?:fields|inputs)\.([A-Z_]+)\s*=/g)) bag.add(f[1]);
    }
    for (const m of sb3CreatorSource.matchAll(new RegExp(`(?:B|push)\\('${prefix}_([a-z0-9_]+)',\\s*\\{[^}]*\\},?\\s*\\{([^}]*)\\}`, 'g'))) {
        const bag = add(m[1]);
        for (const f of m[2].matchAll(/([A-Z_]+)\s*:/g)) bag.add(f[1]);
    }
    return { opcodes, args };
}

const STC12 = deriveEmitted('stc12');
const LEDCUBE = deriveEmitted('ledcube', { stopAtReturn: true });

// The deriver is the instrument, and an instrument that reads zero is not a
// clean bill of health. If a refactor renames createBlock, every conformance
// assertion below would pass vacuously, so assert the instrument first.
test('the opcode deriver actually finds opcodes', () => {
    assert.ok(STC12.opcodes.size >= 25,
        `expected the emitter to yield 25+ stc12 opcodes, found ${STC12.opcodes.size} — ` +
        `the deriver has stopped matching and every conformance test below is now vacuous`);
    assert.ok(LEDCUBE.opcodes.size >= 5,
        `expected 5+ ledcube opcodes, found ${LEDCUBE.opcodes.size} — deriver broken`);
    for (const op of STC12.opcodes) {
        assert.ok(STC12.args[op] && STC12.args[op].size > 0,
            `stc12_${op}: the deriver found no argument names, so the argument check for it ` +
            `would pass vacuously (scan window too small, or the opcode takes none)`);
    }
});

const PREFIX = { stc12: STC12, stc12live: null, ledcube: LEDCUBE };
const prefixOf = (name) => (name.includes('stc12live') ? 'stc12live'
    : name.includes('ledcube') ? 'ledcube' : 'stc12');

// ---- shared assertions -------------------------------------------------------

function assertArgumentsAndMenus (info, emitted, label) {
    const blocks = blocksByOpcode(info);
    // The extension's argument names must match what the emitter writes. A
    // renamed argument silently breaks every saved project's field binding.
    for (const op of emitted.opcodes) {
        const block = blocks[op];
        if (!block) continue;   // absence is the expectedMissing assertion's business
        const declared = new Set(Object.keys(block.arguments || {}));
        for (const arg of emitted.args[op]) {
            assert.ok(declared.has(arg),
                `${label}: ${op} — emitter writes "${arg}" but getInfo() does not declare it`);
        }
    }
    // Every menu a block references must exist and be a FIELD.
    const menus = info.menus || {};
    for (const block of Object.values(blocks)) {
        for (const [argName, arg] of Object.entries(block.arguments || {})) {
            if (!arg.menu) continue;
            assert.ok(menus[arg.menu],
                `${label}: ${block.opcode}.${argName} references menu "${arg.menu}" which does not exist`);
            assert.strictEqual(menus[arg.menu].acceptReporters, false,
                `${label}: menu "${arg.menu}" must have acceptReporters:false (FIELD, not input)`);
        }
    }
}

// ---- the in-repo canonical copy ----------------------------------------------
// This one has no excuse: it lives here, so it is asserted with no exemption.

for (const [slug, emitted] of [['stc12', STC12], ['ledcube', LEDCUBE]]) {
    test(`reference/extensions/${slug}.js defines every emitted opcode`, () => {
        const info = loadExtension(readFileSync(resolve(here, `../reference/extensions/${slug}.js`), 'utf8'), slug);
        assert.strictEqual(info.id, slug);
        const blocks = blocksByOpcode(info);
        const missing = [...emitted.opcodes].filter((op) => !blocks[op]).sort();
        assert.deepStrictEqual(missing, [],
            `reference/extensions/${slug}.js is missing ${missing.length} opcode(s) the emitter ` +
            `writes: ${missing.join(', ')}. This copy is in this repository — there is no ` +
            `cross-repo excuse, fix it here.`);
        assertArgumentsAndMenus(info, emitted, `reference/${slug}`);
    });
}

// ---- the vendored downstream copies -------------------------------------------

for (const snap of snapshots()) {
    const emitted = PREFIX[prefixOf(snap.name)];

    test(`${snap.name}: conformance against the emitter`, () => {
        const info = loadExtension(snap.inner, snap.name);
        const blocks = blocksByOpcode(info);

        if (emitted) {
            const missing = [...emitted.opcodes].filter((op) => !blocks[op]).sort();
            const expected = [...(snap.entry.expectedMissing || [])].sort();
            // EXACT, not subset, and that is the whole point. A subset check lets a
            // new gap hide behind an old one; an exact check also fails once a
            // recorded gap is fixed upstream but the snapshot was never refreshed,
            // so the exemption cannot outlive its cause.
            assert.deepStrictEqual(missing, expected,
                `${snap.name} (${snap.source.repo}:${snap.source.path} @ ` +
                `${String(snap.entry.upstreamCommit).slice(0, 9)}) does not define the opcodes ` +
                `MANIFEST.json says it does not define.\n` +
                `  missing now:      ${missing.join(', ') || '(none)'}\n` +
                `  expectedMissing:  ${expected.join(', ') || '(none)'}\n` +
                (missing.length > expected.length
                    ? `  A NEW cross-repo gap. Port the opcodes, or record them with a pendingFix.`
                    : `  A recorded gap is closed. Re-vendor the snapshot and delete the entry.`));
        }
        assertArgumentsAndMenus(info, emitted || { opcodes: new Set(), args: {} }, snap.name);
    });

    // The snapshot must not drift away from what the sibling repo actually has.
    // Present only on a machine with the sibling checked out; absent in CI, where
    // the exact-expectedMissing assertion above is the guard instead. This is the
    // one place a missing input is legitimately not a failure — it adds a check,
    // it is not the check.
    test(`${snap.name}: vendored snapshot matches the live sibling checkout`, {
        skip: !snap.live && `no ${snap.source.repo} checkout on this machine — ` +
            `conformance above still ran against the vendored snapshot`
    }, () => {
        const live = readFileSync(snap.live, 'utf8');
        const liveInfo = loadExtension(unwrap(live, snap.source.wrapper), `${snap.name} (live)`);
        const snapInfo = loadExtension(snap.inner, snap.name);
        const shape = (info) => Object.entries(blocksByOpcode(info)).sort(([a], [b]) => a.localeCompare(b))
            .map(([op, b]) => [op, b.blockType, Object.entries(b.arguments || {})
                .sort(([x], [y]) => x.localeCompare(y)).map(([k, v]) => [k, v.type, v.menu || null])]);
        assert.deepStrictEqual(shape(snapInfo), shape(liveInfo),
            `test/fixtures/downstream/${snap.name}.js is stale against ${snap.live}. ` +
            `Re-vendor with \`node scripts/vendor-downstream-extensions.mjs\` and update ` +
            `MANIFEST.json's expectedMissing.`);
    });
}

// ---- the copies must agree with each other ------------------------------------

test('every copy of stc12 agrees on the shape of the blocks it shares', () => {
    const copies = { reference: loadExtension(readFileSync(resolve(here, '../reference/extensions/stc12.js'), 'utf8'), 'reference') };
    for (const snap of snapshots()) {
        if (prefixOf(snap.name) !== 'stc12') continue;
        copies[snap.name] = loadExtension(snap.inner, snap.name);
    }
    const names = Object.keys(copies);
    assert.ok(names.length >= 3,
        `expected the canonical copy plus both downstream snapshots, got ${names.join(', ')}`);

    const byOp = Object.fromEntries(names.map((n) => [n, blocksByOpcode(copies[n])]));
    for (const other of names.slice(1)) {
        for (const op of Object.keys(byOp[names[0]])) {
            const a = byOp[names[0]][op], b = byOp[other][op];
            if (!b) continue;   // absence is expectedMissing's business, not shape's
            assert.strictEqual(a.blockType, b.blockType,
                `${op}: blockType differs between ${names[0]} and ${other}`);
            const shape = (x) => Object.entries(x.arguments || {}).sort(([p], [q]) => p.localeCompare(q))
                .map(([k, v]) => [k, v.type, v.menu || null]);
            assert.deepStrictEqual(shape(a), shape(b),
                `${op}: argument shapes differ between ${names[0]} and ${other}`);
        }
        for (const menu of Object.keys(copies[names[0]].menus || {})) {
            const m = (copies[other].menus || {})[menu];
            if (!m) continue;
            assert.strictEqual(copies[names[0]].menus[menu].acceptReporters, m.acceptReporters,
                `menu "${menu}": acceptReporters differs between ${names[0]} and ${other}`);
        }
    }
});

test('MANIFEST.json attributes every snapshot to an upstream commit', () => {
    for (const snap of snapshots()) {
        assert.match(String(snap.entry.upstreamCommit), /^[0-9a-f]{40}$/,
            `${snap.name}: upstreamCommit must be a full sha, so the snapshot can be traced ` +
            `to what the sibling repo actually shipped`);
        assert.ok(snap.entry.why, `${snap.name}: MANIFEST.json must say why this copy is vendored`);
    }
    assert.ok(Object.keys(MANIFEST.snapshots).length >= 5,
        'expected at least five vendored downstream copies');
});
