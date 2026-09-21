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
import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join } from 'node:path';
import { pathToFileURL } from 'node:url';
import { requireSiblings, siblingGuardTest } from './helpers/siblings.mjs';
import { injectEngine } from '../scripts/lib/engine-surface.mjs';

const ROOT = join(import.meta.dirname, '..');
const EXAMPLES = join(ROOT, 'examples');

const gate = requireSiblings('bw-board', 'bw-circuit-ui');
siblingGuardTest(gate, 'the circuit-params-are-read gate');
const SKIP = gate.skip || false;
const repoURL = (name) => pathToFileURL(gate.paths[name] + '/');

// ---------- corpus ----------

/** Every (kind, key) the corpus declares, with every site that declares it. */
function declaredParams() {
    const sites = new Map();   // `kind.key` -> [{dir, file, partId}]
    let files = 0;
    for (const dir of readdirSync(EXAMPLES)) {
        if (dir === 'AUDIT' || !statSync(join(EXAMPLES, dir)).isDirectory()) continue;
        for (const file of readdirSync(join(EXAMPLES, dir))) {
            if (!/^circuit.*\.json$/.test(file)) continue;
            files++;
            const data = JSON.parse(readFileSync(join(EXAMPLES, dir, file), 'utf8'));
            for (const part of data.parts || []) {
                for (const key of Object.keys(part.params || {})) {
                    const id = `${part.kind}.${key}`;
                    if (!sites.has(id)) sites.set(id, []);
                    // `generated` is the bench generator's own stamp
                    // (benchFor+seat and friends). It is what separates an
                    // AUTHORED bench from one built from a program — see rank().
                    sites.get(id).push({ dir, file, partId: part.id,
                        generated: !!data.generated });
                }
            }
        }
    }
    return { sites, files };
}

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
    const keys = new Set();
    const anchored = [
        /\bparams\s*(?:\?\.|\.)\s*([A-Za-z_]\w*)/g,
        /\bparams\s*(?:\?\.)?\s*\[\s*['"]([A-Za-z_]\w*)['"]/g,
    ];
    for (const f of files) {
        const text = readFileSync(f, 'utf8')
            .replace(/\/\*[\s\S]*?\*\//g, ' ')
            .replace(/(^|[^:])\/\/[^\n]*/g, '$1 ');
        for (const re of anchored) {
            re.lastIndex = 0;
            let m;
            while ((m = re.exec(text)) !== null) keys.add(m[1]);
        }
        // const { rDark, rLight } = part.params
        for (const m of text.matchAll(/\{([^{}]*)\}\s*=\s*[\w.?]*params\b/g))
            for (const piece of m[1].split(',')) {
                const k = piece.split(':')[0].trim().replace(/^\.\.\./, '');
                if (/^[A-Za-z_]\w*$/.test(k)) keys.add(k);
            }
        // A local alias for the params object: `const P = part.params` and
        // `sourceVoltage(p, t)` where p IS params (mna.js reads p.amplitude,
        // p.offset, p.freq that way). Only in files that handle params at all.
        // This is the one deliberately loose rule here: an unrelated local `p`
        // can vote, which can only make tier 1 quieter, never wrongly red. Tier 2
        // is where per-kind sharpness lives, and it is not fooled by aliases.
        if (/\bparams\b/.test(text))
            for (const m of text.matchAll(/\b[Pp]\s*\.\s*([A-Za-z_]\w*)/g)) keys.add(m[1]);
    }
    return keys;
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

/**
 * RATCHET — tier 2. (kind, key) pairs that no bench in the corpus responds to.
 *
 * Two different things live here and the verdicts keep them apart:
 *
 *   BLIND SPOT — the engine does read the key; no shipped bench is in a state
 *   where it matters. Removing one of these means finding or building a bench
 *   that exercises it, which is a coverage gain, not a bug fix.
 *
 *   ENGINE — the key is declared, documented, and the model ignores it. The
 *   fix belongs in bw-board, so it cannot land in this repo; it is recorded in
 *   PLAN.md rather than papered over by deleting the declaration.
 *
 * May only SHRINK.
 */
const KNOWN_INERT = new Map([
    ['simplevga_card.rows',
        'ENGINE: nothing reads params.rows for this kind. `rows` is consumed by the character '
        + 'displays only — hd44780.js and i2c-parts.js both do `part.params?.rows ?? 2` — and no '
        + 'device model, face renderer or exporter reads it for simplevga_card. '
        + 'aurora65-workstation declares rows: 128, which is the card geometry its author '
        + 'intends; the declaration is kept rather than deleted because it states that intent, '
        + 'and this entry records that the engine does not yet act on it.'],

    ['sevenseg8.common',
        'BLIND SPOT: no bench declares COMMON ANODE. registerSevenseg8 reads it as '
        + '/anode/i.test(params.common) and inverts every segment when it matches, and '
        + "bw-board's test/infer-declared-params drives that init() with the value "
        + 'inferNetlist emits, so the read is proved where it can be. All four declaring '
        + 'benches are 79-a2-sampler, whose display is common CATHODE — and no generic '
        + 'perturbation of the string "cathode" can produce an ANODE value, so this gate '
        + 'cannot flip it from here — the value is read, but nothing in the corpus asks it '
        + 'the question. A bench declaring COMMON ANODE would move it, and this '
        + 'entry must go when one lands. (Before 2026-09-21 the key was emitted as '
        + '`commonAnode`, which the device never read at all; that was a real defect and is '
        + 'fixed upstream.)'],

    ['28c256.readOnly',
        'BLIND SPOT: no bench writes. readOnly refuses /WE writes, and both probed sites tie /WE high — '
        + 'a control store is never written. Flipping it changes nothing because nothing writes, '
        + 'which is the point of a control store. A bench that pulses /WE would move it.'],

    // Read off the solve path — geometry, rendering, export, load-time migration.
    ['arduino_mega.pins', 'BLIND SPOT: the controller pin table is consumed by terminal resolution and the exporters, not by a DC solve.'],
    ['arduino_nano.pins', 'BLIND SPOT: as arduino_mega.pins.'],
    ['arduino_uno.pins',  'BLIND SPOT: as arduino_mega.pins.'],
    ['mcu.pins',          'BLIND SPOT: as arduino_mega.pins.'],
    ['pi_pico.pins',      'BLIND SPOT: as arduino_mega.pins.'],
    ['breadboard.size',   'BLIND SPOT: read by bw-circuit-ui hit-testing and layout, never by the solver.'],
    ['led.color',         'BLIND SPOT: read by the renderer; the LED model uses vf.'],
    ['vsource.variant',   'BLIND SPOT: read only by bw-circuit-ui starter-migration at load time; volts carries the electrical meaning and is live.'],

    // Read by the model, but no shipped bench reaches the state that uses it.
    ['opamp.railHigh', 'BLIND SPOT: mna clamps to it, but no shipped op-amp bench drives the output into saturation during the probe window.'],
    ['zener.vf',    'BLIND SPOT: the zener benches operate in reverse breakdown, where vz sets the voltage and vf does not.'],
    ['relay.switchTimeMs','BLIND SPOT: read by the relay model; no probed bench transitions the coil inside the probe window.'],
    ['ssd1306.address',   'BLIND SPOT: read by the I2C address decoder; the probe drives no I2C traffic.'],
]);

describe('circuit params, tier 2: the key moves a real bench', { skip: SKIP }, () => {
    // Two time points, not four: one after the DC operating point settles and
    // one far enough out that a reactive part has moved. The suite runs 2,098
    // circuit files and every extra point is another full solve of each bench
    // probed — the first version of this gate took four points across fourteen
    // sites per pair and timed out at seven minutes on a loaded box.
    const TIMES = [1, 20];
    const VISUAL_ONLY = new Set(['label', 'wire_jumper']);
    // A live key answers on its best-ranked bench almost always; the sites
    // beyond that only ever cost time. A key already recorded as a blind spot
    // gets two, enough to notice it becoming live, not enough to be expensive.
    const MAX_SITES = 6;
    const MAX_SITES_KNOWN_INERT = 2;

    let Circuit, ready = false;
    test('the engine loads', async () => {
        ({ Circuit } = await injectEngine({
            board: gate.paths['bw-board'], cui: gate.paths['bw-circuit-ui'],
        }));
        ready = true;
        assert.ok(Circuit, 'bw-circuit-ui Circuit loaded');
    });

    // Base observations are shared: the same bench file carries several params,
    // and re-solving it once per (kind, key) was most of the cost.
    const baseCache = new Map();

    /** Everything this bench can be observed to do, as one comparable string. */
    const observe = (data) => {
        const d = JSON.parse(JSON.stringify(data));
        const hidden = new Set(d.parts.filter(p => VISUAL_ONLY.has(p.kind)).map(p => p.id));
        d.parts = d.parts.filter(p => !VISUAL_ONLY.has(p.kind));
        d.wires = (d.wires || []).filter(w =>
            !(typeof w.from === 'string' && hidden.has(w.from)) &&
            !(typeof w.to === 'string' && hidden.has(w.to)));
        const circuit = Circuit.fromJSON(d);
        const board = circuit.board;
        const frames = [];
        // Every manual control DRIVEN for the second half of the sweep.
        //
        // A param behind an open switch is unobservable for a reason that has
        // nothing to do with the engine: an off MOSFET is off whatever its
        // threshold is. pc39-nmos-switch is the whole nmos population of this
        // corpus and its gate sits behind a switch, so nmos.vth and nmos.k
        // were ratcheted as blind spots — MEASURED at bw-board 4ae99bea, with
        // the switch OPEN vth 2 and the perturbed 8.4 BOTH leave the drain at
        // 4.9950 V, and with it CLOSED the same perturbation moves the drain
        // 1.3243 V -> 4.9950 V. The key was live the whole time; the probe
        // never asked. This is generic, not an nmos special case: anything a
        // button or switch gates was equally invisible.
        // The times must stay MONOTONIC — advanceTo does not go backwards, so
        // the closed pass samples later instants rather than replaying TIMES.
        // Only benches that HAVE a manual control pay for the second pass: with
        // nothing to drive it would re-solve an identical circuit for no
        // observation. MEASURED across examples/*/circuit*.json: 631 of 2139
        // bench files carry one, so two thirds of the corpus skip the extra
        // solve entirely.
        //
        // A CONTROL NEED NOT BE OPEN/CLOSED. ldr and ntc are continuous — the
        // pass drives them to full deflection rather than closing them — and
        // leaving them out left `ldr.rLight` and `ntc.rHot` ratcheted as
        // engine blind spots for exactly the reason a switch did: their
        // exemptions read "every LDR bench probes at light control 0, where
        // the resistance is rDark". That is a fact about where the probe
        // looked. MEASURED at bw-board 4ae99bea, perturbing as this gate does,
        // on four independent benches: pc24-light-gate and pc48-ldr-comparator
        // (rLight) and pc33-thermistor-divider and pc55-ntc-indicator (rHot)
        // are all INERT at the authored control and all LIVE at control 1.
        const CONTROLLED = new Set(['button', 'switch', 'ldr', 'ntc']);
        const controls = (circuit.parts || []).filter(p => CONTROLLED.has(p.kind));
        const last = TIMES[TIMES.length - 1];
        const sweep = [...TIMES.map(t => [false, t]),
            ...(controls.length ? TIMES.map(t => [true, t + last]) : [])];
        for (const [driven, ms] of sweep) {
            if (driven) for (const c of controls) board.setControl(c.id, 1);
            board.advanceTo(BigInt(Math.round(ms * 1e6)));
            const frame = {};
            for (const net of (circuit.nets || board.getNets())) {
                const id = net.id || net.name;
                try { frame['V:' + id] = +board.nodeVoltage(id).toFixed(9); } catch { /* unsolved */ }
            }
            for (const part of (circuit.parts || [])) {
                const probes = [
                    ['I:', () => board.branchCurrent(part.id)],
                    ['R:', () => board.resistance(part.id)],
                    ['L:', () => board.ledBrightness(part.id)],
                    ['B:', () => board.buzzerTone(part.id)],
                    ['D:', () => board.getDeviceState(part.id)],
                ];
                for (const [tag, read] of probes) {
                    // The serialise must sit INSIDE the guard too: a device state
                    // that will not stringify is an unreadable probe, not a reason
                    // to abandon the whole bench and report it unprobeable.
                    try {
                        const v = read();
                        if (v === undefined || v === null) continue;
                        frame[tag + part.id] = typeof v === 'number' ? +v.toFixed(12)
                            : JSON.stringify(v).slice(0, 4000);
                    } catch { continue; }
                }
            }
            frames.push(frame);
        }
        return JSON.stringify(frames);
    };

    const perturb = (v) =>
        typeof v === 'number' ? (v === 0 ? 1.7 : v * 3.7 + 1)
        : typeof v === 'boolean' ? !v
        // REPLACE a string, do not extend it. `sevenseg8.common` is read as
        // /anode/i.test(value), so 'anode' + '_ZZ' still says anode and the
        // perturbation was a no-op that read as "the engine ignores this key".
        // A substring test is the normal shape for a string param, so
        // extending one is the weaker probe everywhere, not just here.
        : typeof v === 'string' ? (v === 'ZZ' ? 'YY' : 'ZZ')
        : Array.isArray(v) ? (v.length ? v.slice(0, -1) : ['zz'])
        : (v && typeof v === 'object') ? { ...v, __zz: 1 }
        : 'ZZ';

    // The AUTHORED bench first: a retargeted or flat twin often has no firmware
    // driving it, so nothing moves there whatever the key does. Ordering by
    // observability is what stops "no current flows in this bench" from being
    // reported as "the engine ignores this key".
    //
    // AUTHORED-NESS IS THE `generated` STAMP, NOT THE FILE NAME. The name was a
    // proxy, and the proxy broke: when 26 examples were rebuilt from their own
    // programs their `circuit.json` became a GENERATED bench, and ten such
    // benches — all of them dark at the probe instant, because no firmware runs
    // — took every one of the six slots for `led.vf` and reported the key
    // inert while the authored benches that deliberately vary it, 28-diode-
    // polarity and 45-led-current-comparison among them, were never reached.
    // Reading the stamp puts those back in front, which is what the paragraph
    // above always meant.
    const rank = (s) => (s.generated ? 4 : 0)
        + (s.file === 'circuit.json' ? 0
        : s.file === 'circuit-flat.json' ? 1
        : /^circuit\.[\w-]+\.json$/.test(s.file) ? 2 : 3);

    test(`every declared (kind, key) changes something in some bench (${KNOWN_INERT.size} exempt, listed in KNOWN_INERT)`, () => {
        assert.ok(ready, 'engine did not load');
        const inert = [], unprobeable = [], healed = [];
        for (const [id, all] of [...sites].sort((a, b) => a[0].localeCompare(b[0]))) {
            const key = id.slice(id.indexOf('.') + 1);
            const cap = KNOWN_INERT.has(id) ? MAX_SITES_KNOWN_INERT : MAX_SITES;
            const candidates = [...all].sort((a, b) => rank(a) - rank(b)).slice(0, cap);
            let moved = false, probed = 0;
            for (const site of candidates) {
                const path = join(EXAMPLES, site.dir, site.file);
                const raw = JSON.parse(readFileSync(path, 'utf8'));
                let before = baseCache.get(path);
                if (before === undefined) {
                    try { before = observe(raw); } catch { before = null; }
                    baseCache.set(path, before);
                }
                if (before === null) continue;
                const mutated = JSON.parse(JSON.stringify(raw));
                const part = mutated.parts.find(p => p.id === site.partId);
                if (!part) continue;
                probed++;
                part.params[key] = perturb(part.params[key]);
                // Throwing IS a response: the engine read the value.
                let after;
                try { after = observe(mutated); } catch { moved = true; break; }
                if (after !== before) { moved = true; break; }
            }
            if (moved) {
                if (KNOWN_INERT.has(id)) healed.push(id);
                continue;
            }
            if (probed === 0) unprobeable.push(`${id} — no solvable site among ${all.length}`);
            else if (!KNOWN_INERT.has(id)) inert.push(`${id} — ${probed} site(s) probed, none moved`);
        }
        assert.deepEqual(unprobeable, [], 'these (kind, key) pairs have no solvable bench at all');
        assert.deepEqual(inert.sort(), [],
            'Perturbing these params changed nothing observable in any bench that declares them. '
            + 'Either the engine ignores the key on this kind (fix the circuit or the engine), or '
            + 'no bench exercises it (add one). An entry may only be added to KNOWN_INERT with a '
            + 'written verdict saying which of those it is.');
        assert.deepEqual(healed.sort(), [],
            'RATCHET: these KNOWN_INERT entries now move a real bench; remove their exemptions.');
    });

    test('KNOWN_INERT carries nothing that no longer reproduces', () => {
        assert.ok(ready, 'engine did not load');
        const stale = [...KNOWN_INERT.keys()].filter(id => !sites.has(id));
        assert.deepEqual(stale, [],
            'RATCHET: these KNOWN_INERT entries name a (kind, key) the corpus no longer declares.');
        for (const [id, verdict] of KNOWN_INERT)
            assert.match(verdict, /^(BLIND SPOT|ENGINE):/,
                `KNOWN_INERT["${id}"] must open with a verdict of BLIND SPOT or ENGINE`);
    });
});
