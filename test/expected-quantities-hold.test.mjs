/**
 * The numbers in EXPECTED.md prose, held against the bench and against
 * themselves.
 *
 * THE DEFECT CLASS
 * ----------------
 * `test/assert-physics.test.mjs` checks the fenced ```assert blocks. Most of
 * what an EXPECTED.md claims is not in one: it is prose, hand-derived when the
 * example was written, and the corpus has moved under it repeatedly. Two claims
 * of that kind survived every gate until this sweep:
 *
 *   23-voltage-regulator could not regulate. Its "zener" is declared
 *   `kind: "diode"` with `vf: 5.1`, and a forward diode does not clamp in
 *   reverse — so no current took the zener branch at all, both resistors
 *   carried the SAME 8.642 mA, and the document's 6.60 mA LED current was
 *   unreachable. Declared as `kind: "zener"` with `vz: 5.1` the bench measures
 *   11.739 mA through R1 and 6.513 mA through R2, against the document's
 *   hand-derived 11.82 and 6.60. The document was right about all three
 *   numbers, including the zener current it obtains by subtraction.
 *
 *   arduino-01-blink claimed "1 Hz (period = 2 s)", which is self-contradictory
 *   and also contradicts its program: `wait 1 seconds` twice is a 2 s period and
 *   0.5 Hz. Its own timing table already showed ON at t=0 and ON again at t=2.
 *
 * Neither is exotic. Both are a number that was true when typed.
 *
 * HOW THE CURRENT IS OBTAINED
 * ---------------------------
 * assert-physics skips `current` assertions entirely — "current readback not yet
 * wired" — so no current claim anywhere in the corpus has ever been checked.
 * Nothing new is needed in the engine: a resistor's current is
 * (V(a) - V(b)) / ohms from the node voltages the solver already gives, and in
 * an LED branch the series resistor's current IS the LED's. Derived that way,
 * 41-pot-as-dimmer reads 0.188 mA — the number its EXPECTED.md hand-derived
 * after the 2.3 mA claim was found wrong, reproduced here independently.
 *
 * WHAT IT DOES NOT CHECK, AND WHY
 * -------------------------------
 * Only STATIC benches. An MCU bench's current depends on firmware state and an
 * oscillator's on the instant you sample; a single solve cannot speak for
 * either, and pretending otherwise produces confident wrong numbers. Those are
 * counted and reported as not-compared rather than passed over in silence.
 */
import { describe, test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, readdirSync, existsSync, statSync } from 'node:fs';
import { join } from 'node:path';
import { pathToFileURL } from 'node:url';
import { requireSiblings, siblingGuardTest } from './helpers/siblings.mjs';

const ROOT = join(import.meta.dirname, '..');
const EXAMPLES = join(ROOT, 'examples');
const dirs = readdirSync(EXAMPLES)
    .filter(d => d !== 'AUDIT' && statSync(join(EXAMPLES, d)).isDirectory()).sort();

const gate = requireSiblings('bw-board', 'bw-circuit-ui');
siblingGuardTest(gate, 'the EXPECTED.md quantity checks');
const SKIP = gate.skip || false;

// ---------- claims that need no engine ----------

const toSeconds = (v, u) => u === 'ms' ? v / 1000 : (u === 'µs' || u === 'us') ? v / 1e6 : v;
const toHertz = (v, u) => u === 'kHz' ? v * 1000 : u === 'MHz' ? v * 1e6 : v;

describe('EXPECTED.md quantities agree with each other and with the program', () => {
    test('a frequency and a period stated together are reciprocals', () => {
        const bad = [];
        let pairs = 0;
        for (const dir of dirs) {
            const path = join(EXAMPLES, dir, 'EXPECTED.md');
            if (!existsSync(path)) continue;
            for (const line of readFileSync(path, 'utf8').split('\n')) {
                const f = line.match(/([\d.]+)\s*(kHz|MHz|Hz)\b/);
                const t = line.match(/(?:period|periode)\s*[=:]?\s*~?([\d.]+)\s*(ms|µs|us|s)\b/i);
                if (!f || !t) continue;
                pairs++;
                const hz = toHertz(parseFloat(f[1]), f[2]);
                const seconds = toSeconds(parseFloat(t[1]), t[2]);
                const implied = 1 / seconds;
                if (Math.abs(hz - implied) / Math.max(hz, implied) > 0.02)
                    bad.push(`${dir}: "${line.trim()}" — ${hz} Hz is a ${(1000 / hz).toFixed(0)} ms period, `
                        + `but the line says ${(seconds * 1000).toFixed(0)} ms`);
            }
        }
        assert.ok(pairs >= 5, `only ${pairs} frequency+period pairs found — the scan is broken`);
        assert.deepEqual(bad.sort(), [], 'a document disagreeing with itself');
    });

    test('a stated blink frequency matches the program that produces it', () => {
        const bad = [];
        let checked = 0;
        for (const dir of dirs) {
            const md = join(EXAMPLES, dir, 'EXPECTED.md');
            const bw = join(EXAMPLES, dir, 'program.bw');
            if (!existsSync(md) || !existsSync(bw)) continue;
            const waits = [...readFileSync(bw, 'utf8')
                .matchAll(/^\s*wait\s+([\d.]+)\s+seconds?\s*$/gim)].map(m => parseFloat(m[1]));
            // Only the unambiguous shape: exactly two equal waits, on then off.
            if (waits.length !== 2 || waits[0] !== waits[1]) continue;
            const m = readFileSync(md, 'utf8').match(/\*\*Frequency:?\*\*:?\s*~?([\d.]+)\s*(kHz|MHz|Hz)\b/i);
            if (!m) continue;
            checked++;
            const claimed = toHertz(parseFloat(m[1]), m[2]);
            const actual = 1 / (waits[0] * 2);
            if (Math.abs(claimed - actual) / Math.max(claimed, actual) > 0.02)
                bad.push(`${dir}: EXPECTED says ${claimed} Hz; the program waits ${waits[0]} s twice, `
                    + `a ${waits[0] * 2} s period = ${actual} Hz`);
        }
        assert.ok(checked >= 5, `only ${checked} two-wait blink programs state a Frequency`);
        assert.deepEqual(bad.sort(), [], 'a document disagreeing with its program');
    });

    test('a zener declares its breakdown voltage, and a diode is not a zener in disguise', () => {
        // Both halves were real. 23-voltage-regulator declared its zener as a
        // `diode` with vf 5.1 and therefore never clamped; 39-zener-clamp and
        // pc18-zener-clamp put the breakdown voltage in `vf`, the FORWARD drop,
        // and were right only because those benches never forward-bias it.
        const bad = [];
        for (const dir of dirs) {
            for (const file of readdirSync(join(EXAMPLES, dir))) {
                if (!/^circuit.*\.json$/.test(file)) continue;
                let data;
                try { data = JSON.parse(readFileSync(join(EXAMPLES, dir, file), 'utf8')); } catch { continue; }
                for (const part of data.parts || []) {
                    const p = part.params || {};
                    if (part.kind === 'zener' && p.vz === undefined)
                        bad.push(`${dir}/${file}: zener ${part.id} declares no vz (vf=${p.vf}) — mna reads vz for the breakdown`);
                    if (part.kind === 'zener' && p.vf !== undefined && p.vf > 1.2)
                        bad.push(`${dir}/${file}: zener ${part.id} has vf=${p.vf}; that is a breakdown voltage in the forward-drop field`);
                    if (part.kind === 'diode' && (p.vf ?? 0.7) > 1.2)
                        bad.push(`${dir}/${file}: diode ${part.id} has vf=${p.vf}; a forward diode does not clamp — declare kind "zener" with vz`);
                }
            }
        }
        assert.deepEqual(bad.sort(), [], 'a part that cannot do what its document says');
    });
});

// ---------- claims that need a solve ----------

describe('EXPECTED.md currents match the bench', { skip: SKIP }, () => {
    const VISUAL_ONLY = new Set(['label', 'wire_jumper']);
    let Circuit, ready = false;

    test('the engine loads', async () => {
        const board = pathToFileURL(gate.paths['bw-board'] + '/');
        const cui = pathToFileURL(gate.paths['bw-circuit-ui'] + '/');
        const { BoardImpl } = await import(new URL('src/board.js', board).href);
        const { inferNetlist, checkWiring } = await import(new URL('src/infer-netlist.js', board).href);
        const { registerAllDevices } = await import(new URL('src/register-all.js', board).href);
        const { getDevice } = await import(new URL('src/devices.js', board).href);
        const { setEngine } = await import(new URL('src/engine.js', cui).href);
        ({ Circuit } = await import(new URL('src/model/circuit.js', cui).href));
        registerAllDevices();
        setEngine({ BoardImpl, inferNetlist, checkWiring, getDevice });
        ready = true;
        assert.ok(Circuit);
    });

    /** mA through every resistor, from the node voltages the solver gives. */
    const resistorCurrents = (dir) => {
        const path = join(EXAMPLES, dir, 'circuit.json');
        const data = JSON.parse(readFileSync(path, 'utf8'));
        const hidden = new Set(data.parts.filter(p => VISUAL_ONLY.has(p.kind)).map(p => p.id));
        data.parts = data.parts.filter(p => !VISUAL_ONLY.has(p.kind));
        data.wires = (data.wires || []).filter(w =>
            !(typeof w.from === 'string' && hidden.has(w.from)) &&
            !(typeof w.to === 'string' && hidden.has(w.to)));
        const circuit = Circuit.fromJSON(data);
        const board = circuit.board;
        if (!(board.getNets?.() || []).length) return null;
        board.advanceTo(2_000_000n);
        const netOf = (part, terminal) => {
            for (const net of (circuit.nets || board.getNets()))
                for (const t of (net.terminals || []))
                    if (t.part === part && String(t.terminal) === terminal) return net.id || net.name;
            return null;
        };
        const out = [];
        for (const part of circuit.parts || []) {
            if (part.kind !== 'resistor') continue;
            const ohms = part.params?.ohms;
            const a = netOf(part.id, 'a'), b = netOf(part.id, 'b');
            if (!ohms || !a || !b) continue;
            try { out.push(Math.abs(board.nodeVoltage(a) - board.nodeVoltage(b)) / ohms * 1000); } catch { /* unsolved */ }
        }
        return out;
    };

    /** The claimed milliamps on a "**… current …:**" line: after the last `=`, else the first value. */
    const claimedMilliamps = (md) => {
        for (const line of md.split('\n')) {
            const label = line.match(/^- \*\*([^*]*current[^*]*)\*\*:?(.*)$/i);
            if (!label) continue;
            // Currents that are not the load branch, or are explicitly bounds.
            if (/base|collector|stall|supply|total|max|min|peak|valley|trough|chip|per-port|limit/i.test(label[1])) continue;
            const rhs = label[2];
            const tail = rhs.includes('=') ? rhs.slice(rhs.lastIndexOf('=')) : rhs;
            const v = tail.match(/([\d.]+)\s*mA\b/);
            if (v) return { mA: parseFloat(v[1]), line: line.trim() };
        }
        return null;
    };

    test('every prose current claim on a static bench matches a resistor in it', () => {
        assert.ok(ready, 'engine did not load');
        const off = [], notCompared = [];
        let claims = 0, compared = 0;
        for (const dir of dirs) {
            const md = join(EXAMPLES, dir, 'EXPECTED.md');
            if (!existsSync(md)) continue;
            const claim = claimedMilliamps(readFileSync(md, 'utf8'));
            if (!claim) continue;
            claims++;
            const circuit = join(EXAMPLES, dir, 'circuit.json');
            if (!existsSync(circuit)) { notCompared.push(`${dir}: no authored circuit.json`); continue; }
            const data = JSON.parse(readFileSync(circuit, 'utf8'));
            // An MCU bench's current depends on firmware state, and an
            // oscillator's on the sampling instant. One solve speaks for
            // neither, so say so instead of comparing.
            if ((data.parts || []).some(p => /mcu|arduino_|pi_pico|attiny|atmega|stc/i.test(p.kind))) {
                notCompared.push(`${dir}: MCU bench — the current depends on firmware state`); continue;
            }
            if ((data.parts || []).some(p => /555|vsource/i.test(p.kind))) {
                notCompared.push(`${dir}: oscillating bench — one solve is one instant`); continue;
            }
            let currents;
            try { currents = resistorCurrents(dir); } catch (e) { notCompared.push(`${dir}: ${e.message.slice(0, 40)}`); continue; }
            if (!currents) { notCompared.push(`${dir}: netlist rejected`); continue; }
            const live = currents.filter(v => isFinite(v) && v > 1e-4);
            if (!live.length) { notCompared.push(`${dir}: no resistor carries current`); continue; }
            compared++;
            const closest = live.reduce((a, b) => Math.abs(b - claim.mA) < Math.abs(a - claim.mA) ? b : a);
            const rel = Math.abs(closest - claim.mA) / Math.max(claim.mA, 1e-6);
            // 10%: the documents derive from an ideal Vf while the engine uses a
            // junction model, so a few percent is the two models disagreeing,
            // not the document being wrong.
            if (rel > 0.10)
                off.push(`${dir}: "${claim.line.slice(0, 70)}" claims ${claim.mA} mA; the bench's resistors `
                    + `carry [${live.map(v => v.toFixed(3)).join(', ')}] mA`);
        }
        // Floors: this must actually be comparing things.
        assert.ok(claims >= 30, `only ${claims} prose current claims found — the extractor is broken`);
        assert.ok(compared >= 10, `only ${compared} of ${claims} claims were compared — the solve path is broken`);
        assert.deepEqual(off.sort(), [],
            `${compared} of ${claims} prose current claims were compared against a solve; `
            + `${notCompared.length} could not be (MCU or oscillating benches). These disagree:`);
    });
});
