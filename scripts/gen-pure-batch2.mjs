#!/usr/bin/env node
/**
 * Generate pure-circuit examples — batch 2.
 * Mix of direct-wired (no breadboard) and breadboard (mini/half).
 * No gnd part needed: engine ec635a0 grounds vsource neg.
 */
import { writeFileSync, mkdirSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { injectEngine } from './lib/engine-surface.mjs';
const __here = dirname(fileURLToPath(import.meta.url));
// The engine surface production injects, applied in one place. This script
// used to import three keys by hand and register a HAND-LISTED SUBSET of the
// device models, so it generated benches against an engine the app does not
// build. See scripts/lib/engine-surface.mjs.
const { Circuit, resetIds, cuiURL } = await injectEngine();
// Footprints come from the SAME checkout the engine did — importing them by a
// hardcoded `../../bw-circuit-ui` while the engine honoured BW_CIRCUIT_UI is
// how a generator seats parts by one repo's pitch and solves them with another.
const { FOOTPRINTS, computeLeadMap } = await import(new URL('src/model/footprints.js', cuiURL).href);
const HERE = dirname(fileURLToPath(import.meta.url));
const EXAMPLES = join(HERE, '..', 'examples');
let ok = 0, fail = 0;
const entries = [];

function build(name, titleEn, titleDe, difficulty, fn) {
    try {
        resetIds();
        const c = new Circuit(5.0);
        fn(c);
        c.board.advanceTo(25_000_000n);
        const json = c.toJSON();
        resetIds();
        Circuit.fromJSON(json);
        const leds = c.board.getLeds();
        const ledB = leds.length ? c.board.ledBrightness(leds[0]).toFixed(4) : 'n/a';
        mkdirSync(join(EXAMPLES, name), { recursive: true });
        writeFileSync(join(EXAMPLES, name, 'circuit.json'), JSON.stringify(json, null, 2) + '\n');
        writeFileSync(join(EXAMPLES, name, 'program.bw'), '# Pure circuit — no MCU\n');
        writeFileSync(join(EXAMPLES, name, 'EXPECTED.md'), `# ${name}\n\n${titleEn}\n`);
        console.log(`  ✓ ${name}: LED=${ledB}, nets=${c.board.getNets().length}`);
        entries.push({ id: name, title: { en: titleEn, de: titleDe }, kind: 'circuit',
            category: 'pure-circuit', difficulty,
            files: { program: `${name}/program.bw`, circuit: `${name}/circuit.json`, expected: `${name}/EXPECTED.md` }
        });
        ok++;
    } catch (e) {
        console.log(`  ✗ ${name}: ${e.message.slice(0, 100)}`);
        fail++;
    }
}

console.log('Batch 2: direct-wired + mini breadboard examples\n');

// ---- DIRECT-WIRED (no breadboard) ----

build('pc09-direct-led', 'Battery + LED + resistor (direct wired, no breadboard)',
    'Batterie + LED + Widerstand (direkt verdrahtet, ohne Steckbrett)', 1, (c) => {
    const bat = c.addPart('vsource', { volts: 9, variant: '9v' }, 100, 150);
    const r = c.addPart('resistor', { ohms: 1000 }, 250, 100);
    const led = c.addPart('led', { vf: 2.0, color: 'red' }, 250, 200);
    c.addWire(bat.id, 'pos', r.id, 'a');
    c.addWire(r.id, 'b', led.id, 'anode');
    c.addWire(led.id, 'cathode', bat.id, 'neg');
});

build('pc10-direct-series', 'Two LEDs in series (direct wired)',
    'Zwei LEDs in Reihe (direkt verdrahtet)', 1, (c) => {
    const bat = c.addPart('vsource', { volts: 9, variant: '9v' }, 100, 150);
    const r = c.addPart('resistor', { ohms: 470 }, 250, 80);
    const led1 = c.addPart('led', { vf: 2.0, color: 'red' }, 250, 160);
    const led2 = c.addPart('led', { vf: 2.0, color: 'green' }, 250, 240);
    c.addWire(bat.id, 'pos', r.id, 'a');
    c.addWire(r.id, 'b', led1.id, 'anode');
    c.addWire(led1.id, 'cathode', led2.id, 'anode');
    c.addWire(led2.id, 'cathode', bat.id, 'neg');
});

build('pc11-direct-parallel', 'Two LEDs in parallel (direct wired)',
    'Zwei LEDs parallel (direkt verdrahtet)', 1, (c) => {
    const bat = c.addPart('vsource', { volts: 5 }, 100, 150);
    const r1 = c.addPart('resistor', { ohms: 470 }, 250, 80);
    const r2 = c.addPart('resistor', { ohms: 470 }, 350, 80);
    const led1 = c.addPart('led', { vf: 2.0, color: 'red' }, 250, 180);
    const led2 = c.addPart('led', { vf: 2.0, color: 'blue' }, 350, 180);
    c.addWire(bat.id, 'pos', r1.id, 'a');
    c.addWire(bat.id, 'pos', r2.id, 'a');
    c.addWire(r1.id, 'b', led1.id, 'anode');
    c.addWire(r2.id, 'b', led2.id, 'anode');
    c.addWire(led1.id, 'cathode', bat.id, 'neg');
    c.addWire(led2.id, 'cathode', bat.id, 'neg');
});

build('pc12-direct-divider', 'Voltage divider (direct wired)',
    'Spannungsteiler (direkt verdrahtet)', 1, (c) => {
    const bat = c.addPart('vsource', { volts: 9, variant: '9v' }, 100, 150);
    const r1 = c.addPart('resistor', { ohms: 10000 }, 250, 100);
    const r2 = c.addPart('resistor', { ohms: 10000 }, 250, 200);
    c.addWire(bat.id, 'pos', r1.id, 'a');
    c.addWire(r1.id, 'b', r2.id, 'a');
    c.addWire(r2.id, 'b', bat.id, 'neg');
});

build('pc13-direct-diode', 'Diode polarity (direct wired)',
    'Diodenpolung (direkt verdrahtet)', 1, (c) => {
    const bat = c.addPart('vsource', { volts: 5 }, 100, 150);
    const r = c.addPart('resistor', { ohms: 220 }, 250, 80);
    const d = c.addPart('diode', { vf: 0.7 }, 250, 160);
    const led = c.addPart('led', { vf: 2.0, color: 'green' }, 250, 240);
    c.addWire(bat.id, 'pos', r.id, 'a');
    c.addWire(r.id, 'b', d.id, 'anode');
    c.addWire(d.id, 'cathode', led.id, 'anode');
    c.addWire(led.id, 'cathode', bat.id, 'neg');
});

// ---- MINI BREADBOARD (17 cols, no rails) ----

build('pc14-mini-led', 'LED on a mini breadboard (no rails)',
    'LED auf Mini-Steckbrett (ohne Stromschienen)', 1, (c) => {
    const bb = c.addPart('breadboard', { size: 'mini' }, 500, 300);
    const bat = c.addPart('vsource', { volts: 5 }, 100, 100);
    const r = c.addPart('resistor', { ohms: 470 }, 0, 0);
    const led = c.addPart('led', { vf: 2.0, color: 'red' }, 0, 0);
    c.seatPart(r.id, bb.id, computeLeadMap(FOOTPRINTS.resistor, 'a3'));
    c.seatPart(led.id, bb.id, computeLeadMap(FOOTPRINTS.led, 'b7'));
    c.addTapWire(bat.id, 'pos', bb.id, 'e3');
    c.addTapWire(bat.id, 'neg', bb.id, 'e8');
});

build('pc15-mini-npn', 'NPN switch on a mini breadboard',
    'NPN-Schalter auf Mini-Steckbrett', 2, (c) => {
    const bb = c.addPart('breadboard', { size: 'mini' }, 500, 300);
    const bat = c.addPart('vsource', { volts: 5 }, 100, 100);
    const rLoad = c.addPart('resistor', { ohms: 470 }, 0, 0);
    const led = c.addPart('led', { vf: 2.0, color: 'red' }, 0, 0);
    const npn = c.addPart('npn', { beta: 100 }, 0, 0);
    const rBase = c.addPart('resistor', { ohms: 10000 }, 0, 0);
    c.seatPart(rLoad.id, bb.id, computeLeadMap(FOOTPRINTS.resistor, 'a2'));
    c.seatPart(led.id, bb.id, computeLeadMap(FOOTPRINTS.led, 'b6'));
    c.seatPart(npn.id, bb.id, computeLeadMap(FOOTPRINTS.npn, 'c8'));
    c.seatPart(rBase.id, bb.id, computeLeadMap(FOOTPRINTS.resistor, 'd2'));
    c.addTapWire(bat.id, 'pos', bb.id, 'e2');
    c.addTapWire(bat.id, 'neg', bb.id, 'e10');
    c.addHoleWire(bb.id, 'e2', 'd2', 'red');
});

build('pc16-mini-rc', 'RC circuit on a mini breadboard',
    'RC-Schaltung auf Mini-Steckbrett', 2, (c) => {
    const bb = c.addPart('breadboard', { size: 'mini' }, 500, 300);
    const bat = c.addPart('vsource', { volts: 5 }, 100, 100);
    const r = c.addPart('resistor', { ohms: 10000 }, 0, 0);
    const cap = c.addPart('capacitor', { farads: 0.0001 }, 0, 0);
    c.seatPart(r.id, bb.id, computeLeadMap(FOOTPRINTS.resistor, 'a3'));
    c.seatPart(cap.id, bb.id, computeLeadMap(FOOTPRINTS.capacitor, 'a7'));
    c.addTapWire(bat.id, 'pos', bb.id, 'e3');
    c.addTapWire(bat.id, 'neg', bb.id, 'e11');
});

// ---- HALF BREADBOARD with relay ----

build('pc17-relay-circuit', 'Relay with indicator LED',
    'Relais mit Anzeige-LED', 3, (c) => {
    const bb = c.addPart('breadboard', { size: 'half' }, 500, 300);
    const bat = c.addPart('vsource', { volts: 5 }, 100, 100);
    const relay = c.addPart('relay', {}, 0, 0);
    const rLed = c.addPart('resistor', { ohms: 1000 }, 0, 0);
    const led = c.addPart('led', { vf: 2.0, color: 'green' }, 0, 0);
    const tip = c.addPart('tip120', {}, 0, 0);
    const rBase = c.addPart('resistor', { ohms: 1000 }, 0, 0);
    const btn = c.addPart('button', {}, 0, 0);
    c.seatPart(relay.id, bb.id, computeLeadMap(FOOTPRINTS.relay, 'a2'));
    c.seatPart(tip.id, bb.id, computeLeadMap(FOOTPRINTS.tip120, 'f8'));
    c.seatPart(rBase.id, bb.id, computeLeadMap(FOOTPRINTS.resistor, 'f4'));
    c.seatPart(rLed.id, bb.id, computeLeadMap(FOOTPRINTS.resistor, 'f14'));
    c.seatPart(led.id, bb.id, computeLeadMap(FOOTPRINTS.led, 'f18'));
    c.seatPart(btn.id, bb.id, computeLeadMap(FOOTPRINTS.button, 'f2'));
    c.addTapWire(bat.id, 'pos', bb.id, '+1');
    c.addTapWire(bat.id, 'neg', bb.id, '-1');
    c.addHoleWire(bb.id, '+2', 'a2', 'red');
    c.addHoleWire(bb.id, '+14', 'f14', 'red');
    c.addHoleWire(bb.id, 'f19', '-19', 'black');
    c.addHoleWire(bb.id, 'f10', '-10', 'black');
});

console.log(`\n${ok} succeeded, ${fail} failed.`);
console.log('\nIndex entries:');
console.log(JSON.stringify(entries, null, 2));
