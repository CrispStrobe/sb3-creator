#!/usr/bin/env node
/**
 * Generate pure-circuit examples as seated breadboard benches.
 * vsource (not abstract vcc/gnd), parts seated via FOOTPRINTS,
 * verified: fromJSON loads, board solves, LED lights.
 */
import { writeFileSync, mkdirSync } from 'fs';
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

function build(name, title_en, title_de, fn) {
    try {
        resetIds();
        const c = new Circuit(5.0);
        const bb = c.addPart('breadboard', {}, 500, 300);
        fn(c, bb);
        c.board.advanceTo(25_000_000n);
        const json = c.toJSON();
        resetIds();
        Circuit.fromJSON(json); // verify round-trip
        const leds = c.board.getLeds();
        const ledB = leds.length ? c.board.ledBrightness(leds[0]).toFixed(4) : 'n/a';
        mkdirSync(join(EXAMPLES, name), { recursive: true });
        writeFileSync(join(EXAMPLES, name, 'circuit.json'), JSON.stringify(json, null, 2) + '\n');
        writeFileSync(join(EXAMPLES, name, 'program.bw'), '# Pure circuit — no MCU\n');
        writeFileSync(join(EXAMPLES, name, 'EXPECTED.md'), `# ${name}\n\n${title_en}\n`);
        console.log(`  ✓ ${name}: LED=${ledB}, nets=${c.board.getNets().length}`);
        ok++;
        return { name, title_en, title_de };
    } catch (e) {
        console.log(`  ✗ ${name}: ${e.message.slice(0, 100)}`);
        fail++;
        return null;
    }
}

console.log('Generating pure-circuit breadboard examples...\n');
const entries = [];

entries.push(build('pc01-led-resistor', 'LED with series resistor (5V)', 'LED mit Vorwiderstand (5V)', (c, bb) => {
    const bat = c.addPart('vsource', { volts: 5 }, 100, 100);
    const r = c.addPart('resistor', { ohms: 220 }, 0, 0);
    const led = c.addPart('led', { vf: 2.0, color: 'red' }, 0, 0);
    c.seatPart(r.id, bb.id, computeLeadMap(FOOTPRINTS.resistor, 'b5'));
    c.seatPart(led.id, bb.id, computeLeadMap(FOOTPRINTS.led, 'c9'));
    c.addTapWire(bat.id, 'pos', bb.id, 'a5');
    c.addTapWire(bat.id, 'neg', bb.id, 'a10');
}));

entries.push(build('pc02-voltage-divider', 'Voltage divider (two equal resistors)', 'Spannungsteiler (zwei gleiche Widerstände)', (c, bb) => {
    const bat = c.addPart('vsource', { volts: 9, variant: '9v' }, 100, 100);
    const r1 = c.addPart('resistor', { ohms: 10000 }, 0, 0);
    const r2 = c.addPart('resistor', { ohms: 10000 }, 0, 0);
    c.seatPart(r1.id, bb.id, computeLeadMap(FOOTPRINTS.resistor, 'a3'));
    c.seatPart(r2.id, bb.id, computeLeadMap(FOOTPRINTS.resistor, 'a7'));
    c.addTapWire(bat.id, 'pos', bb.id, 'e3');
    c.addTapWire(bat.id, 'neg', bb.id, 'e11');
}));

entries.push(build('pc03-series-resistors', 'Two resistors in series with LED', 'Zwei Widerstände in Reihe mit LED', (c, bb) => {
    const bat = c.addPart('vsource', { volts: 5 }, 100, 100);
    const r1 = c.addPart('resistor', { ohms: 1000 }, 0, 0);
    const r2 = c.addPart('resistor', { ohms: 2000 }, 0, 0);
    const led = c.addPart('led', { vf: 2.0, color: 'green' }, 0, 0);
    c.seatPart(r1.id, bb.id, computeLeadMap(FOOTPRINTS.resistor, 'a2'));
    c.seatPart(r2.id, bb.id, computeLeadMap(FOOTPRINTS.resistor, 'a6'));
    c.seatPart(led.id, bb.id, computeLeadMap(FOOTPRINTS.led, 'b10'));
    c.addTapWire(bat.id, 'pos', bb.id, 'e2');
    c.addTapWire(bat.id, 'neg', bb.id, 'e11');
}));

entries.push(build('pc04-parallel-leds', 'Two LEDs in parallel', 'Zwei LEDs parallel', (c, bb) => {
    const bat = c.addPart('vsource', { volts: 5 }, 100, 100);
    const r1 = c.addPart('resistor', { ohms: 1000 }, 0, 0);
    const r2 = c.addPart('resistor', { ohms: 1000 }, 0, 0);
    const led1 = c.addPart('led', { vf: 2.0, color: 'red' }, 0, 0);
    const led2 = c.addPart('led', { vf: 2.0, color: 'green' }, 0, 0);
    c.seatPart(r1.id, bb.id, computeLeadMap(FOOTPRINTS.resistor, 'a2'));
    c.seatPart(led1.id, bb.id, computeLeadMap(FOOTPRINTS.led, 'b6'));
    c.seatPart(r2.id, bb.id, computeLeadMap(FOOTPRINTS.resistor, 'a12'));
    c.seatPart(led2.id, bb.id, computeLeadMap(FOOTPRINTS.led, 'b16'));
    c.addTapWire(bat.id, 'pos', bb.id, 'e2');
    c.addTapWire(bat.id, 'neg', bb.id, 'e7');
    c.addHoleWire(bb.id, 'e2', 'e12', 'red');   // parallel + rail
    c.addHoleWire(bb.id, 'e7', 'e17', 'black');  // parallel - rail
}));

entries.push(build('pc05-npn-switch', 'NPN transistor switch', 'NPN-Transistor als Schalter', (c, bb) => {
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
    // Base resistor from + rail
    c.addHoleWire(bb.id, 'e2', 'd2', 'red');
}));

entries.push(build('pc06-rc-charge', 'RC charging circuit', 'RC-Ladekreis', (c, bb) => {
    const bat = c.addPart('vsource', { volts: 5 }, 100, 100);
    const r = c.addPart('resistor', { ohms: 10000 }, 0, 0);
    const cap = c.addPart('capacitor', { farads: 0.0001 }, 0, 0);
    c.seatPart(r.id, bb.id, computeLeadMap(FOOTPRINTS.resistor, 'a3'));
    c.seatPart(cap.id, bb.id, computeLeadMap(FOOTPRINTS.capacitor, 'a7'));
    c.addTapWire(bat.id, 'pos', bb.id, 'e3');
    c.addTapWire(bat.id, 'neg', bb.id, 'e11');
}));

entries.push(build('pc07-pot-dimmer', 'Potentiometer LED dimmer', 'Potentiometer-LED-Dimmer', (c, bb) => {
    const bat = c.addPart('vsource', { volts: 5 }, 100, 100);
    const pot = c.addPart('potentiometer', { ohms: 10000, position: 0.5 }, 0, 0);
    const r = c.addPart('resistor', { ohms: 220 }, 0, 0);
    const led = c.addPart('led', { vf: 2.0, color: 'red' }, 0, 0);
    c.seatPart(pot.id, bb.id, computeLeadMap(FOOTPRINTS.potentiometer, 'a3'));
    c.seatPart(r.id, bb.id, computeLeadMap(FOOTPRINTS.resistor, 'b7'));
    c.seatPart(led.id, bb.id, computeLeadMap(FOOTPRINTS.led, 'c11'));
    c.addTapWire(bat.id, 'pos', bb.id, 'e3');
    c.addTapWire(bat.id, 'neg', bb.id, 'e12');
    // Pot wiper to R
    c.addHoleWire(bb.id, 'a5', 'a7', 'yellow'); // wiper strip to R strip
}));

entries.push(build('pc08-diode-polarity', 'Diode polarity — forward vs reverse', 'Diodenpolung — Durchlass vs Sperrrichtung', (c, bb) => {
    const bat = c.addPart('vsource', { volts: 5 }, 100, 100);
    const rFwd = c.addPart('resistor', { ohms: 220 }, 0, 0);
    const dFwd = c.addPart('diode', { vf: 0.7 }, 0, 0);
    const ledFwd = c.addPart('led', { vf: 2.0, color: 'green' }, 0, 0);
    c.seatPart(rFwd.id, bb.id, computeLeadMap(FOOTPRINTS.resistor, 'a2'));
    c.seatPart(dFwd.id, bb.id, computeLeadMap(FOOTPRINTS.diode, 'b6'));
    c.seatPart(ledFwd.id, bb.id, computeLeadMap(FOOTPRINTS.led, 'c10'));
    c.addTapWire(bat.id, 'pos', bb.id, 'e2');
    c.addTapWire(bat.id, 'neg', bb.id, 'e11');
}));

// Clean up old flat-format examples
const valid = entries.filter(Boolean);
console.log(`\n${ok} succeeded, ${fail} failed.`);

// Write index entries
console.log('\nIndex entries for index.json:');
for (const e of valid) {
    console.log(JSON.stringify({
        id: e.name, title: { en: e.title_en, de: e.title_de },
        kind: 'circuit', category: 'pure-circuit', difficulty: 1,
        thumbnail: `${e.name}/thumb.svg`,
        files: { program: `${e.name}/program.bw`, circuit: `${e.name}/circuit.json`, expected: `${e.name}/EXPECTED.md` }
    }));
}
