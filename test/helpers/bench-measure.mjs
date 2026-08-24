/**
 * What a bench actually measures — and the discovery that the corpus has had a
 * current readback all along.
 *
 * THE INSTRUMENT THAT WAS THERE
 * -----------------------------
 * `assert-physics` retires every `current` assertion with the reason "current
 * readback not yet wired", and `expected-quantities-hold` derived currents from
 * a resistor's own voltage drop because of it. Neither was necessary:
 * `BoardImpl.branchCurrent(partId, terminal)` (bw-board src/board.js) has been
 * the public face of `solveMNA`'s `branchCurrents` map the whole time, and that
 * map is populated for resistors, LEDs, diodes, zeners, BJTs, MOSFETs, supply
 * parts and every registered device model — from the SAME stamp the solve used,
 * which a hand-derived V/R is not. So the base current of a transistor and the
 * total current out of a rail are readable, and neither is obtainable from node
 * voltages alone.
 *
 * The cost of not knowing was concrete. 38-npn-switch states a 0.43 mA base
 * current and a 5.96 mA collector current; with no current readback there was
 * nothing to compare them against, so both sat unread. The same is true of
 * every "Total supply current" line in the corpus.
 *
 * ONE SOLVE IS ONE OPERATING POINT
 * --------------------------------
 * The other half of the problem is that most claims are not about the bench in
 * its authored state. They are about it with the button pressed, the pot at
 * 70 %, the input swept to 12 V, or 100 ms after power-on — and a document that
 * says so is being precise, not vague. `solveBench()` therefore takes the
 * operating point as an argument: `controls` reaches `BoardImpl.setControl`
 * (button 1 = pressed, pot = position, vsource = volts, LDR = light, NTC =
 * temp — the vocabulary `stampButton`/`stampPotentiometer` read), and `atMs`
 * reaches `advanceTo`, so an RC table's rows are checked at the times the table
 * names.
 *
 * A claim whose operating point cannot be parsed is DECLINED by name rather
 * than compared against the wrong one. Comparing it anyway is how a document
 * gets marked wrong for being right.
 */
import { readFileSync, existsSync } from 'node:fs';
import { join } from 'node:path';
import { pathToFileURL } from 'node:url';
import { EXAMPLES } from './expected-claims.mjs';

/** Drawn but currents nothing; these must never reach the netlist. */
const VISUAL_ONLY = new Set(['label', 'wire_jumper']);

const MCU_KIND = /^(mcu|arduino_|pi_pico|attiny|atmega|stc\d|w65c|m?6502|z80|esp)/i;
const CLOCKED_KIND = /^(timer_555|timer_|crystal|oscillator)/i;
/** Parts whose output is an input this gate has no channel to supply. */
const DRIVEN_KIND = /^(sound_module|microphone|function_gen)/i;

/** Parts whose current out of the named terminal is the bench's supply current. */
const SUPPLY_TERMINAL = { vcc: 'vcc', vsource: 'pos', battery: 'pos' };

let engine = null;

export async function loadEngine (paths) {
    if (engine) return engine;
    const board = pathToFileURL(paths['bw-board'] + '/');
    const cui = pathToFileURL(paths['bw-circuit-ui'] + '/');
    const { BoardImpl } = await import(new URL('src/board.js', board).href);
    const { inferNetlist, checkWiring } = await import(new URL('src/infer-netlist.js', board).href);
    const { registerAllDevices } = await import(new URL('src/register-all.js', board).href);
    const { getDevice } = await import(new URL('src/devices.js', board).href);
    const { setEngine } = await import(new URL('src/engine.js', cui).href);
    const { Circuit } = await import(new URL('src/model/circuit.js', cui).href);
    registerAllDevices();
    setEngine({ BoardImpl, inferNetlist, checkWiring, getDevice });
    engine = { Circuit };
    return engine;
}

export const engineLoaded = () => Boolean(engine);

/**
 * Why one solve cannot speak for a bench, or null when it can.
 *
 * Named by class, not by example, so a bench of the same shape added tomorrow
 * is declined for the same stated reason instead of quietly compared.
 */
export function benchClass (data) {
    const kinds = (data.parts || []).map(p => p.kind || '');
    if (kinds.some(k => CLOCKED_KIND.test(k)))
        return 'free-running oscillator — the claim is about a waveform and a solve is an instant';
    if (kinds.some(k => DRIVEN_KIND.test(k)))
        return 'the bench is driven by a module whose output level is an input this gate cannot set';
    if ((data.parts || []).some(p => p.kind === 'vsource' && (p.params?.wave || p.params?.freq)))
        return 'driven bench — the source is a waveform, so a solve is an instant';
    return null;
}

const DOCS = new Map();
function benchDoc (dir) {
    if (DOCS.has(dir)) return DOCS.get(dir);
    const path = join(EXAMPLES, dir, 'circuit.json');
    let out;
    if (!existsSync(path)) out = { error: 'no authored circuit.json to hold the claim against' };
    else {
        try {
            const data = JSON.parse(readFileSync(path, 'utf8'));
            const declined = benchClass(data);
            out = declined ? { error: declined } : { data };
        } catch (e) { out = { error: `circuit.json will not parse: ${e.message.slice(0, 40)}` }; }
    }
    DOCS.set(dir, out);
    return out;
}

const SOLVES = new Map();

/**
 * Solve one bench at one operating point.
 *
 * @param {string} dir
 * @param {{controls?: Record<string, number>, atMs?: number}} [at]
 * @returns {{error?: string, voltage?: Map, current?: Map, measurands?: Array}}
 */
export function solveBench (dir, at = {}) {
    const controls = at.controls || {};
    const atMs = at.atMs ?? 2;
    const key = `${dir}|${atMs}|${Object.entries(controls).sort().map(([k, v]) => k + '=' + v).join(',')}`;
    if (SOLVES.has(key)) return SOLVES.get(key);
    const out = solveUncached(dir, controls, atMs);
    SOLVES.set(key, out);
    return out;
}

function solveUncached (dir, controls, atMs) {
    const doc = benchDoc(dir);
    if (doc.error) return { error: doc.error };
    let data = doc.data;

    const hidden = new Set(data.parts.filter(p => VISUAL_ONLY.has(p.kind)).map(p => p.id));
    data = {
        ...data,
        // A `vcc` part has no volts of its own: the rail is the document's
        // top-level `vcc`, so sweeping the supply of such a bench means
        // rewriting that before the board is built, not calling setControl.
        vcc: controls.__vcc ?? data.vcc,
        parts: data.parts.filter(p => !VISUAL_ONLY.has(p.kind)),
        wires: (data.wires || []).filter(w =>
            !(typeof w.from === 'string' && hidden.has(w.from)) &&
            !(typeof w.to === 'string' && hidden.has(w.to))),
    };

    let circuit, board;
    try {
        circuit = engine.Circuit.fromJSON(JSON.parse(JSON.stringify(data)));
        board = circuit.board;
    } catch (e) { return { error: `netlist rejected: ${e.message.slice(0, 50)}` }; }

    const nets = circuit.nets || board.getNets?.() || [];
    if (!nets.length) return { error: 'bench has no nets — nothing in it is wired' };

    const parts = circuit.parts || [];
    // Resolve a control key ("button", "pot", or a part id) to the parts it names.
    // An MCU pin is an operating point too. "LED current (when on)" is a claim
    // about the bench with that pin driven, and driving it is one setPin call —
    // pinThevenin gives a pushpull pin a real Thevenin source, so the branch
    // solves exactly rather than being declined as "a firmware state". 120
    // claims across the MCU benches were unverified for want of this.
    if (controls.__pins) {
        const mcus = parts.filter(p => MCU_KIND.test(p.kind || ''));
        const wiredPins = (id) => {
            const out = [];
            for (const net of nets)
                for (const t of (net.terminals || []))
                    if (t.part === id) out.push(String(t.terminal));
            return out;
        };
        for (const m of mcus)
            // A `pins` param is a declaration, not the whole truth:
            // arduino-01-blink's board declares none at all and is wired to D13
            // through the netlist, so driving only the declared pins drives
            // nothing and the bench reads as dark in every state.
            for (const pin of ((m.params?.pins || []).length ? m.params.pins : wiredPins(m.id))) {
                try {
                    if (controls.__pins === 'input') board.setPin(pin, 'input', false);
                    else if (controls.__pins === 'quasi-high') board.setPin(pin, 'quasi', true);
                    else board.setPin(pin, 'pushpull', controls.__pins === 'high');
                } catch { /* a pin the model refuses is not fatal */ }
            }
    }
    for (const [selector, value] of Object.entries(controls)) {
        if (selector.startsWith('__')) continue;
        const targets = parts.filter(p => p.id === selector || p.kind === selector ||
            (selector === 'button' && (p.kind === 'button' || p.kind === 'switch' || p.kind === 'slide_switch')));
        for (const p of targets) {
            try { board.setControl(p.id, value); } catch { /* a control the model refuses is not fatal */ }
        }
    }

    try { board.advanceTo(BigInt(Math.max(1, Math.round(atMs * 1e6)))); }
    catch (e) { return { error: `solve threw: ${e.message.slice(0, 50)}` }; }

    const voltage = new Map();
    for (const net of nets) {
        const id = net.id || net.name;
        try {
            const v = board.nodeVoltage(id);
            if (Number.isFinite(v)) voltage.set(id, v);
        } catch { /* an unsolved node is absent, not zero */ }
    }
    if (!voltage.size) return { error: 'no node solved to a finite voltage' };

    const terminalsOf = (partId) => {
        const found = [];
        for (const net of nets)
            for (const t of (net.terminals || []))
                if (t.part === partId) found.push({ terminal: String(t.terminal), net: net.id || net.name });
        return found;
    };

    const current = new Map();   // "part.terminal" -> amps (signed, as the engine gives it)
    for (const p of parts) {
        for (const { terminal } of terminalsOf(p.id)) {
            let i;
            try { i = board.branchCurrent(p.id, terminal); } catch { continue; }
            if (Number.isFinite(i)) current.set(`${p.id}.${terminal}`, i);
        }
    }

    // ---- the measurands a claim could be naming ----
    const measurands = [];
    const add = (unit, kind, label, si) => { if (Number.isFinite(si)) measurands.push({ unit, kind, label, si, on: [] }); };

    const partsOnNet = new Map();
    for (const net of nets)
        partsOnNet.set(net.id || net.name, (net.terminals || []).map(t => t.part));
    const addOn = (unit, kind, label, si, on) => {
        if (!Number.isFinite(si)) return;
        measurands.push({ unit, kind, label, si, on: on || [] });
    };
    for (const [id, v] of voltage) addOn('volt', 'node', id, v, partsOnNet.get(id));

    for (const p of parts) {
        const ts = terminalsOf(p.id).filter(t => voltage.has(t.net));
        if (ts.length === 2) addOn('volt', 'drop', `across ${p.id}`, Math.abs(voltage.get(ts[0].net) - voltage.get(ts[1].net)), [p.id]);
        // A three-terminal part has three drops, and the documents name them:
        // V_BE, V_CE, V_EB, V_GS, V_DS. Emitting only two-terminal drops left
        // pc32-pnp-high-side's "V_EB = 0.01 V" with nothing to answer it, and
        // the document was right — 5.0000 V at the emitter against 4.9900 V at
        // the base is exactly the hundredth of a volt it claims.
        if (ts.length >= 3)
            for (let i = 0; i < ts.length; i++)
                for (let j = i + 1; j < ts.length; j++)
                    addOn('volt', 'terminals', `${p.id}.${ts[i].terminal}-${ts[j].terminal}`,
                        Math.abs(voltage.get(ts[i].net) - voltage.get(ts[j].net)), [p.id]);
        // A source's INTERNAL drop is its open-circuit volts minus its terminals.
        if (ts.length === 2 && typeof p.params?.volts === 'number' && typeof p.params?.rInternal === 'number')
            add('volt', 'internal', `inside ${p.id}`, Math.abs(p.params.volts - Math.abs(voltage.get(ts[0].net) - voltage.get(ts[1].net))));
    }

    // A BJT's or a MOSFET's terminal current is an EXTRACTION — solveMNA reads
    // it back out of the solved terminal voltages through the device's own knee
    // model rather than solving for it directly — and until bw-board a301937
    // those extractions were excluded from the measurands here, so no claim
    // about a base, collector, drain or source current could be checked at all.
    //
    // THE DECLINE THAT SAT HERE NAMED THE WRONG INVARIANT, and correcting the
    // record matters more than deleting it. It said the extraction "is not
    // KCL-consistent". Measured on bw-board 88e9668 — the revision it was
    // written against — the device's OWN terminals summed to zero to machine
    // precision in 11 of 11 samples (worst relative residual 0.0000 %). KCL at
    // the device always held. What did not hold was agreement with the NETWORK:
    // a saturated collector reported the beta*Ib its VCCS demanded rather than
    // what the external branch could carry, so pc32-pnp-high-side read 43 A
    // through a collector wired to a resistor carrying 2.772 mA. The quoted
    // observation was real; the diagnosis attached to it was not.
    //
    // The invariant that actually discriminates is therefore a device terminal
    // against THE BRANCH IT FEEDS, and it is now a gate of its own —
    // `test/device-branch-agreement.test.mjs`, which counts the disagreements
    // across every BJT/FET bench in the corpus at two operating points:
    //
    //   bw-board 88e9668  20 of 27 nets disagree     <- the pinned revision then
    //   bw-board 20283ab   7 of 27                   saturated collector arm
    //   bw-board b5c02b1   4 of 27                   PNP base junction restored
    //   bw-board a301937   3 of 27                   buzzer branch extractable
    //
    // The three that remain are ONE class and not a transistor defect at all: a
    // `gnd` part reports 0 A through its terminal while the emitter on the same
    // net carries 6.26 mA. That is a device model with no current readback, the
    // same class as `silent` below, and it is bw-engine's `device KCL-visibility`
    // lane. So these are measurands now, and the gate above holds them to the
    // branch they feed rather than to a promise made in a comment.
    let supplyA = null;
    for (const [k, i] of current) {
        const [pid, term] = k.split('.');
        const part = parts.find(p => p.id === pid);
        addOn('curr', 'branch', `through ${k}`, Math.abs(i), [pid]);
        if (part && SUPPLY_TERMINAL[part.kind] === term && Math.abs(i) > (supplyA ?? 0)) supplyA = Math.abs(i);
    }
    if (supplyA !== null) add('curr', 'supply', 'out of the supply', supplyA);

    // Power: drop x current, per part, and the whole bench off the rail.
    for (const p of parts) {
        const ts = terminalsOf(p.id).filter(t => voltage.has(t.net));
        if (ts.length !== 2) continue;
        const drop = Math.abs(voltage.get(ts[0].net) - voltage.get(ts[1].net));
        const i = current.get(`${p.id}.${ts[0].terminal}`);
        if (Number.isFinite(i)) addOn('power', 'part', `in ${p.id}`, drop * Math.abs(i), [p.id]);
    }
    if (supplyA !== null) {
        const rail = Math.max(...voltage.values());
        add('power', 'total', 'delivered by the supply', rail * supplyA);
    }

    // A device model that does not implement branchCurrents reports zero
    // through every terminal while the bench plainly draws current — the relay
    // coil in pc38-relay-changeover is 25 mA that reads as 0. Name those kinds
    // so a claim about them is declined as unreadable rather than contradicted.
    // solveMNA computes branch currents natively for exactly these kinds; a
    // zero anywhere else may be a device model with no branchCurrents hook
    // rather than a branch that is genuinely off.
    const NATIVE = new Set(['resistor', 'led', 'diode', 'zener', 'npn', 'pnp', 'nmos', 'pmos', 'vcc', 'vsource', 'battery', 'gnd', 'potentiometer', 'ldr', 'ntc', 'capacitor', 'inductor']);
    const silent = new Set();
    const benchLive = [...current.values()].some(i => Math.abs(i) > 1e-6);
    for (const p of parts) {
        if (NATIVE.has(p.kind)) continue;
        const ts = terminalsOf(p.id);
        if (ts.length < 2) continue;
        const anyCurrent = ts.some(t => Math.abs(current.get(`${p.id}.${t.terminal}`) ?? 0) > 1e-9);
        if (!anyCurrent && benchLive) silent.add(p.kind);
    }

    // A net's throughput — the current KCL sends through it — is what a
    // "total parallel branch current" names, and no single branch carries it.
    //
    // HALF THE SUM OF THE MAGNITUDES, not the sum of the positive ones. The
    // engine's branchCurrent sign is a property of the PART, not of the node:
    // pc78-belastete-quelle's net_19 has `resistor_7.b = +12.0113 mA` and
    // `led_5.anode = +12.0113 mA`, the same 12 mA seen from both ends, and
    // adding the positives reported 24.0226 mA of throughput through a branch
    // carrying 12. That is not a rounding difference, it is a number that
    // exists nowhere in the circuit — and it is how a mutation escaped: pc78's
    // original, wrong "I = 9 / 412 = 21.8 mA" agreed with the phantom 24.0226
    // to within this gate's 10 % band, so restoring the defect this lane
    // repaired left the suite GREEN. Half the sum of |i| is the throughput at
    // any node where KCL holds, whatever the sign convention, and it gives
    // 12.0113 here and leaves every net that was already right unchanged.
    for (const net of nets) {
        const id = net.id || net.name;
        let sum = 0, seenAny = false;
        for (const t of (net.terminals || [])) {
            const i = current.get(`${t.part}.${t.terminal}`);
            if (!Number.isFinite(i)) continue;
            sum += Math.abs(i);
            seenAny = true;
        }
        if (seenAny && sum / 2 > 0) addOn('curr', 'net', `through ${id}`, sum / 2, partsOnNet.get(id));
    }

    // Two element drops that add: "the missing 1.51 V is two diode drops".
    // Only the DISTINCT drops, and only in pairs — enumerating every subset of
    // a large bench would make the voltage check match almost anything, which
    // is the opposite of a check.
    const twoTerm = parts.map(p => ({ p, ts: terminalsOf(p.id).filter(t => voltage.has(t.net)) }))
        .filter(x => x.ts.length === 2);
    for (let i = 0; i < twoTerm.length; i++)
        for (let j = i + 1; j < twoTerm.length; j++) {
            if (!twoTerm[i].ts.some(a => twoTerm[j].ts.some(b => a.net === b.net))) continue;
            const d = (x) => Math.abs(voltage.get(x.ts[0].net) - voltage.get(x.ts[1].net));
            addOn('volt', 'series', `across ${twoTerm[i].p.id} + ${twoTerm[j].p.id}`,
                d(twoTerm[i]) + d(twoTerm[j]), [twoTerm[i].p.id, twoTerm[j].p.id]);
        }

    const drops = [...new Set(measurands.filter(m => m.kind === 'drop').map(m => Number(m.si.toPrecision(6))))];
    if (drops.length <= 8)
        for (let i = 0; i < drops.length; i++)
            for (let j = i; j < drops.length; j++)
                add('volt', 'sum', `two element drops (${drops[i]} + ${drops[j]})`, drops[i] + drops[j]);

    // The power a branch takes off the rail, not only the bench total.
    if (supplyA !== null) {
        const rail = Math.max(...voltage.values());
        for (const m of measurands.filter(x => x.kind === 'net' || x.kind === 'branch'))
            add('power', 'branch', `${rail} V x ${m.label}`, rail * m.si);
    }

    return { voltage, current, measurands, parts, nets, supplyA, silent, board };
}

/** Every resistance/capacitance/inductance/forward-drop/supply the bench declares. */
const RES_KEYS = ['ohms', 'rLight', 'rDark', 'rCold', 'rHot', 'coilR', 'windingR', 'rSeries', 'rz', 'rInternal'];
const POOLS = new Map();
export function declaredPool (dir) {
    if (POOLS.has(dir)) return POOLS.get(dir);
    const path = join(EXAMPLES, dir, 'circuit.json');
    let pool = null;
    if (existsSync(path)) {
        try {
            const data = JSON.parse(readFileSync(path, 'utf8'));
            pool = { ohm: new Set(), cap: new Set(), ind: new Set(), vf: new Set(), supply: new Set() };
            for (const p of data.parts || []) {
                const q = p.params || {};
                for (const k of RES_KEYS) if (typeof q[k] === 'number') pool.ohm.add(q[k]);
                if (typeof q.farads === 'number') pool.cap.add(q.farads);
                if (typeof q.henrys === 'number') pool.ind.add(q.henrys);
                for (const k of ['vf', 'vz', 'vbe', 'vth']) if (typeof q[k] === 'number') pool.vf.add(q[k]);
                for (const k of ['volts', 'railHigh', 'railLow', 'amplitude', 'offset']) if (typeof q[k] === 'number') pool.supply.add(q[k]);
                // A part's default is as much a declaration as an explicit value.
                if (p.kind === 'led' && q.vf === undefined) pool.vf.add(2.0);
                if (p.kind === 'diode' && q.vf === undefined) pool.vf.add(0.7);
            }
            if (typeof data.vcc === 'number') pool.supply.add(data.vcc);
            // A `vcc` part with no `volts` is not undeclared: BoardImpl's
            // constructor default IS the declaration, and 51-555-astable's
            // "VCC (5 V)" is right about a bench that never writes the 5 down.
            else if ((data.parts || []).some(p => p.kind === 'vcc')) pool.supply.add(5);
        } catch { pool = null; }
    }
    POOLS.set(dir, pool);
    return pool;
}
