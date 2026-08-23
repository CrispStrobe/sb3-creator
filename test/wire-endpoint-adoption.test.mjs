/**
 * circuit.json wire endpoints have ONE reader, and it lives in bw-circuit-ui.
 *
 * THE DIALECT PROBLEM. A wire endpoint is written either flat
 * (`{from: 'ID', fromTerminal: 't'}`) or nested
 * (`{from: {part, terminal}}` / `{to: {board, hole}}`), and the two appear
 * MIXED WITHIN A SINGLE FILE across this corpus: of the 2,096 shipped
 * circuit files that have wires, 1,057 are flat and 1,039 nested. Code that
 * reads one dialect does not fail on the other — it reads `undefined`, or
 * keys on the string "[object Object] undefined", and carries on:
 *
 *   - a hand-rolled union-find over `wires` reported 802 phantom shorts in
 *     2,040 files, because every breadboard endpoint collapsed to one key;
 *   - bw-board's examples gate failed 26 healthy examples the same way;
 *   - `scripts/audit-solve.mjs` — the harness the audit doctrine points every
 *     auditor at — branched on `typeof w.from === 'object'` and converted
 *     BOTH sides on that one test, so a wire flat on `from` and nested on
 *     `to` passed through unconverted into exactly that phantom key;
 *   - the visual-only filter in gallery-e2e and assert-physics matched only
 *     flat endpoints, so in the 1,039 nested files the part was removed and
 *     its wires were not.
 *
 * None of those announce themselves. That is why this is a gate.
 *
 * WHAT IT CHECKS. No file under test/, scripts/ or src/ may NAME a dialect
 * field — `.fromTerminal`, `.toTerminal`, or `.from`/`.to` drilled into
 * `.part`, `.terminal`, `.board`, `.boardId`, `.hole` — except the files
 * listed below with the reason each is safe.
 *
 * WHY THE LIST IS NOT EMPTY, AND CANNOT BE. `flatWire()` RETURNS the flat
 * shape: `{from, fromTerminal, to, toTerminal}`. Reading those fields off
 * its result is using the canonical reader correctly, and a rule that
 * forbade it would forbid the fix. So the achievable invariant is not "zero
 * occurrences" but "every occurrence is on a value the canonical reader
 * produced, and the list saying so may only SHRINK".
 *
 * THE RATCHET. Counts may only go down. A listed file must have EXACTLY its
 * recorded count: fewer means someone improved it and must lower the number
 * or delete the entry, so this list can never quietly describe a repo it no
 * longer matches. Never raise a count to make this green.
 */
import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import { readdirSync, readFileSync, existsSync } from 'node:fs';
import { join, relative, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

// Resolved from this file, never from CWD — a suite pinned to one working
// directory runs nowhere else.
const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const SCANNED = ['test', 'scripts', 'src'];

const DIALECT_FIELD =
    /\.(?:fromTerminal|toTerminal)\b|\.(?:from|to)\.(?:part|terminal|board|boardId|hole)\b/g;

const KNOWN_DIRECT_READS = new Map([
    ['test/ttl-module-acceptance.test.mjs', { count: 11, why:
        'reads the output of flatWire(), which IS the flat shape by design — ' +
        'translate() normalizes once and every assertion below matches on that.' }],
    ['scripts/audit-solve.mjs', { count: 10, why:
        'reads its own already-normalized `wires` array and the edge records it ' +
        'builds from breadboard strips; the raw file is read through ' +
        'wireEndpoint()/isBoardEndpoint() at the single point of entry.' }],
    ['scripts/lib/authored-transform.mjs', { count: 4, why:
        'three are on flat wires this module CONSTRUCTS (netWires/pdWires). The ' +
        'fourth is an inline both-dialect identity test on the source file, ' +
        'correct today but still a private copy of the rule — this is the next ' +
        'entry to shrink, and it needs sibling resolution in a lib module first.' }],
]);

describe('circuit.json wire endpoints have one reader', () => {
    const stripComments = (s) => s
        .replace(/\/\*[\s\S]*?\*\//g, '')
        .replace(/^\s*\/\/.*$/gm, '')
        .replace(/([^:])\/\/.*$/gm, '$1');

    const files = [];
    for (const dir of SCANNED) {
        const abs = join(ROOT, dir);
        if (!existsSync(abs)) continue;
        (function walk (d) {
            for (const e of readdirSync(d, { withFileTypes: true })) {
                if (e.name === 'node_modules' || e.name.startsWith('.')) continue;
                const p = join(d, e.name);
                if (e.isDirectory()) walk(p);
                else if (/\.(js|jsx|mjs|cjs)$/.test(e.name)) files.push(p);
            }
        })(abs);
    }

    const hits = new Map();
    for (const f of files) {
        const rel = relative(ROOT, f);
        if (rel === 'test/wire-endpoint-adoption.test.mjs') continue;   // this file's own prose
        const n = (stripComments(readFileSync(f, 'utf8')).match(DIALECT_FIELD) || []).length;
        if (n) hits.set(rel, n);
    }

    test('the scanner works at all (anti-vacuity)', () => {
        assert.ok(files.length > 100,
            `only ${files.length} files scanned across ${SCANNED.join(', ')} — the walk found nothing`);
        assert.match('key(w.from.part, w.fromTerminal)', DIALECT_FIELD);
        assert.doesNotMatch('Array.from(xs); wireEndpoint(w, "from")', DIALECT_FIELD);
        assert.ok(hits.size > 0, 'zero hits anywhere — the scan is not reading the files');
    });

    test('no unlisted file reads endpoint fields directly', () => {
        const unlisted = [...hits.entries()]
            .filter(([rel]) => !KNOWN_DIRECT_READS.has(rel))
            .map(([rel, n]) => `${rel} (${n})`)
            .sort();
        assert.deepEqual(unlisted, [],
            `${unlisted.length} file(s) hand-roll the wire-endpoint dialect. Import ` +
            `wireEndpoint()/flatWire() from bw-circuit-ui's src/model/wire-endpoints.js ` +
            `(the sibling helpers in test/helpers/siblings.mjs resolve it) instead. ` +
            `Handling one dialect and silently mishandling the other is how a corpus ` +
            `scan reported 802 phantom shorts. Do NOT add an entry here to make this pass.`);
    });

    test('the ratchet matches the repo exactly, and may only shrink', () => {
        for (const [rel, { count, why }] of KNOWN_DIRECT_READS) {
            assert.ok(existsSync(join(ROOT, rel)),
                `${rel} is in KNOWN_DIRECT_READS but no longer exists — delete the entry`);
            const actual = hits.get(rel) || 0;
            assert.ok(actual <= count,
                `${rel} now has ${actual} direct endpoint reads, up from ${count}. ` +
                `The reason on file is: ${why} A new one needs the accessor, not a bigger number.`);
            assert.equal(actual, count,
                `${rel} is down to ${actual} direct endpoint reads from ${count} — good. ` +
                `Lower the count in KNOWN_DIRECT_READS (or delete the entry at 0), or this ` +
                `list stops describing the repo and the ratchet stops holding.`);
        }
    });
});
