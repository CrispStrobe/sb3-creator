/**
 * Every param a circuit declares must be a param the engine actually reads.
 *
 * THE DEFECT CLASS
 * ----------------
 * A part carries `params`, and nothing validates the KEYS. A misspelt or
 * invented key is not an error, not a warning, and not visible in the drawing:
 * the part silently runs on the engine's DEFAULT while the file says otherwise.
 * Every instance found so far had already shipped green for weeks.
 *
 *   `frequency` on two vsources, where mna.js reads `freq` — both waveform
 *   benches ran at the 1 kHz default and one of them declared 100 (1a83dfa).
 *   `minOhms`/`maxOhms` on five LDRs and one NTC, where mna.js reads
 *   `rLight`/`rDark` and `rHot`/`rCold`: the five LDR benches simulated a
 *   100 Ω–1 MΩ part while their own EXPECTED.md did the arithmetic for the
 *   1 kΩ–100 kΩ part they declared, and pc60's assert had snapshotted the
 *   defaulted bench (0.05 V) while the comment beside it wrote out the
 *   declared one (5 × 10k/110k = 0.4545 V).
 *   `voutHigh`/`voutLow` on three op-amps, where mna.js reads
 *   `railHigh`/`railLow` — right by accident: the defaults are vcc and 0.
 *   `polarity` on a matrix8x8 and `outputs` on a 74hc595, which no model
 *   reads — and the matrix's EXPECTED.md told the learner to edit `polarity`
 *   to see the polarity lesson.
 *   `ohms` on 76-multimeter's NTC, where the ntc branch computes resistance
 *   from rCold/rHot and never looks at `ohms`.
 *
 * TWO TIERS, BECAUSE ONE IS NOT ENOUGH
 * ------------------------------------
 * Tier 1 is a SOURCE read: a key that appears nowhere in either engine is
 * dead beyond argument. It is sound — it cannot produce a false red — and it
 * catches every invented or misspelt key.
 *
 * Tier 1 alone is NOT enough, and this was proven rather than assumed: with
 * only Tier 1 in place, re-introducing the original `frequency` defect left
 * the gate GREEN, because `params?.frequency` is genuinely read — on a
 * `timer_555`, not on a `vsource`. A per-kind claim cannot be made by grepping.
 *
 * Tier 2 therefore makes it behaviourally, per (kind, key): perturb the value
 * in the real benches that declare it and require SOMETHING observable to move
 * — a node voltage, a branch current, an LED brightness, a buzzer tone, a
 * device state. That does catch `vsource.frequency`, verified the same way.
 *
 * Tier 2's weakness is the mirror image: a bench can be genuinely insensitive
 * to a key the engine does read (an op-amp that never saturates says nothing
 * about railHigh). So its ratchet list is not a list of tolerated defects but a
 * list of the instrument's blind spots, each with the reason stated — plus the
 * one entry where the verdict is that the ENGINE is wrong.
 */
import { describe, test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, readdirSync, existsSync } from 'node:fs';
import { join } from 'node:path';
import { requireSiblings, siblingGuardTest } from './helpers/siblings.mjs';
import { readParamKeys } from './helpers/param-source-reads.mjs';
import { declaredParams } from './helpers/param-probe.mjs';
import { KNOWN_INERT } from './helpers/param-known-inert.mjs';
import { defineTier2, SHARDS } from './helpers/param-tier2.mjs';

const gate = requireSiblings('bw-board', 'bw-circuit-ui');
siblingGuardTest(gate, 'the circuit-params-are-read gate');
const SKIP = gate.skip || false;

const { sites, files: circuitFiles } = declaredParams();

// ---------- tier 1: read anywhere in either engine ----------

function engineSources(root) {
    const out = [];
    const walk = (dir) => {
        let entries;
        try { entries = readdirSync(dir, { withFileTypes: true }); } catch { return; }
        for (const e of entries) {
            if (e.name === 'node_modules' || e.name.startsWith('.')) continue;
            const p = join(dir, e.name);
            if (e.isDirectory()) walk(p); else if (/\.(js|mjs|jsx)$/.test(e.name)) out.push(p);
        }
    };
    walk(root);
    return out;
}

/**
 * Param keys read by engine code, anchored on the word `params` so that an
 * unrelated `.freq` on some other object cannot vote. Comments are stripped
 * first: `params.frequency` in a prose comment is documentation, not a read,
 * and counting it is exactly how a dead key stays invisible.
 */
function readKeys(files) {
    return readParamKeys(new Map(files.map(file => [file, readFileSync(file, 'utf8')])));
}

/**
 * RATCHET — tier 1. Declared keys read nowhere. May only SHRINK; adding an
 * entry to go green is forbidden. Empty: every instance found in the
 * 2026-08-23 sweep was fixed at the source instead.
 */
const KNOWN_UNREAD = new Map([]);

describe('circuit params, tier 1: no key the engine never mentions', { skip: SKIP }, () => {
    const engineFiles = SKIP ? [] : [
        ...engineSources(join(gate.paths['bw-board'], 'src')),
        ...engineSources(join(gate.paths['bw-circuit-ui'], 'src')),
    ];
    const read = SKIP ? new Set() : readKeys(engineFiles);

    test('the instrument found an engine and a corpus to read', () => {
        // Floors: an empty engine tree or an empty corpus makes the subset
        // assertion below trivially true, which is the shape of a gate that
        // cannot fail.
        // MEASURED 2026-08-29 (scripts/threshold-observe.mjs, batch 2 under the fleet build
        // lock, box load 16-19): engineFiles.length >= 100 -> observed 280.
        assert.ok(engineFiles.length >= 100,
            `only ${engineFiles.length} engine sources — the sibling checkout looks wrong`);
        // MEASURED 2026-08-29 (scripts/threshold-observe.mjs, batch 2 under the fleet build
        // lock, box load 16-19): read.size >= 50 -> observed 265.
        assert.ok(read.size >= 50, `only ${read.size} param reads extracted — the extractor is broken`);
        // MEASURED 2026-08-29 (scripts/threshold-observe.mjs, batch 2 under the fleet build
        // lock, box load 16-19): circuitFiles >= 2000 -> observed 2162.
        assert.ok(circuitFiles >= 2000, `only ${circuitFiles} circuit files — the corpus looks truncated`);
        // MEASURED 2026-08-29 (scripts/threshold-observe.mjs, batch 2 under the fleet build
        // lock, box load 16-19): sites.size >= 30 -> observed 56.
        assert.ok(sites.size >= 30, `only ${sites.size} (kind, key) pairs — the scan is broken`);
        for (const canary of ['ohms', 'farads', 'freq', 'rDark', 'railHigh', 'rCold'])
            assert.ok(read.has(canary), `extractor missed a known engine read: ${canary}`);
    });

    test('no circuit declares a param no engine code mentions', () => {
        const dead = [];
        for (const [id, where] of sites) {
            const key = id.slice(id.indexOf('.') + 1);
            if (read.has(key) || KNOWN_UNREAD.has(id)) continue;
            dead.push(`${id} — ${where.length} declaration(s), first at ${where[0].dir}/${where[0].file}`);
        }
        assert.deepEqual(dead.sort(), [],
            'Declared by circuits, read by no engine code: the part runs on the engine DEFAULT '
            + 'and the file says otherwise. Use the key the engine reads, or drop it. Do NOT add '
            + 'it to KNOWN_UNREAD.');
    });

    test('KNOWN_UNREAD carries nothing that no longer reproduces', () => {
        const stale = [...KNOWN_UNREAD.keys()]
            .filter(id => !sites.has(id) || read.has(id.slice(id.indexOf('.') + 1)));
        assert.deepEqual(stale, [], 'RATCHET: remove KNOWN_UNREAD entries that no longer reproduce.');
    });
});

// ---------- tier 2: the key demonstrably moves a bench ----------

// ---------- tier 2: the key demonstrably moves a bench ----------
//
// The sweep is sharded across this file and circuit-params-are-read-2/-3/-4
// (test/helpers/param-tier2.mjs says why); the instrument is
// test/helpers/param-probe.mjs and the ratchet test/helpers/param-known-inert.mjs.

describe('circuit params, tier 2: the ratchet and the shards', { skip: SKIP }, () => {
    test('KNOWN_INERT carries nothing that no longer reproduces', () => {
        const stale = [...KNOWN_INERT.keys()].filter(id => !sites.has(id));
        assert.deepEqual(stale, [],
            'RATCHET: these KNOWN_INERT entries name a (kind, key) the corpus no longer declares.');
        for (const [id, verdict] of KNOWN_INERT)
            assert.match(verdict, /^(BLIND SPOT|ENGINE):/,
                `KNOWN_INERT["${id}"] must open with a verdict of BLIND SPOT or ENGINE`);
    });

    test('every shard of the sweep is a file node --test runs', () => {
        const missing = [];
        for (let s = 2; s <= SHARDS; s++) {
            const f = join(import.meta.dirname, `circuit-params-are-read-${s}.test.mjs`);
            if (!existsSync(f) || !readFileSync(f, 'utf8').includes(`defineTier2(${s - 1})`)) missing.push(f);
        }
        assert.deepEqual(missing, [], 'a tier-2 shard file is missing: its pairs are probed by nobody');
    });
});

defineTier2(0);
