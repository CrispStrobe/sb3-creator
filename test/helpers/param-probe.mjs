/**
 * The instrument behind test/circuit-params-are-read*.test.mjs, tier 2.
 *
 * Shared so the tier-2 sweep can run as several test FILES (node runs files in
 * parallel, tests inside one file in series). One file took longer than CI's
 * per-file --test-timeout of 900 s once the corpus passed 290 (kind, key)
 * pairs; see the header of circuit-params-are-read.test.mjs for the gate
 * itself and for what each piece below is for.
 */
import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join } from 'node:path';
import { createHash } from 'node:crypto';
import assert from 'node:assert/strict';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { build } from 'esbuild';
import { PARAM_INPUTS, applyParam, paramKey } from './bench-inputs.mjs';

export const ROOT = join(import.meta.dirname, '..', '..');
export const EXAMPLES = join(ROOT, 'examples');
/** The machine part the `.cp1` lessons seat: the index's `target` for them. */
export const CP1_KIND = JSON.parse(readFileSync(join(EXAMPLES, 'index.json'), 'utf8')).find(e => e.files?.cp1)?.target;

/** Every (kind, key) the corpus declares, with every site that declares it. */
export function declaredParams () {
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

// ---------- the probe ----------

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

/**
 * A device state as a comparable string. Small ones verbatim, so a failure
 * can be read; a large one as a hash of ALL of it. This was
 * `JSON.stringify(v).slice(0, 4000)`, and a machine's state (the KIM-1's, the
 * Microtronic's: memory first, clock and cycle counters after it) differs only
 * past the cut, so kim-1.clockHz and busch-microtronic.instructionHz read as
 * inert while the device ran a different number of cycles.
 */
const digest = (s) => (s.length <= 4000 ? s : `sha1:${createHash('sha1').update(s).digest('hex')}`);

/**
 * Machine and timing states carry BigInt (the KIM-1's and the Microtronic's
 * nanosecond clocks, a relay's pending switch time), and JSON.stringify throws
 * on one, which made the whole state an unreadable probe: those devices were
 * observed as having no state at all.
 */
const bigints = (_, v) => (typeof v === 'bigint' ? `${v}n` : v);

/** Kinds whose control a driven pass moves through setControl. */
const CONTROLLED = new Set(['button', 'switch', 'ldr', 'ntc', 'light_path']);
const DRIVE_TO = { light_path: 0.5 };

/**
 * The far state of each learner-set device input (bench-inputs.mjs
 * PARAM_INPUTS): a slide switch thrown, a magnet at full field, full light.
 *
 * The same blind spot as an open switch, one step further out. A Hall
 * module's threshold says nothing while no magnet is near (lab-hall-door-tone
 * is authored at field 0), and a heater behind a SLIDE switch never warms
 * its LED (lab-led-heat-light): `switch` was driven, `slide_switch` was not.
 * These are the inputs the gallery's own claims set; the driven pass sets
 * them the way the UI does, through setPartParam.
 */
function farState (spec) {
    if (spec.states) return spec.states[spec.states.length - 1];
    if (spec.range) return spec.range[1];
    if (spec.positions) return (1 << spec.positions) - 1;
    return 1;
}

/**
 * The microcontroller and machine GPIO a bench wires, as the engine sees it:
 * a part of kind `mcu` or one whose model declares gpioFollowsPinStates
 * (bw-board board.js _mcuSurfaceTerminals). No firmware runs here, so an
 * output stage behind a GPIO is otherwise never driven: cp1-cp4-relay-bank's
 * eight relays never saw their coil voltage, and pullInV and dropOutV were
 * recorded as blind spots for exactly that reason. The driven pass holds
 * every wired GPIO high, as solveBench's `__pins: 'high'` operating point
 * does; a board's power terminals are its model's static drives and ignore
 * a pin write.
 */
function gpioPins (circuit, getDevice) {
    const surface = new Set((circuit.parts || [])
        .filter(p => p.kind === 'mcu' || getDevice?.(p.kind)?.gpioFollowsPinStates)
        .map(p => p.id));
    if (!surface.size) return [];
    const pins = new Set();
    for (const net of (circuit.nets || circuit.board.getNets?.() || []))
        for (const t of (net.terminals || []))
            if (surface.has(t.part)) pins.add(String(t.terminal));
    return [...pins];
}

/**
 * The CARDIAC keys, observed by their OWNING observation rather than by the
 * generic solve. CARDIAC opens paused: a passive 20 ms solve cannot expose its
 * program or rate, and its Board device state carries BigInt scheduling fields
 * the generic probe only digests. `cardiac.inputSource` is a UI-owned
 * preference — the engine never reads it, the compact panel does — so it is
 * observed by rendering the pinned bw-circuit-ui CardiacPanel.
 */
export const CARDIAC_PARAMS = new Set(['cardiac.program', 'cardiac.instructionHz', 'cardiac.inputSource']);

/**
 * The pinned compact CARDIAC panel, bundled for a static render. CSS is
 * irrelevant to static markup; React is shared with this renderer, not copied
 * into a second hooks runtime.
 */
export async function loadCardiacPanel (cuiRoot) {
    const bundled = await build({
        entryPoints: [join(cuiRoot, 'src/components/CardiacPanel.jsx')],
        bundle: true, write: false, platform: 'node', format: 'esm',
        loader: { '.css': 'empty' },
        plugins: [{ name: 'shared-react', setup (builder) {
            builder.onResolve({ filter: /^react$/ }, () => ({
                path: import.meta.resolve('react'), external: true,
            }));
        } }],
    });
    const { CardiacPanel } = await import('data:text/javascript;base64,' +
        Buffer.from(bundled.outputFiles[0].text).toString('base64'));
    return CardiacPanel;
}

/**
 * One CARDIAC key's owning observation, as one comparable string: the public
 * decimal machine fields after explicit execution (program, rate), or the
 * rendered panel (input preference). Nothing internal is serialised.
 */
function observeCardiac ({ Circuit, CardiacPanel }, data, id) {
    const circuit = Circuit.fromJSON(JSON.parse(JSON.stringify(data)));
    assert.equal(circuit.netlistError, null, 'the CARDIAC probe must load a valid bench');
    const part = circuit.parts.find(p => p.kind === 'cardiac');
    assert.ok(part, 'a CARDIAC probe needs its authored part');
    const board = circuit.board;
    if (id === 'cardiac.inputSource') {
        assert.equal(typeof CardiacPanel, 'function', 'cardiac.inputSource needs the pinned CardiacPanel');
        const markup = renderToStaticMarkup(React.createElement(CardiacPanel, { part, board }));
        assert.equal(board.getDeviceState(part.id).steps, 0, 'rendering a preference does not execute a card');
        return markup;
    }
    const command = (verb, value) => assert.equal(board.setDeviceControl(part.id, verb, value), true,
        `CARDIAC accepted ${verb}`);
    if (id === 'cardiac.instructionHz') {
        // Nonblocking ADD/JMP loop: no input wait or HRS can conceal rate.
        // Keep the authored instructionHz; replace only this probe's code.
        command('loadProgram', { entry: 1, words: [
            { address: 1, value: 281 }, { address: 2, value: 801 }, { address: 81, value: 1 },
        ] });
    } else command('enqueueInput', [200, 800]);
    command('run');
    board.advanceTo(1000000000n);
    const state = board.getDeviceState(part.id);
    assert.equal(state.error, null);
    assert.ok(state.steps > 0, 'the program probe must actually retire instructions');
    if (id === 'cardiac.instructionHz') {
        assert.equal(state.waiting, false); assert.equal(state.halted, false);
    }
    return JSON.stringify({ pc: state.pc, acc: state.acc, steps: state.steps,
        memory: state.memory, output: state.output, waiting: state.waiting, halted: state.halted });
}

/**
 * @param {{Circuit: any, getDevice?: Function, extractors?: Record<string, Function>, CardiacPanel?: Function}} engine
 *   `extractors` are the engine's machine extractors (extractCp1Machine and
 *   its kin). Their verdict is what the debugger acts on when it attaches
 *   firmware, so it is part of what a bench observably does: a CP1 connector
 *   declaring a crystal other than 6 MHz is refused there, and its expansion
 *   flag decides whether ports 3-5 and the upper RAM exist at all.
 */
export function makeObserver ({ Circuit, getDevice, extractors = {}, CardiacPanel = null }) {
    const machines = Object.entries(extractors).filter(([, f]) => typeof f === 'function').map(([name, f]) => {
        let blank;
        try { blank = JSON.stringify(f({ parts: [], wires: [], nets: [] })); } catch (e) { blank = `threw: ${String(e.message).slice(0, 200)}`; }
        return [name, f, blank];
    });
    /**
     * Everything this bench can be observed to do, as an array of comparable
     * frames. With `base` (this function's result for the unperturbed bench)
     * it returns true as soon as one frame differs, and false when none does,
     * instead of running the rest: a key that moves almost always moves the
     * first frame, and an RF bench costs a minute of CPU per 40 simulated ms
     * (lab-rf-remote, MEASURED 2026-11-26 at bw-board f48ea7ce).
     *
     * `paramId` names the (kind, key) being probed. A CARDIAC key is observed
     * by its owning observation (observeCardiac) instead of the generic solve,
     * as one frame.
     */
    return function observe (data, base = null, paramId = null) {
        if (CARDIAC_PARAMS.has(paramId)) {
            const s = observeCardiac({ Circuit, CardiacPanel }, data, paramId);
            return base !== null ? base[0] !== s : [s];
        }
        const d = JSON.parse(JSON.stringify(data));
        const hidden = new Set(d.parts.filter(p => VISUAL_ONLY.has(p.kind)).map(p => p.id));
        d.parts = d.parts.filter(p => !VISUAL_ONLY.has(p.kind));
        d.wires = (d.wires || []).filter(w =>
            !(typeof w.from === 'string' && hidden.has(w.from)) &&
            !(typeof w.to === 'string' && hidden.has(w.to)));
        const frames = [];
        const differs = (frame) => {
            const s = JSON.stringify(frame);
            frames.push(s);
            return base !== null && base[frames.length - 1] !== s;
        };
        // The attach-time view first: it needs no solve. An extractor speaks
        // only where its verdict differs from the one it gives an empty
        // bench — a 6502 extractor has nothing to say about a CP1 lesson
        // beyond "no W65C02", and repeating that on every frame is noise.
        const attach = {};
        for (const [name, extract, blank] of machines) {
            let v;
            try { v = JSON.stringify(extract(d)); } catch (e) { v = `threw: ${String(e.message).slice(0, 200)}`; }
            if (v !== blank) attach[name] = v;
        }
        if (differs(attach)) return true;

        const circuit = Circuit.fromJSON(d);
        const board = circuit.board;
        // A saved Microtronic opens halted. Run its authored program through
        // the public control, then observe far enough for its 20 Hz input and
        // output instructions to reach the wires after the switches close.
        // This retains PR #237's Microtronic timing correction in the newer
        // shared observer; every other bench keeps its existing sweep.
        const microtronics = (circuit.parts || []).filter(p => p.kind === 'busch-microtronic');
        for (const computer of microtronics) board.setDeviceControl(computer.id, 'run', 0);
        const probeTimes = microtronics.length ? [1, 100] : TIMES;
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
        //
        // A light path's knob (bw-board optics.js) is the same kind of control:
        // it moves the geometry param named by params.knob between knobMin and
        // knobMax, so knob/knobMin/knobMax are inert until it is turned. It is
        // driven to mid-range, where both ends of the range still matter.
        //
        // Since 2026-11-26 the driven pass also throws every learner-set
        // device input (farState) and holds every wired GPIO high (gpioPins):
        // the same blind spot, at the next kind of control out.
        // An antenna with a clock dial (bw-board radio.js hour()) is a control
        // too: the dial at 1 is midnight, the sky wave's hour. Without one,
        // the antenna has no control channel at all.
        const controls = (circuit.parts || []).filter(p => CONTROLLED.has(p.kind)
            || (p.kind === 'antenna' && p.params?.clock));
        const inputs = (circuit.parts || []).filter(p => PARAM_INPUTS[p.kind]);
        const pins = gpioPins(circuit, getDevice);
        const drive = () => {
            for (const c of controls) board.setControl(c.id, DRIVE_TO[c.kind] ?? 1);
            for (const p of inputs) {
                const spec = PARAM_INPUTS[p.kind];
                try { applyParam(board, paramKey(p.id, spec.param), farState(spec)); }
                catch { /* an input the model refuses is not fatal */ }
            }
            for (const pin of pins) {
                try { board.setPin(pin, 'pushpull', true); } catch { /* a pin the model refuses is not fatal */ }
            }
        };
        const last = probeTimes[probeTimes.length - 1];
        const anything = controls.length + inputs.length + pins.length > 0;
        const sweep = [...probeTimes.map(t => [false, t]),
            ...(anything ? probeTimes.map(t => [true, t + last]) : [])];
        let drove = false;
        for (const [driven, ms] of sweep) {
            if (driven && !drove) { drive(); drove = true; }
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
                    ['D:', () => {
                        const state = board.getDeviceState(part.id);
                        if (part.kind !== 'busch-microtronic' || !state) return state;
                        // These are copies of the input params used only to
                        // detect edits. They are not device behavior: retaining
                        // them let an engine that ignored instructionHz pass
                        // solely because its cache echoed the changed value.
                        // Keep the full program, registers, clock, scheduler
                        // and output state, including their BigInt values.
                        const observed = {...state};
                        delete observed._paramsProgram;
                        delete observed._paramsInstructionHz;
                        return observed;
                    }],
                ];
                for (const [tag, read] of probes) {
                    // The serialise must sit INSIDE the guard too: a device state
                    // that will not stringify is an unreadable probe, not a reason
                    // to abandon the whole bench and report it unprobeable.
                    try {
                        const v = read();
                        if (v === undefined || v === null) continue;
                        frame[tag + part.id] = typeof v === 'number' ? +v.toFixed(12)
                            : digest(JSON.stringify(v, bigints));
                    } catch { continue; }
                }
            }
            if (differs(frame)) return true;
        }
        return base !== null ? false : frames;
    };
}

export const perturb = (v) =>
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


/**
 * Keys that need their own perturbation: the generic one either lands on a
 * value the model falls back from (an unknown string is the default) or moves
 * the key away from the state in which it acts.
 *
 * Until bw-board clamped ferrite_coil.couplingRatio to the main winding's
 * turns (with a param-clamped warning) and refused an RF band that runs away,
 * 3.7x + 1 on lab-am-transmitter's 0.02 grew the heap past 3 GB in the first
 * simulated millisecond, and this gate halved the ratio instead. The engine
 * now ends that bench in a refusal within ~100 MB.
 */
export const PERTURB_BY_KEY = new Map([
    // A model NAME: an unknown name ('ZZ') falls back to the default, which
    // is what the corpus declares, so only the other legal model answers.
    // bw-board's diodes and LEDs are 'shockley' by default; 'pwl' is the
    // knee model (MEASURED 2026-11-23: lab-log-amp -0.574 V -> rail-bound).
    ['diode.model', (v) => (v === 'pwl' ? 'shockley' : 'pwl')],
    ['led.model', (v) => (v === 'pwl' ? 'shockley' : 'pwl')],
    // registerSevenseg8 reads /anode/i; every declaring bench is cathode.
    ['sevenseg8.common', (v) => (/anode/i.test(String(v)) ? 'cathode' : 'anode')],
    // optics.js CAUCHY knows acrylic, glass and flint; anything else is acrylic.
    ['light_path.material', (v) => (v === 'flint' ? 'acrylic' : 'flint')],
    // 0..1, clamped: the corpus authors clean cuts (1), and 3.7 x + 1 clamps
    // straight back to 1. A rough cut is inside the range.
    ['light_path.cutQuality', (v) => (Number(v) > 0.5 ? 0.2 : 1)],
    // The jet medium's knob runs combCm 20 (rest) .. 1 cm; pathKnobRest
    // clamps 3.7 x + 1 = 75 back to the rest end, where nothing bends. The
    // other end of the knob's own range is the perturbation that means
    // something: the comb brought close.
    ['light_path.combCm', (v) => (Number(v) > 5 ? 1 : 20)],
    // Adding an unknown object property does not change an accepted CARDIAC
    // image. ENTRY is a supported field and changes the executed starting word.
    ['cardiac.program', (image) => ({ ...image, entry: (image.entry + 1) % 100 })],
    ['cardiac.inputSource', (source) => (source === 'circuit' ? 'manual' : 'circuit')],
]);

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
export const rank = (s) => (s.generated ? 4 : 0)
    + (s.file === 'circuit.json' ? 0
    : s.file === 'circuit-flat.json' ? 1
    : /^circuit\.[\w-]+\.json$/.test(s.file) ? 2 : 3);
export { MAX_SITES, MAX_SITES_KNOWN_INERT };

/**
 * The sites of one key in the order they are probed: by rank, and among
 * equal ranks one site per bench FILE before a second site of any file.
 *
 * Eight identical parts in one bench used to take every slot. cp1-cp4-relay-
 * bank declares relay.dropOutV on its eight relays, all eight coils at 0 V or
 * at the full battery, and it sorts first, so the cap of six (two for a key
 * in KNOWN_INERT) never reached lab-relay-hysteresis, the bench built to hold
 * a coil between drop-out and pull-in. A second part of a bench that did not
 * move is rarely in a different state; another bench usually is.
 */
export function probeOrder (sites) {
    const seen = new Map();
    const nth = new Map();
    for (const s of sites) {
        const f = `${s.dir}/${s.file}`;
        const n = seen.get(f) ?? 0;
        seen.set(f, n + 1);
        nth.set(s, n);
    }
    return [...sites].sort((a, b) => rank(a) - rank(b) || nth.get(a) - nth.get(b));
}

/**
 * Probe each (kind, key) in `ids` on its best-ranked sites until one moves.
 * Returns the verdicts the gate asserts on, plus per-key cost for whoever is
 * measuring it.
 *
 * @param {string[]} ids `kind.key`, in the order to probe
 * @param {Map<string, object[]>} sites declaredParams().sites
 * @param {(data: object, base?: string[]) => (string[]|boolean)} observe
 * @param {Map<string, string>} knownInert
 * @param {Map<string, any>} [baseCache] path -> base frames (or null), shared across calls;
 *   a CARDIAC key's base is its own observation, cached as `path|kind.key`
 */
export function probeKeys (ids, sites, observe, knownInert, baseCache = new Map()) {
    const inert = [], unprobeable = [], healed = [], cost = new Map();
    for (const id of ids) {
        const all = sites.get(id) || [];
        const key = id.slice(id.indexOf('.') + 1);
        const cap = knownInert.has(id) ? MAX_SITES_KNOWN_INERT : MAX_SITES;
        const candidates = probeOrder(all).slice(0, cap);
        const t0 = process.cpuUsage();
        let moved = false, probed = 0;
        for (const site of candidates) {
            const path = join(EXAMPLES, site.dir, site.file);
            const raw = JSON.parse(readFileSync(path, 'utf8'));
            const cacheKey = CARDIAC_PARAMS.has(id) ? `${path}|${id}` : path;
            let before = baseCache.get(cacheKey);
            if (before === undefined) {
                try { before = observe(raw, null, id); } catch { before = null; }
                baseCache.set(cacheKey, before);
            }
            if (before === null) continue;
            const mutated = JSON.parse(JSON.stringify(raw));
            const part = mutated.parts.find(p => p.id === site.partId);
            if (!part) continue;
            probed++;
            part.params[key] = (PERTURB_BY_KEY.get(id) || perturb)(part.params[key]);
            // Throwing IS a response: the engine read the value.
            let differs;
            try { differs = observe(mutated, before, id); } catch { moved = true; break; }
            if (differs) { moved = true; break; }
        }
        const c = process.cpuUsage(t0);
        cost.set(id, (c.user + c.system) / 1000);
        if (moved) {
            if (knownInert.has(id)) healed.push(id);
            continue;
        }
        if (probed === 0) unprobeable.push(`${id} — no solvable site among ${all.length}`);
        else if (!knownInert.has(id)) inert.push(`${id} — ${probed} site(s) probed, none moved`);
    }
    return { inert, unprobeable, healed, cost };
}
