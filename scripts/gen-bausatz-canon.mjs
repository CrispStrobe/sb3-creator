#!/usr/bin/env node
/**
 * Bausatz canon — kit-inspired clean-room examples.
 * Direct-wired circuits (no breadboard).
 * 555+CD4017, LM358, tilt_sensor, sound_module.
 */
import { writeFileSync, mkdirSync, existsSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
const __here = dirname(fileURLToPath(import.meta.url));
const { BoardImpl } = await import(join(__here, '..', '..', 'bw-board', 'src', 'board.js'));
const { inferNetlist, checkWiring } = await import(join(__here, '..', '..', 'bw-board', 'src', 'infer-netlist.js'));
const { setEngine } = await import(join(__here, '..', '..', 'bw-circuit-ui', 'src', 'engine.js'));
const { Circuit, resetIds } = await import(join(__here, '..', '..', 'bw-circuit-ui', 'src', 'model', 'circuit.js'));
const devDir = join(__here, '..', '..', 'bw-board', 'src', 'devices') + '/';
for (const m of ['relay','dc-motor','servo','timer-555','logic-gates','power',
    'analog-ics','analog-amps','h-bridge','sensors','display','digital-ics','chip-composer',
    'motor-drivers','misc-parts','named-parts','tier1-parts','i2c-parts',
    'thirtyseven']) {
    try { const mod = await import(devDir + m + '.js');
        const fn = Object.values(mod).find(v => typeof v === 'function' && v.name.startsWith('register'));
        if (fn) fn(); } catch(e) { console.log(`  [warn] ${m}: ${e.message.slice(0,80)}`); }
}
setEngine({ BoardImpl, inferNetlist, checkWiring });
const EXAMPLES = join(__here, '..', 'examples');
let ok = 0, fail = 0;
const entries = [];

function build(name, titleDe, titleEn, difficulty, fn) {
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
        const exp = join(EXAMPLES, name, 'EXPECTED.md');
        if (!existsSync(exp)) writeFileSync(exp, `# ${name}\n\n${titleEn}\n`);
        console.log(`  ✓ ${name}: LED=${ledB}, nets=${c.board.getNets().length}, parts=${c.parts.length}`);
        entries.push({ id: name, title: { en: titleEn, de: titleDe }, kind: 'circuit',
            category: 'pure-circuit', difficulty,
            files: { program: `${name}/program.bw`, circuit: `${name}/circuit.json`,
                     expected: `${name}/EXPECTED.md`, intro: `${name}/intro.md`,
                     introDE: `${name}/intro.de.md` }
        });
        ok++;
    } catch (e) {
        console.log(`  ✗ ${name}: ${e.message.slice(0, 200)}`);
        fail++;
    }
}

console.log('Bausatz canon — generating circuits...\n');

// Helper: wire LED with series resistor between two nodes
function addLedChain(c, vccPart, vccTerm, gndPart, gndTerm, color, ohms) {
    const r = c.addPart('resistor', { ohms }, 0, 0);
    const led = c.addPart('led', { vf: 2.0, color }, 0, 0);
    c.addWire(vccPart.id, vccTerm, r.id, 'a');
    c.addWire(r.id, 'b', led.id, 'anode');
    c.addWire(led.id, 'cathode', gndPart.id, gndTerm);
    return { r, led };
}

// ============================================================
//  555 + CD4017 FAMILY
// ============================================================

// pc81: LED-Lauflicht (LED chaser) — 555 astable clocks CD4017, 10 LEDs
// 555: R1=1k, R2=47k, C=10µF → f ≈ 1.44/((1k+94k)*10µ) ≈ 1.52 Hz
build('pc81-led-lauflicht', 'LED-Lauflicht', 'LED Chaser', 2, (c) => {
    const vcc = c.addPart('vcc', {}, 50, 50);
    const gnd = c.addPart('gnd', {}, 50, 500);
    const timer = c.addPart('timer_555', {}, 200, 200);
    const counter = c.addPart('decade_counter', {}, 400, 200);

    // 555 power + reset
    c.addWire(vcc.id, 'vcc', timer.id, 'vcc');
    c.addWire(vcc.id, 'vcc', timer.id, 'reset');
    c.addWire(gnd.id, 'gnd', timer.id, 'gnd');
    c.addWire(timer.id, 'control', gnd.id, 'gnd');

    // 555 astable: R1=1k, R2=47k, C=10µF
    const r1 = c.addPart('resistor', { ohms: 1000 }, 150, 100);
    const r2 = c.addPart('resistor', { ohms: 47000 }, 250, 100);
    const ct = c.addPart('capacitor', { farads: 0.00001 }, 300, 300);
    c.addWire(vcc.id, 'vcc', r1.id, 'a');
    c.addWire(r1.id, 'b', timer.id, 'discharge');
    c.addWire(timer.id, 'discharge', r2.id, 'a');
    c.addWire(r2.id, 'b', timer.id, 'threshold');
    c.addWire(timer.id, 'threshold', timer.id, 'trigger');
    c.addWire(timer.id, 'threshold', ct.id, 'pos');
    c.addWire(ct.id, 'neg', gnd.id, 'gnd');

    // CD4017: clock from 555 output, enable tied low, reset tied low
    c.addWire(timer.id, 'output', counter.id, 'clk');
    c.addWire(gnd.id, 'gnd', counter.id, 'en');
    c.addWire(gnd.id, 'gnd', counter.id, 'rst');

    // 10 LEDs on q0-q9, each through 1kΩ
    const colors = ['red','green','blue','yellow','red','green','blue','yellow','red','green'];
    for (let i = 0; i < 10; i++) {
        const rLed = c.addPart('resistor', { ohms: 1000 }, 500 + i*30, 100);
        const led = c.addPart('led', { vf: 2.0, color: colors[i] }, 500 + i*30, 200);
        c.addWire(counter.id, `q${i}`, rLed.id, 'a');
        c.addWire(rLed.id, 'b', led.id, 'anode');
        c.addWire(led.id, 'cathode', gnd.id, 'gnd');
    }
});

// pc82: Mini-Roulette — 555 + CD4017 + button + RC slowdown
// Button connects VCC to 555 reset (starts), RC on control pin decays → slows down
build('pc82-mini-roulette', 'Mini-Roulette', 'Mini Roulette', 3, (c) => {
    const vcc = c.addPart('vcc', {}, 50, 50);
    const gnd = c.addPart('gnd', {}, 50, 500);
    const timer = c.addPart('timer_555', {}, 200, 200);
    const counter = c.addPart('decade_counter', {}, 400, 200);

    // 555 power
    c.addWire(vcc.id, 'vcc', timer.id, 'vcc');
    c.addWire(gnd.id, 'gnd', timer.id, 'gnd');

    // Button on reset: press to run, release to hold
    const btn = c.addPart('button', {}, 100, 300);
    c.addWire(vcc.id, 'vcc', btn.id, 'a');
    c.addWire(btn.id, 'b', timer.id, 'reset');
    // Pull-down on reset so 555 stays off when button released
    const rPd = c.addPart('resistor', { ohms: 100000 }, 150, 350);
    c.addWire(timer.id, 'reset', rPd.id, 'a');
    c.addWire(rPd.id, 'b', gnd.id, 'gnd');

    // 555 astable: fast spin. R1=1k, R2=10k, C=100nF → f ≈ 686 Hz (visual blur)
    // Actually for roulette we want visible spin: R2=10k, C=10µF → f ≈ 6.86 Hz
    const ra = c.addPart('resistor', { ohms: 1000 }, 150, 100);
    const rb = c.addPart('resistor', { ohms: 10000 }, 250, 100);
    const ct = c.addPart('capacitor', { farads: 0.00001 }, 300, 300);
    c.addWire(vcc.id, 'vcc', ra.id, 'a');
    c.addWire(ra.id, 'b', timer.id, 'discharge');
    c.addWire(timer.id, 'discharge', rb.id, 'a');
    c.addWire(rb.id, 'b', timer.id, 'threshold');
    c.addWire(timer.id, 'threshold', timer.id, 'trigger');
    c.addWire(timer.id, 'threshold', ct.id, 'pos');
    c.addWire(ct.id, 'neg', gnd.id, 'gnd');

    // Control pin: RC to slow down the oscillation as the cap charges
    const rCtrl = c.addPart('resistor', { ohms: 100000 }, 300, 150);
    const cCtrl = c.addPart('capacitor', { farads: 0.0001 }, 350, 250);
    c.addWire(vcc.id, 'vcc', rCtrl.id, 'a');
    c.addWire(rCtrl.id, 'b', timer.id, 'control');
    c.addWire(timer.id, 'control', cCtrl.id, 'pos');
    c.addWire(cCtrl.id, 'neg', gnd.id, 'gnd');

    // CD4017
    c.addWire(timer.id, 'output', counter.id, 'clk');
    c.addWire(gnd.id, 'gnd', counter.id, 'en');
    c.addWire(gnd.id, 'gnd', counter.id, 'rst');

    // 10 LEDs
    const colors = ['red','red','green','red','red','green','red','red','green','red'];
    for (let i = 0; i < 10; i++) {
        const rL = c.addPart('resistor', { ohms: 1000 }, 500 + i*30, 100);
        const led = c.addPart('led', { vf: 2.0, color: colors[i] }, 500 + i*30, 200);
        c.addWire(counter.id, `q${i}`, rL.id, 'a');
        c.addWire(rL.id, 'b', led.id, 'anode');
        c.addWire(led.id, 'cathode', gnd.id, 'gnd');
    }
});

// pc83: Glücksrad — shake-triggered roulette (tilt_sensor instead of button)
build('pc83-gluecksrad', 'Glücksrad: Schüttel-Roulette', 'Wheel of Fortune: Shake Roulette', 3, (c) => {
    const vcc = c.addPart('vcc', {}, 50, 50);
    const gnd = c.addPart('gnd', {}, 50, 500);
    const timer = c.addPart('timer_555', {}, 200, 200);
    const counter = c.addPart('decade_counter', {}, 400, 200);

    c.addWire(vcc.id, 'vcc', timer.id, 'vcc');
    c.addWire(gnd.id, 'gnd', timer.id, 'gnd');

    // Tilt sensor on reset: shaking opens/closes → triggers 555
    const tilt = c.addPart('tilt_sensor', {}, 100, 300);
    c.addWire(vcc.id, 'vcc', tilt.id, 'a');
    c.addWire(tilt.id, 'b', timer.id, 'reset');
    const rPd = c.addPart('resistor', { ohms: 100000 }, 150, 350);
    c.addWire(timer.id, 'reset', rPd.id, 'a');
    c.addWire(rPd.id, 'b', gnd.id, 'gnd');

    // 555 astable
    const ra = c.addPart('resistor', { ohms: 1000 }, 150, 100);
    const rb = c.addPart('resistor', { ohms: 10000 }, 250, 100);
    const ct = c.addPart('capacitor', { farads: 0.00001 }, 300, 300);
    c.addWire(vcc.id, 'vcc', ra.id, 'a');
    c.addWire(ra.id, 'b', timer.id, 'discharge');
    c.addWire(timer.id, 'discharge', rb.id, 'a');
    c.addWire(rb.id, 'b', timer.id, 'threshold');
    c.addWire(timer.id, 'threshold', timer.id, 'trigger');
    c.addWire(timer.id, 'threshold', ct.id, 'pos');
    c.addWire(ct.id, 'neg', gnd.id, 'gnd');

    // RC on control for decay
    const rCtrl = c.addPart('resistor', { ohms: 100000 }, 300, 150);
    const cCtrl = c.addPart('capacitor', { farads: 0.0001 }, 350, 250);
    c.addWire(vcc.id, 'vcc', rCtrl.id, 'a');
    c.addWire(rCtrl.id, 'b', timer.id, 'control');
    c.addWire(timer.id, 'control', cCtrl.id, 'pos');
    c.addWire(cCtrl.id, 'neg', gnd.id, 'gnd');

    // CD4017
    c.addWire(timer.id, 'output', counter.id, 'clk');
    c.addWire(gnd.id, 'gnd', counter.id, 'en');
    c.addWire(gnd.id, 'gnd', counter.id, 'rst');

    // 6 LEDs (wheel positions)
    const cols = ['red','yellow','green','blue','red','yellow'];
    for (let i = 0; i < 6; i++) {
        const rL = c.addPart('resistor', { ohms: 1000 }, 500 + i*40, 100);
        const led = c.addPart('led', { vf: 2.0, color: cols[i] }, 500 + i*40, 200);
        c.addWire(counter.id, `q${i}`, rL.id, 'a');
        c.addWire(rL.id, 'b', led.id, 'anode');
        c.addWire(led.id, 'cathode', gnd.id, 'gnd');
    }
    // Reset after q6 → wrap to q0
    c.addWire(counter.id, 'q6', counter.id, 'rst');
});

// ============================================================
//  LM358 BREATHING FAMILY
// ============================================================

// pc84: Pulsierendes LED-Herz (breathing LED heart)
// LM358 op1 as integrator (triangle wave), op2 as comparator → LED bank
build('pc84-led-herz', 'Pulsierendes LED-Herz', 'Breathing LED Heart', 3, (c) => {
    const vcc = c.addPart('vcc', {}, 50, 50);
    const gnd = c.addPart('gnd', {}, 50, 500);
    const opamp = c.addPart('lm358', {}, 300, 200);

    // Power the LM358
    c.addWire(vcc.id, 'vcc', opamp.id, 'vcc');
    c.addWire(gnd.id, 'gnd', opamp.id, 'gnd');

    // Op1 as integrator: square from op2 output → R → op1_neg, cap feedback
    const rInt = c.addPart('resistor', { ohms: 100000 }, 200, 100);
    const cInt = c.addPart('capacitor', { farads: 0.000001 }, 200, 300);
    // Reference: voltage divider for op1_pos bias
    const rBias1 = c.addPart('resistor', { ohms: 100000 }, 100, 150);
    const rBias2 = c.addPart('resistor', { ohms: 100000 }, 100, 250);
    c.addWire(vcc.id, 'vcc', rBias1.id, 'a');
    c.addWire(rBias1.id, 'b', rBias2.id, 'a');
    c.addWire(rBias2.id, 'b', gnd.id, 'gnd');
    c.addWire(rBias1.id, 'b', opamp.id, '1_pos');  // Vref = VCC/2

    // Integrator: op2_out → R → op1_neg, C from op1_neg to op1_out
    c.addWire(opamp.id, '2_out', rInt.id, 'a');
    c.addWire(rInt.id, 'b', opamp.id, '1_neg');
    c.addWire(opamp.id, '1_neg', cInt.id, 'pos');
    c.addWire(cInt.id, 'neg', opamp.id, '1_out');

    // Op2 as comparator with hysteresis: triangle → threshold → square
    const rH1 = c.addPart('resistor', { ohms: 100000 }, 400, 100);
    const rH2 = c.addPart('resistor', { ohms: 47000 }, 400, 300);
    c.addWire(opamp.id, '1_out', opamp.id, '2_neg');  // triangle to neg input
    // Positive feedback (hysteresis) from op2_out
    c.addWire(opamp.id, '2_out', rH1.id, 'a');
    c.addWire(rH1.id, 'b', opamp.id, '2_pos');
    c.addWire(rBias1.id, 'b', rH2.id, 'a');  // bias to pos via rH2
    c.addWire(rH2.id, 'b', opamp.id, '2_pos');

    // LED bank on triangle output (op1_out) through resistors
    const colors = ['red','red','red','red','red'];
    for (let i = 0; i < 5; i++) {
        const rL = c.addPart('resistor', { ohms: 470 }, 500 + i*30, 100);
        const led = c.addPart('led', { vf: 2.0, color: colors[i] }, 500 + i*30, 200);
        c.addWire(opamp.id, '1_out', rL.id, 'a');
        c.addWire(rL.id, 'b', led.id, 'anode');
        c.addWire(led.id, 'cathode', gnd.id, 'gnd');
    }
});

// pc85: Pulsierende LED-Lampe (breathing single LED)
// Simplified: one op-amp as triangle oscillator, single LED
build('pc85-led-lampe-puls', 'Pulsierende LED-Lampe', 'Breathing LED Lamp', 2, (c) => {
    const vcc = c.addPart('vcc', {}, 50, 50);
    const gnd = c.addPart('gnd', {}, 50, 500);
    const opamp = c.addPart('lm358', {}, 300, 200);

    c.addWire(vcc.id, 'vcc', opamp.id, 'vcc');
    c.addWire(gnd.id, 'gnd', opamp.id, 'gnd');

    // Bias divider for VCC/2
    const rB1 = c.addPart('resistor', { ohms: 100000 }, 100, 150);
    const rB2 = c.addPart('resistor', { ohms: 100000 }, 100, 250);
    c.addWire(vcc.id, 'vcc', rB1.id, 'a');
    c.addWire(rB1.id, 'b', rB2.id, 'a');
    c.addWire(rB2.id, 'b', gnd.id, 'gnd');
    c.addWire(rB1.id, 'b', opamp.id, '1_pos');

    // Integrator on op1
    const rI = c.addPart('resistor', { ohms: 100000 }, 200, 100);
    const cI = c.addPart('capacitor', { farads: 0.000001 }, 200, 300);
    c.addWire(opamp.id, '2_out', rI.id, 'a');
    c.addWire(rI.id, 'b', opamp.id, '1_neg');
    c.addWire(opamp.id, '1_neg', cI.id, 'pos');
    c.addWire(cI.id, 'neg', opamp.id, '1_out');

    // Comparator on op2 with hysteresis
    const rH1 = c.addPart('resistor', { ohms: 100000 }, 400, 100);
    const rH2 = c.addPart('resistor', { ohms: 47000 }, 400, 300);
    c.addWire(opamp.id, '1_out', opamp.id, '2_neg');
    c.addWire(opamp.id, '2_out', rH1.id, 'a');
    c.addWire(rH1.id, 'b', opamp.id, '2_pos');
    c.addWire(rB1.id, 'b', rH2.id, 'a');
    c.addWire(rH2.id, 'b', opamp.id, '2_pos');

    // Single LED on triangle output
    const rL = c.addPart('resistor', { ohms: 470 }, 500, 200);
    const led = c.addPart('led', { vf: 2.0, color: 'white' }, 500, 300);
    c.addWire(opamp.id, '1_out', rL.id, 'a');
    c.addWire(rL.id, 'b', led.id, 'anode');
    c.addWire(led.id, 'cathode', gnd.id, 'gnd');
});

// ============================================================
//  LED-SANDUHR (LED hourglass)
// ============================================================

// pc86: 555 clock + CD4017 counter, tilt flips direction
// Simplified: 555 clocks CD4017, tilt_sensor resets counter (flips the hourglass)
build('pc86-led-sanduhr', 'LED-Sanduhr', 'LED Hourglass', 3, (c) => {
    const vcc = c.addPart('vcc', {}, 50, 50);
    const gnd = c.addPart('gnd', {}, 50, 500);
    const timer = c.addPart('timer_555', {}, 200, 200);
    const counter = c.addPart('decade_counter', {}, 400, 200);

    c.addWire(vcc.id, 'vcc', timer.id, 'vcc');
    c.addWire(vcc.id, 'vcc', timer.id, 'reset');
    c.addWire(gnd.id, 'gnd', timer.id, 'gnd');
    c.addWire(timer.id, 'control', gnd.id, 'gnd');

    // 555 astable: slow clock ~1 Hz for sand grain effect
    // R1=10k, R2=68k, C=10µF → f = 1.44/((10k+136k)*10µ) ≈ 0.99 Hz
    const r1 = c.addPart('resistor', { ohms: 10000 }, 150, 100);
    const r2 = c.addPart('resistor', { ohms: 68000 }, 250, 100);
    const ct = c.addPart('capacitor', { farads: 0.00001 }, 300, 300);
    c.addWire(vcc.id, 'vcc', r1.id, 'a');
    c.addWire(r1.id, 'b', timer.id, 'discharge');
    c.addWire(timer.id, 'discharge', r2.id, 'a');
    c.addWire(r2.id, 'b', timer.id, 'threshold');
    c.addWire(timer.id, 'threshold', timer.id, 'trigger');
    c.addWire(timer.id, 'threshold', ct.id, 'pos');
    c.addWire(ct.id, 'neg', gnd.id, 'gnd');

    // CD4017 clocked by 555
    c.addWire(timer.id, 'output', counter.id, 'clk');
    c.addWire(gnd.id, 'gnd', counter.id, 'en');

    // Tilt sensor resets counter (flip the hourglass)
    const tilt = c.addPart('tilt_sensor', {}, 100, 400);
    c.addWire(vcc.id, 'vcc', tilt.id, 'a');
    c.addWire(tilt.id, 'b', counter.id, 'rst');
    const rPd = c.addPart('resistor', { ohms: 100000 }, 150, 450);
    c.addWire(counter.id, 'rst', rPd.id, 'a');
    c.addWire(rPd.id, 'b', gnd.id, 'gnd');

    // 6 LEDs = sand grains filling up
    const cols = ['yellow','yellow','yellow','yellow','yellow','yellow'];
    for (let i = 0; i < 6; i++) {
        const rL = c.addPart('resistor', { ohms: 1000 }, 500 + i*40, 100);
        const led = c.addPart('led', { vf: 2.0, color: cols[i] }, 500 + i*40, 200);
        c.addWire(counter.id, `q${i}`, rL.id, 'a');
        c.addWire(rL.id, 'b', led.id, 'anode');
        c.addWire(led.id, 'cathode', gnd.id, 'gnd');
    }
    // After q6, wrap
    c.addWire(counter.id, 'q6', counter.id, 'rst');
});

// ============================================================
//  STROBOSKOP
// ============================================================

// pc87: 555 astable, low duty cycle, bright LED
// R1=1k (short high), R2=100k (long low), C=1µF
// f = 1.44/((1k+200k)*1µ) ≈ 7.16 Hz, duty ≈ 1k/(1k+2*100k) ≈ 0.5%
build('pc87-stroboskop', 'Stroboskop', 'Strobe Light', 2, (c) => {
    const vcc = c.addPart('vcc', {}, 50, 50);
    const gnd = c.addPart('gnd', {}, 50, 400);
    const timer = c.addPart('timer_555', {}, 200, 200);

    c.addWire(vcc.id, 'vcc', timer.id, 'vcc');
    c.addWire(vcc.id, 'vcc', timer.id, 'reset');
    c.addWire(gnd.id, 'gnd', timer.id, 'gnd');
    c.addWire(timer.id, 'control', gnd.id, 'gnd');

    // Astable: very low duty
    const r1 = c.addPart('resistor', { ohms: 1000 }, 150, 100);
    const r2 = c.addPart('resistor', { ohms: 100000 }, 250, 100);
    const ct = c.addPart('capacitor', { farads: 0.000001 }, 300, 300);
    c.addWire(vcc.id, 'vcc', r1.id, 'a');
    c.addWire(r1.id, 'b', timer.id, 'discharge');
    c.addWire(timer.id, 'discharge', r2.id, 'a');
    c.addWire(r2.id, 'b', timer.id, 'threshold');
    c.addWire(timer.id, 'threshold', timer.id, 'trigger');
    c.addWire(timer.id, 'threshold', ct.id, 'pos');
    c.addWire(ct.id, 'neg', gnd.id, 'gnd');

    // Bright LED on output
    const rLed = c.addPart('resistor', { ohms: 100 }, 350, 200);
    const led = c.addPart('led', { vf: 2.0, color: 'white' }, 350, 300);
    c.addWire(timer.id, 'output', rLed.id, 'a');
    c.addWire(rLed.id, 'b', led.id, 'anode');
    c.addWire(led.id, 'cathode', gnd.id, 'gnd');
});

// ============================================================
//  LICHTORGEL (colour organ / light organ)
// ============================================================

// pc88: sound_module → 3 NPN transistor stages → 3 LED groups
// Qualitative: sound level drives transistor stages at different thresholds
build('pc88-lichtorgel', 'Lichtorgel', 'Colour Organ', 3, (c) => {
    const vcc = c.addPart('vcc', {}, 50, 50);
    const gnd = c.addPart('gnd', {}, 50, 500);
    const mic = c.addPart('sound_module', {}, 150, 200);

    // Sound module power
    c.addWire(vcc.id, 'vcc', mic.id, 'vcc');
    c.addWire(gnd.id, 'gnd', mic.id, 'gnd');

    // Three stages with different base resistors → different thresholds
    // Low threshold (sensitive, bass): 10k → lights first
    // Mid threshold: 22k
    // High threshold (least sensitive, treble): 47k → lights last
    const stages = [
        { rBase: 10000, color: 'red', label: 'bass' },
        { rBase: 22000, color: 'green', label: 'mid' },
        { rBase: 47000, color: 'blue', label: 'treble' },
    ];

    for (let i = 0; i < stages.length; i++) {
        const s = stages[i];
        const rB = c.addPart('resistor', { ohms: s.rBase }, 300 + i*120, 100);
        const npn = c.addPart('npn', { beta: 100 }, 300 + i*120, 250);
        const rL1 = c.addPart('resistor', { ohms: 470 }, 300 + i*120 - 30, 350);
        const led1 = c.addPart('led', { vf: 2.0, color: s.color }, 300 + i*120 - 30, 420);
        const rL2 = c.addPart('resistor', { ohms: 470 }, 300 + i*120 + 30, 350);
        const led2 = c.addPart('led', { vf: 2.0, color: s.color }, 300 + i*120 + 30, 420);

        // AO → base resistor → base
        c.addWire(mic.id, 'ao', rB.id, 'a');
        c.addWire(rB.id, 'b', npn.id, 'base');

        // Collector: VCC → R → LED → collector
        c.addWire(vcc.id, 'vcc', rL1.id, 'a');
        c.addWire(rL1.id, 'b', led1.id, 'anode');
        c.addWire(led1.id, 'cathode', npn.id, 'collector');

        c.addWire(vcc.id, 'vcc', rL2.id, 'a');
        c.addWire(rL2.id, 'b', led2.id, 'anode');
        c.addWire(led2.id, 'cathode', npn.id, 'collector');

        // Emitter → GND
        c.addWire(npn.id, 'emitter', gnd.id, 'gnd');
    }
});

console.log(`\n${ok} succeeded, ${fail} failed.`);
if (fail) process.exitCode = 1;

console.log('\nIndex entries:');
for (const e of entries) {
    console.log(JSON.stringify(e));
}
