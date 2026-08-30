/**
 * There is ONE description of what the app injects into bw-circuit-ui.
 *
 * WHY THIS IS A GATE AND NOT A CONVENTION
 * ---------------------------------------
 * `setEngine()` takes three required keys and a handful of OPTIONAL ones, and
 * bw-circuit-ui degrades quietly when an optional one is absent — deliberately,
 * so an older vendored build keeps rendering. The consequence for a test rig is
 * that a stale injection cannot fail loudly. It silently measures a DIFFERENT
 * CIRCUIT than the one the app builds, stays green, and is believed.
 *
 * It has been believed twice, and both verdicts were wrong:
 *
 *   - bw-board's census script injected no `getDevice`, so every registered
 *     board kind collapsed to a generic `mcu`. It reported the disp-bargraph
 *     family broken and blamed seven CORRECT circuit files. Retracted in
 *     bw-board e35ff99, after the files had been "repaired".
 *   - `test/bench-invariants.test.mjs` injected `hasDevice` (a name
 *     bw-circuit-ui's `engineKindFor` has never asked for) instead of
 *     `getDevice`. Two 28c256 ROMs on pc112/pc113/pc117/pc118 kept their
 *     identity under the test and collapsed in the browser; when the collapse
 *     was fixed the inversion came out the other way and the same file
 *     reported 32 phantom GPIO-to-power shorts.
 *
 * Sixteen call sites spelled the injection out by hand. Fourteen were stale, in
 * five distinct ways: no `getDevice` at all; `hasDevice` instead of it; raw
 * `getDevice` without the app's `stc_mcu` exemption; a hand-listed subset of
 * `register*` calls instead of `registerAllDevices()`; and — in the other
 * direction — `getMaxCurrent`/`PORT_LIMITS`, which the app does NOT pass, so
 * one generator ran a current-budget DRC production does not have.
 *
 * WHAT THIS FILE CHECKS
 * ---------------------
 *   1. NO file under test/ or scripts/ calls `setEngine` with an object
 *      literal — zero, with an empty exception list. Even the source of truth
 *      passes a variable it built from ENGINE_SURFACE, so it does not need an
 *      exemption; the list exists only so a future one would have to be
 *      written down, and it may only SHRINK.
 *   2. `injectEngine()` really applies ENGINE_SURFACE — every key present, no
 *      key extra, each one a function.
 *   3. `getDevice` carries the app's exemption: `stc_mcu` answers null and
 *      everything else passes through.
 *   4. Anti-vacuity: the scanner matches a hand-rolled call when shown one, and
 *      `engineSurfaceFrom` REFUSES an engine that is missing a key rather than
 *      passing `undefined` through. That refusal is the whole mechanism, so it
 *      is proven here by mutation rather than asserted in prose.
 */
import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import { readdirSync, readFileSync, existsSync } from 'node:fs';
import { join, relative, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { requireSiblings, siblingGuardTest } from './helpers/siblings.mjs';
import {
    ENGINE_SURFACE, DEVICE_PASSTHROUGH_EXEMPT, engineSurfaceFrom,
    circuitGetDevice, injectEngine,
} from '../scripts/lib/engine-surface.mjs';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const SCANNED = ['test', 'scripts'];

/**
 * A `setEngine(` whose first argument opens an object literal. That is the
 * hand-rolled shape; `injectEngine()` passes a variable it built itself, so
 * even the source of truth's own `cui.setEngine(surface)` does not match.
 *
 * Two regexes for one rule, because `/g` carries `lastIndex` between calls and
 * `assert.match` uses `test()`: sharing one made the second anti-vacuity
 * assertion fail against a string it does match. The pair is asserted
 * equivalent below so they cannot drift.
 */
const HAND_ROLLED = /\bsetEngine\s*\(\s*\{/g;
const HAND_ROLLED_ONE = /\bsetEngine\s*\(\s*\{/;

/**
 * Files allowed to construct the object by hand.
 *
 * IT IS EMPTY, and that is the finding rather than an accident: routing every
 * site through `injectEngine()` left even `scripts/lib/engine-surface.mjs`
 * without a literal, because it builds the object from `ENGINE_SURFACE` and
 * passes the variable. So the achievable invariant here is the strong one —
 * ZERO — not "one blessed copy".
 *
 * The rule if that ever changes is the rule for every ratchet in this repo:
 * an entry may shrink or disappear, never grow, and a wrong number is itself a
 * failure so the list cannot quietly stop describing the repo. Adding an entry
 * is not a way to land a new injection site — it is a way to hide one.
 */
const KNOWN_CONSTRUCTORS = new Map([]);

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
    if (rel === 'test/engine-surface-adoption.test.mjs') continue;   // this file's own prose
    const n = (stripComments(readFileSync(f, 'utf8')).match(HAND_ROLLED) || []).length;
    if (n) hits.set(rel, n);
}

describe('the engine injection has one source of truth', () => {
    test('the scanner works at all (anti-vacuity)', () => {
        // MEASURED 2026-08-29 (scripts/threshold-observe.mjs, quiet-ish box, load 14):
        // files.length > 100 -> observed 187.
        assert.ok(files.length > 100,
            `only ${files.length} files scanned across ${SCANNED.join(', ')} — the walk found nothing`);
        assert.equal(HAND_ROLLED.source, HAND_ROLLED_ONE.source,
            'the two spellings of the rule have drifted apart');
        // Shown a hand-rolled call, it matches — in every layout this repo
        // actually used before the sweep.
        for (const yes of [
            'setEngine({ BoardImpl, inferNetlist, checkWiring });',
            'engmod.setEngine({BoardImpl: eng.BoardImpl});',
            'setEngine({\n    BoardImpl,\n});',
            'cui.setEngine ( { a } )',
        ]) assert.match(yes, HAND_ROLLED_ONE);
        // Shown the canonical one, it does not.
        for (const no of [
            'cui.setEngine(surface);',
            "const { setEngine } = await import('x');",
            // A bare specifier, deliberately: a RELATIVE one in a string
            // literal is read as a real import by scripts/check-staged-imports
            // and refuses the commit.
            'export { setEngine } from "bw-circuit-ui";',
        ]) assert.doesNotMatch(no, HAND_ROLLED_ONE);
        // And it reads real bytes: a file it scanned really does contain the
        // word, so a walk that silently read nothing cannot pass this.
        const self = readFileSync(join(ROOT, 'scripts/lib/engine-surface.mjs'), 'utf8');
        assert.match(self, /cui\.setEngine\(surface\)/,
            'the source of truth no longer calls setEngine — this gate is measuring nothing');
        assert.ok(files.some((f) => /engine-surface\.mjs$/.test(f)),
            'the walk did not reach scripts/lib/');
    });

    test('no file hand-rolls the injection object', () => {
        // The strong invariant: zero, not "one blessed copy".
        const unlisted = [...hits.entries()]
            .filter(([rel]) => !KNOWN_CONSTRUCTORS.has(rel))
            .map(([rel, n]) => `${rel} (${n})`)
            .sort();
        assert.deepEqual(unlisted, [],
            `${unlisted.length} file(s) build their own setEngine object. Call ` +
            `injectEngine() from scripts/lib/engine-surface.mjs instead — it applies ` +
            `ENGINE_SURFACE, which is copied from what circuit-tab.jsx actually passes. ` +
            `Injecting less than the app injects is how a census blamed seven correct ` +
            `files and how a gate reported 32 phantom GPIO shorts. Do NOT add an entry ` +
            `to KNOWN_CONSTRUCTORS to make this pass.`);
    });

    test('the ratchet matches the repo exactly, and may only shrink', () => {
        assert.ok(KNOWN_CONSTRUCTORS.size === 0 || KNOWN_CONSTRUCTORS.size === 1,
            'more than one blessed constructor is the state this gate exists to prevent');
        for (const [rel, { count, why }] of KNOWN_CONSTRUCTORS) {
            assert.ok(existsSync(join(ROOT, rel)),
                `${rel} is in KNOWN_CONSTRUCTORS but no longer exists — delete the entry`);
            const actual = hits.get(rel) || 0;
            assert.ok(actual <= count,
                `${rel} now builds ${actual} injection objects, up from ${count}. ` +
                `The reason on file is: ${why}`);
            assert.equal(actual, count,
                `${rel} is down to ${actual} from ${count} — lower the count in ` +
                `KNOWN_CONSTRUCTORS (or delete the entry at 0), or this list stops ` +
                `describing the repo and the ratchet stops holding.`);
        }
    });
});

describe('ENGINE_SURFACE is the app\'s surface, and nothing else', () => {
    test('the list is frozen, non-empty, and free of duplicates', () => {
        assert.ok(Object.isFrozen(ENGINE_SURFACE), 'ENGINE_SURFACE must be frozen');
        // MEASURED 2026-08-29 (scripts/threshold-observe.mjs, quiet-ish box, load 14):
        // ENGINE_SURFACE.length >= 10 -> observed 10.
        assert.ok(ENGINE_SURFACE.length >= 10, `only ${ENGINE_SURFACE.length} keys`);
        assert.equal(new Set(ENGINE_SURFACE).size, ENGINE_SURFACE.length, 'duplicate key');
        // The three bw-circuit-ui REQUIRES. Everything else it treats as
        // optional, which is exactly why the rest have to be listed.
        for (const required of ['BoardImpl', 'inferNetlist', 'checkWiring']) {
            assert.ok(ENGINE_SURFACE.includes(required), `${required} missing`);
        }
        // getDevice is the key whose absence produced both wrong verdicts.
        assert.ok(ENGINE_SURFACE.includes('getDevice'),
            'getDevice is the whole point of this file');
        // getMaxCurrent/PORT_LIMITS joined the app's call in lite fce761908
        // (fab-parity: rule 8 summed 0 mA in the deployed DRC without them,
        // proven by a browser gate that failed against pre-fix production).
        // The earlier revision of THIS check pinned their absence for the
        // same reason it now pins their presence: the list mirrors what the
        // app passes, in both directions.
        for (const injected of ['getMaxCurrent', 'PORT_LIMITS']) {
            assert.ok(ENGINE_SURFACE.includes(injected),
                `${injected} is in lite's setEngine since fce761908 — ` +
                'a rig without it measures a DRC production no longer has');
        }
        // createSweepWorker stays deliberately ABSENT: the app builds it per
        // session, not from the engine namespace.
        for (const notInjected of ['createSweepWorker']) {
            assert.ok(!ENGINE_SURFACE.includes(notInjected),
                `${notInjected} is in ENGINE_SURFACE but the app does not pass it — ` +
                'adding it here makes every gate measure a build production is not running');
        }
    });

    test('engineSurfaceFrom yields exactly the listed keys', () => {
        const fake = Object.fromEntries(ENGINE_SURFACE.map((k) => [k, () => k]));
        const surface = engineSurfaceFrom(fake);
        assert.deepEqual(Object.keys(surface).sort(), [...ENGINE_SURFACE].sort());
        for (const k of ENGINE_SURFACE) assert.equal(typeof surface[k], 'function', k);
    });

    test('MUTATION: a missing key is refused, not passed through as undefined', () => {
        // The mechanism under test. Every historical defect in this area was an
        // absent key that nobody noticed, so "absent" must throw.
        for (const drop of ENGINE_SURFACE) {
            const fake = Object.fromEntries(
                ENGINE_SURFACE.filter((k) => k !== drop).map((k) => [k, () => k]));
            assert.throws(() => engineSurfaceFrom(fake), (e) => {
                assert.match(e.message, new RegExp(drop),
                    `dropping ${drop} threw, but the message does not name it`);
                return true;
            }, `dropping ${drop} did not throw — this gate cannot fail, so it is not a gate`);
        }
    });

    test('MUTATION: a non-function key is refused too', () => {
        for (const bad of [undefined, null, 42, 'BoardImpl', {}]) {
            const fake = Object.fromEntries(ENGINE_SURFACE.map((k) => [k, () => k]));
            fake.getDevice = bad;
            assert.throws(() => engineSurfaceFrom(fake),
                `getDevice = ${String(bad)} was accepted`);
        }
    });

    test('getDevice carries the app\'s stc_mcu exemption', () => {
        const model = { terminals: ['a', 'b'] };
        const wrapped = circuitGetDevice(() => model);
        for (const kind of DEVICE_PASSTHROUGH_EXEMPT) {
            assert.equal(wrapped(kind), null,
                `${kind} must answer null — returning its model makes bw-circuit-ui ` +
                'treat the registry terminal list as authoritative and disconnects ' +
                'every wire on a package pin the concrete model does not name');
        }
        assert.equal(wrapped('arduino_uno'), model, 'every other kind passes through');
        assert.ok(DEVICE_PASSTHROUGH_EXEMPT.includes('stc_mcu'));
    });

    test('circuitGetDevice refuses a non-function', () => {
        for (const bad of [undefined, null, {}, 'getDevice']) {
            assert.throws(() => circuitGetDevice(bad), TypeError);
        }
    });
});

const gate = requireSiblings('bw-board', 'bw-circuit-ui');
siblingGuardTest(gate, 'the engine-surface injection');

describe('injectEngine against the real siblings', { skip: gate.skip }, () => {
    test('injects every ENGINE_SURFACE key and nothing more', async () => {
        const injected = await injectEngine({
            board: gate.paths['bw-board'], cui: gate.paths['bw-circuit-ui'],
        });
        assert.deepEqual(Object.keys(injected.surface).sort(), [...ENGINE_SURFACE].sort());
        // The engine bw-circuit-ui hands back is the one we put in.
        const { getEngine } = await import(
            new URL('src/engine.js', injected.cuiURL).href);
        assert.equal(getEngine().getDevice, injected.surface.getDevice);
        assert.equal(getEngine().getDevice('stc_mcu'), null);
        // registerAllDevices() ran: a kind from a device module no hand-listed
        // `register*` loop in this repo ever loaded resolves.
        assert.ok(injected.surface.getDevice('74hc595'),
            '74hc595 has no model — registerAllDevices() did not run');
    });
});
