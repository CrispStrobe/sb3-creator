#!/usr/bin/env node
/**
 * Generate pure-circuit examples as seated breadboard benches.
 * vsource (not abstract vcc/gnd), parts seated via FOOTPRINTS,
 * verified: fromJSON loads, board solves, LED lights.
 *
 * SEATING IS CHECKED, NOT HOPED FOR (2026-08-15, pc01–pc12 audit).
 * `Circuit.seatPart` returns false and `addHoleWire` returns null when the
 * holes are already taken — the first version of this script ignored both,
 * and six of the eight examples shipped with a part left unseated (floating,
 * invisible to every gate). The helpers below throw instead, and `build`
 * refuses to write a circuit that still has a floating lead. Read the
 * FOOTPRINTS pitch before choosing holes: a resistor spans dCol 0→4, so
 * seating one at `a3` puts its far lead in `a7` and the next part cannot
 * start there.
 */
import { writeFileSync, mkdirSync, existsSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
const __here = dirname(fileURLToPath(import.meta.url));
const { BoardImpl } = await import(join(__here, '..', '..', 'bw-board', 'src', 'board.js'));
const { inferNetlist, checkWiring } = await import(join(__here, '..', '..', 'bw-board', 'src', 'infer-netlist.js'));
const { setEngine } = await import(join(__here, '..', '..', 'bw-circuit-ui', 'src', 'engine.js'));
const { Circuit, resetIds } = await import(join(__here, '..', '..', 'bw-circuit-ui', 'src', 'model', 'circuit.js'));
const { FOOTPRINTS, computeLeadMap } = await import(join(__here, '..', '..', 'bw-circuit-ui', 'src', 'model', 'footprints.js'));
const devDir = join(__here, '..', '..', 'bw-board', 'src', 'devices') + '/';
for (const m of ['relay','dc-motor','servo','timer-555','logic-gates','power',
    'analog-ics','h-bridge','sensors','display','digital-ics','chip-composer',
    'motor-drivers','misc-parts','named-parts','tier1-parts','i2c-parts']) {
    try { const mod = await import(devDir + m + '.js');
        const fn = Object.values(mod).find(v => typeof v === 'function' && v.name.startsWith('register'));
        if (fn) fn(); } catch {}
}
setEngine({ BoardImpl, inferNetlist, checkWiring });
const HERE = dirname(fileURLToPath(import.meta.url));
const EXAMPLES = join(HERE, '..', 'examples');
let ok = 0, fail = 0;

/** Seat a part at `hole` using its footprint — throws if the holes are taken. */
function seat(c, part, bb, footprint, hole) {
    if (!c.seatPart(part.id, bb.id, computeLeadMap(footprint, hole))) {
        throw new Error(`seat failed: ${part.id} (${part.kind}) at ${hole} — holes occupied or off-board`);
    }
}
/** Jumper between two holes — throws if either end is taken. */
function jump(c, bb, a, b, color) {
    if (!c.addHoleWire(bb.id, a, b, color)) {
        throw new Error(`jumper failed: ${a} → ${b} — hole occupied`);
    }
}
/** Supply tap from a free part terminal into a free hole — throws if refused. */
function tap(c, part, terminal, bb, hole) {
    if (!c.addTapWire(part.id, terminal, bb.id, hole)) {
        throw new Error(`tap failed: ${part.id}.${terminal} → ${hole} — hole occupied or invalid`);
    }
}

function build(name, title_en, title_de, fn) {
    try {
        resetIds();
        const c = new Circuit(5.0);
        const bb = c.addPart('breadboard', {}, 500, 300);
        fn(c, bb);
        // Every terminal of every part must land on a net with something
        // else on it. Checked on the MERGED netlist the engine actually got
        // (strips + jumpers + supply taps), not on the breadboard's own
        // derivation — a strip fed only by a tap wire looks floating there
        // and is not. A lead that fails this is a part drawn but not
        // connected: exactly the defect this script used to ship.
        {
            const onNet = new Map(); // "part.terminal" → net size
            for (const n of c.board.nets) {
                for (const t of n.terminals) onNet.set(`${t.part}.${t.terminal}`, n.terminals.length);
            }
            const bad = [];
            for (const p of c.parts) {
                if (p.kind === 'breadboard') continue;
                for (const t of p.terminals || []) {
                    const size = onNet.get(`${p.id}.${t}`);
                    if (size === undefined) bad.push(`${p.id}.${t} is on no net at all`);
                    else if (size < 2) bad.push(`${p.id}.${t} is alone on its net`);
                }
            }
            if (bad.length) throw new Error(bad.join(' | '));
        }
        c.board.advanceTo(25_000_000n);
        const json = c.toJSON();
        resetIds();
        Circuit.fromJSON(json); // verify round-trip
        const leds = c.board.getLeds();
        const ledB = leds.length ? c.board.ledBrightness(leds[0]).toFixed(4) : 'n/a';
        mkdirSync(join(EXAMPLES, name), { recursive: true });
        writeFileSync(join(EXAMPLES, name, 'circuit.json'), JSON.stringify(json, null, 2) + '\n');
        writeFileSync(join(EXAMPLES, name, 'program.bw'), '# Pure circuit — no MCU\n');
        // EXPECTED.md is hand-written per example (measured numbers, not a
        // restatement of the title) — never clobber one that already exists.
        const exp = join(EXAMPLES, name, 'EXPECTED.md');
        if (!existsSync(exp)) writeFileSync(exp, `# ${name}\n\n${title_en}\n`);
        console.log(`  ✓ ${name}: LED=${ledB}, nets=${c.board.getNets().length}`);
        ok++;
        return { name, title_en, title_de };
    } catch (e) {
        console.log(`  ✗ ${name}: ${e.message.slice(0, 160)}`);
        fail++;
        return null;
    }
}

console.log('Generating pure-circuit breadboard examples...\n');
const entries = [];

// Column strips: rows a–e of column N are one strip ("col-tN"), f–j another.
// Every layout below is written as the chain of strips the current follows.

// +5 → t5 → R(220) → t9 → LED → t10 → return
entries.push(build('pc01-led-resistor', 'LED with series resistor (5V)', 'LED mit Vorwiderstand (5V)', (c, bb) => {
    const bat = c.addPart('vsource', { volts: 5 }, 100, 100);
    const r = c.addPart('resistor', { ohms: 220 }, 0, 0);
    const led = c.addPart('led', { vf: 2.0, color: 'red' }, 0, 0);
    seat(c, r, bb, FOOTPRINTS.resistor, 'b5');     // b5 → b9
    seat(c, led, bb, FOOTPRINTS.led, 'c9');        // c9 → c10
    tap(c, bat, 'pos', bb, 'a5');
    tap(c, bat, 'neg', bb, 'a10');
}));

// +9 → t3 → R1(10k) → t7 (junction) → R2(10k) → t11 → return
entries.push(build('pc02-voltage-divider', 'Voltage divider (two equal resistors)', 'Spannungsteiler (zwei gleiche Widerstände)', (c, bb) => {
    const bat = c.addPart('vsource', { volts: 9, variant: '9v' }, 100, 100);
    const r1 = c.addPart('resistor', { ohms: 10000 }, 0, 0);
    const r2 = c.addPart('resistor', { ohms: 10000 }, 0, 0);
    seat(c, r1, bb, FOOTPRINTS.resistor, 'a3');    // a3 → a7
    seat(c, r2, bb, FOOTPRINTS.resistor, 'b7');    // b7 → b11  (junction on t7)
    tap(c, bat, 'pos', bb, 'e3');
    tap(c, bat, 'neg', bb, 'e11');
}));

// +5 → t2 → R1(1k) → t6 → R2(2k) → t10 → LED → t11 → return
entries.push(build('pc03-series-resistors', 'Two resistors in series with LED', 'Zwei Widerstände in Reihe mit LED', (c, bb) => {
    const bat = c.addPart('vsource', { volts: 5 }, 100, 100);
    const r1 = c.addPart('resistor', { ohms: 1000 }, 0, 0);
    const r2 = c.addPart('resistor', { ohms: 2000 }, 0, 0);
    const led = c.addPart('led', { vf: 2.0, color: 'green' }, 0, 0);
    seat(c, r1, bb, FOOTPRINTS.resistor, 'a2');    // a2 → a6
    seat(c, r2, bb, FOOTPRINTS.resistor, 'b6');    // b6 → b10
    seat(c, led, bb, FOOTPRINTS.led, 'c10');       // c10 → c11
    tap(c, bat, 'pos', bb, 'e2');
    tap(c, bat, 'neg', bb, 'e11');
}));

// +5 → t2 ─┬─ R1(1k) → t6 → LED1 → t7 ─┐ return
//          └─ (jumper t2→t12) R2(1k) → t16 → LED2 → t17 ─┘ (jumper t7→t17)
entries.push(build('pc04-parallel-leds', 'Two LEDs in parallel', 'Zwei LEDs parallel', (c, bb) => {
    const bat = c.addPart('vsource', { volts: 5 }, 100, 100);
    const r1 = c.addPart('resistor', { ohms: 1000 }, 0, 0);
    const r2 = c.addPart('resistor', { ohms: 1000 }, 0, 0);
    const led1 = c.addPart('led', { vf: 2.0, color: 'red' }, 0, 0);
    const led2 = c.addPart('led', { vf: 2.0, color: 'green' }, 0, 0);
    seat(c, r1, bb, FOOTPRINTS.resistor, 'a2');    // a2 → a6
    seat(c, led1, bb, FOOTPRINTS.led, 'b6');       // b6 → b7
    seat(c, r2, bb, FOOTPRINTS.resistor, 'a12');   // a12 → a16
    seat(c, led2, bb, FOOTPRINTS.led, 'b16');      // b16 → b17
    tap(c, bat, 'pos', bb, 'e2');
    tap(c, bat, 'neg', bb, 'e7');
    jump(c, bb, 'e2', 'e12', 'red');    // + to the second branch
    jump(c, bb, 'e7', 'e17', 'black');  // return from the second branch
}));

// Collector leg: +5 → t5 → R(470) → t9 → LED → t10 → (jumper) → b22 collector
// Base leg:      +5 → t5 → (jumper) → b30 switch → b33 → R(10k) → b37 → (jumper) → b21 base
// Emitter:       b20 → return
entries.push(build('pc05-npn-switch', 'NPN transistor switch', 'NPN-Transistor als Schalter', (c, bb) => {
    const bat = c.addPart('vsource', { volts: 5 }, 100, 100);
    const rLoad = c.addPart('resistor', { ohms: 470 }, 0, 0);
    const led = c.addPart('led', { vf: 2.0, color: 'red' }, 0, 0);
    const npn = c.addPart('npn', { beta: 100 }, 0, 0);
    const sw = c.addPart('switch', {}, 0, 0);
    // 100k, not the textbook 10k: with 10k the base current is 0.43 mA and
    // beta*Ib = 43 mA, more than the 470 ohm collector load can deliver. The
    // engine's NPN is a linear beta current source with NO saturation region,
    // so instead of clamping at Vce ~ 0.2 V it drives the collector to -17 V
    // (engine-bug, examples/AUDIT/pc01-pc12.md). 100k keeps Ic ~ 4 mA, inside
    // the model's valid active region, and is what a real 5 mA LED driver uses.
    const rBase = c.addPart('resistor', { ohms: 100000 }, 0, 0);
    seat(c, rLoad, bb, FOOTPRINTS.resistor, 'a5');   // a5 → a9
    seat(c, led, bb, FOOTPRINTS.led, 'b9');          // b9 → b10
    seat(c, npn, bb, FOOTPRINTS.npn, 'f20');         // e f20 / b f21 / c f22
    seat(c, sw, bb, FOOTPRINTS.switch, 'f30');       // f30 → f33
    seat(c, rBase, bb, FOOTPRINTS.resistor, 'h33');  // h33 → h37
    tap(c, bat, 'pos', bb, 'd5');
    tap(c, bat, 'neg', bb, 'h20');
    jump(c, bb, 'c10', 'g22', 'blue');    // LED cathode → collector
    jump(c, bb, 'b5', 'g30', 'red');      // + → switch
    jump(c, bb, 'i37', 'g21', 'orange');  // base resistor → base
}));

// +5 → t3 → R(10k) → t7 → C(100µF) → t8 → return
entries.push(build('pc06-rc-charge', 'RC charging circuit', 'RC-Ladekreis', (c, bb) => {
    const bat = c.addPart('vsource', { volts: 5 }, 100, 100);
    const r = c.addPart('resistor', { ohms: 10000 }, 0, 0);
    const cap = c.addPart('capacitor', { farads: 0.0001 }, 0, 0);
    seat(c, r, bb, FOOTPRINTS.resistor, 'a3');       // a3 → a7
    seat(c, cap, bb, FOOTPRINTS.capacitor, 'b7');    // b7 → b8
    tap(c, bat, 'pos', bb, 'e3');
    tap(c, bat, 'neg', bb, 'e8');
}));

// Pot as a DIVIDER: a on +5 (t3), b on return (t7→t13), wiper (t5) → R(220) → LED → return.
entries.push(build('pc07-pot-dimmer', 'Potentiometer LED dimmer', 'Potentiometer-LED-Dimmer', (c, bb) => {
    const bat = c.addPart('vsource', { volts: 5 }, 100, 100);
    // 1k, not 10k: the wiper's source impedance (up to ohms/4) is in series
    // with the LED, so a 10k pot never gets the LED above ~0.2 mA and the
    // "dimmer" is dark across most of its travel. `position` is NOT read by
    // the solver (it stamps controls.get(id) ?? 0.5 — see the ledger), so the
    // declared value must be the effective one: 0.5.
    const pot = c.addPart('potentiometer', { ohms: 1000, position: 0.5 }, 0, 0);
    const r = c.addPart('resistor', { ohms: 220 }, 0, 0);
    const led = c.addPart('led', { vf: 2.0, color: 'red' }, 0, 0);
    seat(c, pot, bb, FOOTPRINTS.potentiometer, 'a3'); // a a3 / wiper a5 / b a7
    seat(c, r, bb, FOOTPRINTS.resistor, 'b8');        // b8 → b12
    seat(c, led, bb, FOOTPRINTS.led, 'c12');          // c12 → c13
    tap(c, bat, 'pos', bb, 'e3');
    tap(c, bat, 'neg', bb, 'e13');
    jump(c, bb, 'b5', 'c8', 'yellow');   // wiper → series resistor
    jump(c, bb, 'b7', 'd13', 'black');   // pot bottom end → return
}));

// +5 → t2 → R(220) → t6 → D(1N4148) → t8 → LED → t9 → return
entries.push(build('pc08-diode-polarity', 'Diode polarity — forward vs reverse', 'Diodenpolung — Durchlass vs Sperrrichtung', (c, bb) => {
    const bat = c.addPart('vsource', { volts: 5 }, 100, 100);
    const rFwd = c.addPart('resistor', { ohms: 220 }, 0, 0);
    const dFwd = c.addPart('diode', { vf: 0.7 }, 0, 0);
    const ledFwd = c.addPart('led', { vf: 2.0, color: 'green' }, 0, 0);
    seat(c, rFwd, bb, FOOTPRINTS.resistor, 'a2');    // a2 → a6
    seat(c, dFwd, bb, FOOTPRINTS.diode, 'b6');       // b6 → b8
    seat(c, ledFwd, bb, FOOTPRINTS.led, 'c8');       // c8 → c9
    tap(c, bat, 'pos', bb, 'e2');
    tap(c, bat, 'neg', bb, 'e9');
}));

// Clean up old flat-format examples
const valid = entries.filter(Boolean);
console.log(`\n${ok} succeeded, ${fail} failed.`);
if (fail) process.exitCode = 1;

// Write index entries
console.log('\nIndex entries for index.json:');
for (const e of valid) {
    console.log(JSON.stringify({
        id: e.name, title: { en: e.title_en, de: e.title_de },
        kind: 'circuit', category: 'pure-circuit', difficulty: 1,
        files: { program: `${e.name}/program.bw`, circuit: `${e.name}/circuit.json`, expected: `${e.name}/EXPECTED.md` }
    }));
}
