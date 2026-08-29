#!/usr/bin/env node
/**
 * German lesson canon — new example clusters.
 * Direct-wired circuits (no breadboard positioning headaches).
 * 555, Gatter, Licht, Alarm, Messtechnik.
 */
import { writeFileSync, mkdirSync, existsSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { injectEngine } from './lib/engine-surface.mjs';
import { refuseToRevertRepairs, forced } from './lib/generator-guard.mjs';
const __here = dirname(fileURLToPath(import.meta.url));
// The engine surface production injects, applied in one place. This script
// used to import three keys by hand and register a HAND-LISTED SUBSET of the
// device models, so it generated benches against an engine the app does not
// build. See scripts/lib/engine-surface.mjs.
const { Circuit, resetIds } = await injectEngine();
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
        // A generator that would revert a landed repair refuses. See
        // scripts/lib/generator-guard.mjs for the measurement behind this.
        refuseToRevertRepairs(join(EXAMPLES, name, 'circuit.json'), { force: forced() });
        writeFileSync(join(EXAMPLES, name, 'circuit.json'), JSON.stringify(json, null, 2) + '\n');
        writeFileSync(join(EXAMPLES, name, 'program.bw'), '# Pure circuit — no MCU\n');
        // Don't clobber hand-written EXPECTED.md
        const exp = join(EXAMPLES, name, 'EXPECTED.md');
        if (!existsSync(exp)) writeFileSync(exp, `# ${name}\n\n${titleEn}\n`);
        console.log(`  ✓ ${name}: LED=${ledB}, nets=${c.board.getNets().length}`);
        entries.push({ id: name, title: { en: titleEn, de: titleDe }, kind: 'circuit',
            category: 'pure-circuit', difficulty,
            files: { program: `${name}/program.bw`, circuit: `${name}/circuit.json`,
                     expected: `${name}/EXPECTED.md`, intro: `${name}/intro.md`,
                     introDE: `${name}/intro.de.md` }
        });
        ok++;
    } catch (e) {
        console.log(`  ✗ ${name}: ${e.message.slice(0, 160)}`);
        fail++;
    }
}

console.log('German lesson canon — generating circuits...\n');

// ============================================================
//  555 SUITE
// ============================================================

// pc63: 555 bistabile Kippstufe (flip-flop / bistable)
// Two buttons (set/reset), one LED on output.
// Pin 2 (trigger) pulled high, pin 6 (threshold) pulled low.
// Set button grounds pin 2 → output goes HIGH → LED on.
// Reset button applies VCC to pin 6 → output goes LOW → LED off.
build('pc63-555-bistabil', '555 bistabile Kippstufe', '555 Bistable Flip-Flop', 2, (c) => {
    const vcc = c.addPart('vcc', {}, 100, 50);
    const gnd = c.addPart('gnd', {}, 100, 400);
    const timer = c.addPart('timer_555', {}, 300, 200);
    const rPull = c.addPart('resistor', { ohms: 10000 }, 150, 150);  // pull-up for trigger
    const rTh = c.addPart('resistor', { ohms: 10000 }, 450, 150);    // pull-down for threshold
    const btnSet = c.addPart('button', {}, 150, 300);    // set (grounds trigger)
    const btnReset = c.addPart('button', {}, 450, 300);  // reset (raises threshold)
    const rLed = c.addPart('resistor', { ohms: 1000 }, 300, 350);
    const led = c.addPart('led', { vf: 2.0, color: 'green' }, 300, 400);
    // Power
    c.addWire(vcc.id, 'vcc', timer.id, 'vcc');
    c.addWire(vcc.id, 'vcc', timer.id, 'reset');  // reset held HIGH
    c.addWire(gnd.id, 'gnd', timer.id, 'gnd');
    // Trigger pull-up + set button
    c.addWire(vcc.id, 'vcc', rPull.id, 'a');
    c.addWire(rPull.id, 'b', timer.id, 'trigger');
    c.addWire(timer.id, 'trigger', btnSet.id, 'a');
    c.addWire(btnSet.id, 'b', gnd.id, 'gnd');
    // Threshold pull-down + reset button
    c.addWire(gnd.id, 'gnd', rTh.id, 'a');
    c.addWire(rTh.id, 'b', timer.id, 'threshold');
    c.addWire(timer.id, 'threshold', btnReset.id, 'a');
    c.addWire(btnReset.id, 'b', vcc.id, 'vcc');
    // Discharge unconnected (tie to threshold)
    c.addWire(timer.id, 'discharge', timer.id, 'threshold');
    // Control bypass cap not needed for DC
    c.addWire(timer.id, 'control', gnd.id, 'gnd');  // simplification
    // Output → LED
    c.addWire(timer.id, 'output', rLed.id, 'a');
    c.addWire(rLed.id, 'b', led.id, 'anode');
    c.addWire(led.id, 'cathode', gnd.id, 'gnd');
});

// pc64: 555 retriggerbarer Monoflop (retriggerable one-shot)
// Similar to pc47 but with trigger held via RC + diode feedback.
// Trigger input pulled high, button grounds it.
// R=100k, C=10uF → t = 1.1*R*C = 1.1s pulse.
build('pc64-555-retrigger', '555 retriggerbarer Monoflop', '555 Retriggerable One-Shot', 2, (c) => {
    const vcc = c.addPart('vcc', {}, 100, 50);
    const gnd = c.addPart('gnd', {}, 100, 400);
    const timer = c.addPart('timer_555', {}, 300, 200);
    const rPull = c.addPart('resistor', { ohms: 10000 }, 150, 120);
    const btn = c.addPart('button', {}, 150, 300);
    const rt = c.addPart('resistor', { ohms: 100000 }, 450, 100);
    const ct = c.addPart('capacitor', { farads: 0.00001 }, 450, 300);
    const rLed = c.addPart('resistor', { ohms: 1000 }, 300, 350);
    const led = c.addPart('led', { vf: 2.0, color: 'red' }, 300, 400);
    // Power
    c.addWire(vcc.id, 'vcc', timer.id, 'vcc');
    c.addWire(vcc.id, 'vcc', timer.id, 'reset');
    c.addWire(gnd.id, 'gnd', timer.id, 'gnd');
    // Trigger: pull-up + button to ground
    c.addWire(vcc.id, 'vcc', rPull.id, 'a');
    c.addWire(rPull.id, 'b', timer.id, 'trigger');
    c.addWire(timer.id, 'trigger', btn.id, 'a');
    c.addWire(btn.id, 'b', gnd.id, 'gnd');
    // Timing: R from VCC to discharge, C from threshold to GND
    c.addWire(vcc.id, 'vcc', rt.id, 'a');
    c.addWire(rt.id, 'b', timer.id, 'discharge');
    c.addWire(timer.id, 'discharge', timer.id, 'threshold');
    c.addWire(timer.id, 'threshold', ct.id, 'pos');
    c.addWire(ct.id, 'neg', gnd.id, 'gnd');
    // Control pin bypass (not modelled, tie to ground through nothing)
    c.addWire(timer.id, 'control', gnd.id, 'gnd');
    // Output → LED
    c.addWire(timer.id, 'output', rLed.id, 'a');
    c.addWire(rLed.id, 'b', led.id, 'anode');
    c.addWire(led.id, 'cathode', gnd.id, 'gnd');
});

// pc65: 555 einstellbares Metronom (adjustable metronome)
// Astable mode with pot controlling frequency. R1=1k fixed, pot=100k, C=10uF.
// f = 1.44 / ((R1 + 2*Rpot) * C)
// Pot at 0 → f ≈ 144 Hz; pot at 100k → f ≈ 0.72 Hz
build('pc65-555-metronom', '555 einstellbares Metronom', '555 Adjustable Metronome', 2, (c) => {
    const vcc = c.addPart('vcc', {}, 100, 50);
    const gnd = c.addPart('gnd', {}, 100, 400);
    const timer = c.addPart('timer_555', {}, 300, 200);
    const r1 = c.addPart('resistor', { ohms: 1000 }, 200, 100);
    const pot = c.addPart('potentiometer', { ohms: 100000 }, 450, 100);
    const ct = c.addPart('capacitor', { farads: 0.00001 }, 450, 300);
    const buzzer = c.addPart('buzzer', {}, 300, 380);
    // Power
    c.addWire(vcc.id, 'vcc', timer.id, 'vcc');
    c.addWire(vcc.id, 'vcc', timer.id, 'reset');
    c.addWire(gnd.id, 'gnd', timer.id, 'gnd');
    // Astable timing: VCC → R1 → discharge, discharge → pot → threshold/trigger
    c.addWire(vcc.id, 'vcc', r1.id, 'a');
    c.addWire(r1.id, 'b', timer.id, 'discharge');
    c.addWire(timer.id, 'discharge', pot.id, 'a');
    c.addWire(pot.id, 'wiper', timer.id, 'threshold');
    c.addWire(timer.id, 'threshold', timer.id, 'trigger');
    c.addWire(pot.id, 'b', ct.id, 'pos');
    c.addWire(ct.id, 'neg', gnd.id, 'gnd');
    // Control bypass
    c.addWire(timer.id, 'control', gnd.id, 'gnd');
    // Output → buzzer
    c.addWire(timer.id, 'output', buzzer.id, 'pos');
    c.addWire(buzzer.id, 'neg', gnd.id, 'gnd');
});

// pc66: 555 Langzeit-Timer (long-duration timer)
// Monostable with large RC: R=1M, C=100uF → t = 1.1*1M*100u = 110 s ≈ 2 min.
// Button triggers, LED stays on for ~2 minutes.
build('pc66-555-langzeit', '555 Langzeit-Timer', '555 Long-Duration Timer', 2, (c) => {
    const vcc = c.addPart('vcc', {}, 100, 50);
    const gnd = c.addPart('gnd', {}, 100, 400);
    const timer = c.addPart('timer_555', {}, 300, 200);
    const rPull = c.addPart('resistor', { ohms: 10000 }, 150, 120);
    const btn = c.addPart('button', {}, 150, 300);
    const rt = c.addPart('resistor', { ohms: 1000000 }, 450, 100);
    const ct = c.addPart('capacitor', { farads: 0.0001 }, 450, 300);
    const rLed = c.addPart('resistor', { ohms: 1000 }, 300, 350);
    const led = c.addPart('led', { vf: 2.0, color: 'yellow' }, 300, 400);
    // Power
    c.addWire(vcc.id, 'vcc', timer.id, 'vcc');
    c.addWire(vcc.id, 'vcc', timer.id, 'reset');
    c.addWire(gnd.id, 'gnd', timer.id, 'gnd');
    // Trigger
    c.addWire(vcc.id, 'vcc', rPull.id, 'a');
    c.addWire(rPull.id, 'b', timer.id, 'trigger');
    c.addWire(timer.id, 'trigger', btn.id, 'a');
    c.addWire(btn.id, 'b', gnd.id, 'gnd');
    // Timing
    c.addWire(vcc.id, 'vcc', rt.id, 'a');
    c.addWire(rt.id, 'b', timer.id, 'discharge');
    c.addWire(timer.id, 'discharge', timer.id, 'threshold');
    c.addWire(timer.id, 'threshold', ct.id, 'pos');
    c.addWire(ct.id, 'neg', gnd.id, 'gnd');
    c.addWire(timer.id, 'control', gnd.id, 'gnd');
    // Output → LED
    c.addWire(timer.id, 'output', rLed.id, 'a');
    c.addWire(rLed.id, 'b', led.id, 'anode');
    c.addWire(led.id, 'cathode', gnd.id, 'gnd');
});

// pc67: 555 akustischer Tongenerator (audio tone generator with buzzer)
// Astable mode: R1=1k, R2=10k, C=100nF → f = 1.44/((1k+2*10k)*100n) ≈ 686 Hz
build('pc67-555-tongenerator', '555 akustischer Tongenerator', '555 Audio Tone Generator', 2, (c) => {
    const vcc = c.addPart('vcc', {}, 100, 50);
    const gnd = c.addPart('gnd', {}, 100, 400);
    const timer = c.addPart('timer_555', {}, 300, 200);
    const r1 = c.addPart('resistor', { ohms: 1000 }, 200, 100);
    const r2 = c.addPart('resistor', { ohms: 10000 }, 450, 100);
    const ct = c.addPart('capacitor', { farads: 0.0000001 }, 450, 300);
    const buzzer = c.addPart('buzzer', {}, 300, 380);
    // Power
    c.addWire(vcc.id, 'vcc', timer.id, 'vcc');
    c.addWire(vcc.id, 'vcc', timer.id, 'reset');
    c.addWire(gnd.id, 'gnd', timer.id, 'gnd');
    // Astable: VCC → R1 → discharge → R2 → threshold/trigger → C → GND
    c.addWire(vcc.id, 'vcc', r1.id, 'a');
    c.addWire(r1.id, 'b', timer.id, 'discharge');
    c.addWire(timer.id, 'discharge', r2.id, 'a');
    c.addWire(r2.id, 'b', timer.id, 'threshold');
    c.addWire(timer.id, 'threshold', timer.id, 'trigger');
    c.addWire(timer.id, 'threshold', ct.id, 'pos');
    c.addWire(ct.id, 'neg', gnd.id, 'gnd');
    c.addWire(timer.id, 'control', gnd.id, 'gnd');
    // Output → buzzer
    c.addWire(timer.id, 'output', buzzer.id, 'pos');
    c.addWire(buzzer.id, 'neg', gnd.id, 'gnd');
});

// pc68: 555 Sirene (two 555s — one modulates the other)
// Skipped for now — would need two 555s and the engine may not support that yet.
// Instead: simple 555 with pot for pitch control = a siren you turn by hand.
build('pc68-555-sirene', '555 Sirene mit Tonregler', '555 Siren with Pitch Control', 2, (c) => {
    const vcc = c.addPart('vcc', {}, 100, 50);
    const gnd = c.addPart('gnd', {}, 100, 400);
    const timer = c.addPart('timer_555', {}, 300, 200);
    const r1 = c.addPart('resistor', { ohms: 1000 }, 200, 100);
    const pot = c.addPart('potentiometer', { ohms: 47000 }, 450, 100);
    const ct = c.addPart('capacitor', { farads: 0.0000001 }, 450, 300);
    const rSpk = c.addPart('resistor', { ohms: 100 }, 300, 350);
    const buzzer = c.addPart('buzzer', {}, 300, 400);
    // Power
    c.addWire(vcc.id, 'vcc', timer.id, 'vcc');
    c.addWire(vcc.id, 'vcc', timer.id, 'reset');
    c.addWire(gnd.id, 'gnd', timer.id, 'gnd');
    // Astable with pot
    c.addWire(vcc.id, 'vcc', r1.id, 'a');
    c.addWire(r1.id, 'b', timer.id, 'discharge');
    c.addWire(timer.id, 'discharge', pot.id, 'a');
    c.addWire(pot.id, 'wiper', timer.id, 'threshold');
    c.addWire(timer.id, 'threshold', timer.id, 'trigger');
    c.addWire(pot.id, 'b', ct.id, 'pos');
    c.addWire(ct.id, 'neg', gnd.id, 'gnd');
    c.addWire(timer.id, 'control', gnd.id, 'gnd');
    // Output through small resistor to buzzer
    c.addWire(timer.id, 'output', rSpk.id, 'a');
    c.addWire(rSpk.id, 'b', buzzer.id, 'pos');
    c.addWire(buzzer.id, 'neg', gnd.id, 'gnd');
});

// ============================================================
//  GATTER (Logic gates)
// ============================================================

// pc69: Negator — NAND gate as inverter (both inputs tied together)
build('pc69-nand-inverter', 'Negator: NAND als Inverter', 'Inverter: NAND as NOT Gate', 2, (c) => {
    const vcc = c.addPart('vcc', {}, 100, 50);
    const gnd = c.addPart('gnd', {}, 100, 400);
    const gate = c.addPart('gate_nand', { inputs: 2 }, 300, 200);
    const sw = c.addPart('switch', {}, 150, 200);
    const rPd = c.addPart('resistor', { ohms: 10000 }, 150, 300);
    const rLed = c.addPart('resistor', { ohms: 1000 }, 450, 200);
    const led = c.addPart('led', { vf: 2.0, color: 'red' }, 450, 300);
    // Gate power (abstract gates may not need it, but wire it)
    // Input: switch + pull-down → both NAND inputs tied
    c.addWire(vcc.id, 'vcc', sw.id, 'a');
    c.addWire(sw.id, 'b', gate.id, 'in0');
    c.addWire(sw.id, 'b', gate.id, 'in1');  // tie inputs
    c.addWire(sw.id, 'b', rPd.id, 'a');
    c.addWire(rPd.id, 'b', gnd.id, 'gnd');
    // Output → LED
    c.addWire(gate.id, 'out', rLed.id, 'a');
    c.addWire(rLed.id, 'b', led.id, 'anode');
    c.addWire(led.id, 'cathode', gnd.id, 'gnd');
});

// pc70: Schmitt-Trigger demo (slow ramp vs clean edges)
// Using a gate_nand with RC input to show hysteresis concept.
// RC ramp on input, LED on output shows clean switching.
build('pc70-schmitt-trigger', 'Schmitt-Trigger: saubere Flanken', 'Schmitt Trigger: Clean Edges', 2, (c) => {
    const vcc = c.addPart('vcc', {}, 100, 50);
    const gnd = c.addPart('gnd', {}, 100, 400);
    const gate = c.addPart('gate_nand', { inputs: 2 }, 300, 200);
    const rRamp = c.addPart('resistor', { ohms: 100000 }, 150, 100);
    const cRamp = c.addPart('capacitor', { farads: 0.00001 }, 150, 300);
    const rLed = c.addPart('resistor', { ohms: 1000 }, 450, 200);
    const led = c.addPart('led', { vf: 2.0, color: 'yellow' }, 450, 300);
    // RC ramp → both inputs
    c.addWire(vcc.id, 'vcc', rRamp.id, 'a');
    c.addWire(rRamp.id, 'b', cRamp.id, 'pos');
    c.addWire(cRamp.id, 'neg', gnd.id, 'gnd');
    c.addWire(rRamp.id, 'b', gate.id, 'in0');
    c.addWire(rRamp.id, 'b', gate.id, 'in1');
    // Output
    c.addWire(gate.id, 'out', rLed.id, 'a');
    c.addWire(rLed.id, 'b', led.id, 'anode');
    c.addWire(led.id, 'cathode', gnd.id, 'gnd');
});

// pc71: Prellfreier Schalter (debounced switch using NAND SR latch)
// Two NAND gates cross-coupled as SR latch, SPDT switch provides set/reset.
build('pc71-nand-entpreller', 'Prellfreier Schalter (NAND-Latch)', 'Debounced Switch (NAND Latch)', 3, (c) => {
    const vcc = c.addPart('vcc', {}, 100, 50);
    const gnd = c.addPart('gnd', {}, 100, 400);
    const g1 = c.addPart('gate_nand', { inputs: 2 }, 300, 150);
    const g2 = c.addPart('gate_nand', { inputs: 2 }, 300, 300);
    const btnSet = c.addPart('button', {}, 100, 150);
    const btnReset = c.addPart('button', {}, 100, 300);
    const rPu1 = c.addPart('resistor', { ohms: 10000 }, 200, 100);
    const rPu2 = c.addPart('resistor', { ohms: 10000 }, 200, 350);
    const rLed = c.addPart('resistor', { ohms: 1000 }, 450, 150);
    const led = c.addPart('led', { vf: 2.0, color: 'green' }, 450, 250);
    // Pull-ups on NAND inputs
    c.addWire(vcc.id, 'vcc', rPu1.id, 'a');
    c.addWire(rPu1.id, 'b', g1.id, 'in0');
    c.addWire(vcc.id, 'vcc', rPu2.id, 'a');
    c.addWire(rPu2.id, 'b', g2.id, 'in1');
    // Buttons pull inputs low (active-low set/reset)
    c.addWire(g1.id, 'in0', btnSet.id, 'a');
    c.addWire(btnSet.id, 'b', gnd.id, 'gnd');
    c.addWire(g2.id, 'in1', btnReset.id, 'a');
    c.addWire(btnReset.id, 'b', gnd.id, 'gnd');
    // Cross-coupling: Q of g1 → input of g2, Q of g2 → input of g1
    c.addWire(g1.id, 'out', g2.id, 'in0');
    c.addWire(g2.id, 'out', g1.id, 'in1');
    // Output (Q = g1 output) → LED
    c.addWire(g1.id, 'out', rLed.id, 'a');
    c.addWire(rLed.id, 'b', led.id, 'anode');
    c.addWire(led.id, 'cathode', gnd.id, 'gnd');
});

// ============================================================
//  LICHT (Light-controlled circuits)
// ============================================================

// pc72: Tagschaltung (daytime circuit — LED on when bright)
// LDR + NPN: bright → LDR low R → base current → LED on.
build('pc72-tagschaltung', 'Tagschaltung: LED bei Helligkeit', 'Daytime Switch: LED On When Bright', 2, (c) => {
    const vcc = c.addPart('vcc', {}, 100, 50);
    const gnd = c.addPart('gnd', {}, 100, 400);
    const ldr = c.addPart('ldr', { minOhms: 1000, maxOhms: 100000 }, 150, 150);
    const rBase = c.addPart('resistor', { ohms: 10000 }, 250, 250);
    const npn = c.addPart('npn', { beta: 100 }, 350, 200);
    const rLed = c.addPart('resistor', { ohms: 470 }, 350, 100);
    const led = c.addPart('led', { vf: 2.0, color: 'white' }, 450, 100);
    // LDR voltage divider: VCC → LDR → junction → R → GND
    c.addWire(vcc.id, 'vcc', ldr.id, 'a');
    c.addWire(ldr.id, 'b', rBase.id, 'a');
    c.addWire(rBase.id, 'b', gnd.id, 'gnd');
    // Junction drives NPN base
    c.addWire(ldr.id, 'b', npn.id, 'base');
    // Collector: VCC → R → LED → collector
    c.addWire(vcc.id, 'vcc', rLed.id, 'a');
    c.addWire(rLed.id, 'b', led.id, 'anode');
    c.addWire(led.id, 'cathode', npn.id, 'collector');
    // Emitter → GND
    c.addWire(npn.id, 'emitter', gnd.id, 'gnd');
});

// pc73: Nachtschaltung (night light — LED on when dark)
// LDR + NPN: dark → LDR high R → voltage divider gives more base voltage.
// Swap LDR and resistor positions from Tagschaltung.
build('pc73-nachtschaltung', 'Nachtschaltung: LED bei Dunkelheit', 'Night Switch: LED On When Dark', 2, (c) => {
    const vcc = c.addPart('vcc', {}, 100, 50);
    const gnd = c.addPart('gnd', {}, 100, 400);
    const rTop = c.addPart('resistor', { ohms: 10000 }, 150, 150);
    const ldr = c.addPart('ldr', { minOhms: 1000, maxOhms: 100000 }, 250, 250);
    const npn = c.addPart('npn', { beta: 100 }, 350, 200);
    const rLed = c.addPart('resistor', { ohms: 470 }, 350, 100);
    const led = c.addPart('led', { vf: 2.0, color: 'white' }, 450, 100);
    // Divider: VCC → R → junction → LDR → GND
    c.addWire(vcc.id, 'vcc', rTop.id, 'a');
    c.addWire(rTop.id, 'b', ldr.id, 'a');
    c.addWire(ldr.id, 'b', gnd.id, 'gnd');
    // Junction drives NPN base
    c.addWire(rTop.id, 'b', npn.id, 'base');
    // Collector load
    c.addWire(vcc.id, 'vcc', rLed.id, 'a');
    c.addWire(rLed.id, 'b', led.id, 'anode');
    c.addWire(led.id, 'cathode', npn.id, 'collector');
    c.addWire(npn.id, 'emitter', gnd.id, 'gnd');
});

// pc74: Helligkeitsabhängige Beleuchtung (LDR + 555)
// LDR in astable 555 timing path: darkness → higher LDR → slower blink.
build('pc74-ldr-555-blinker', 'LDR-gesteuerter 555-Blinker', 'LDR-Controlled 555 Blinker', 3, (c) => {
    const vcc = c.addPart('vcc', {}, 100, 50);
    const gnd = c.addPart('gnd', {}, 100, 400);
    const timer = c.addPart('timer_555', {}, 300, 200);
    const r1 = c.addPart('resistor', { ohms: 1000 }, 200, 100);
    const ldr = c.addPart('ldr', { minOhms: 1000, maxOhms: 100000 }, 450, 100);
    const ct = c.addPart('capacitor', { farads: 0.00001 }, 450, 300);
    const rLed = c.addPart('resistor', { ohms: 1000 }, 300, 350);
    const led = c.addPart('led', { vf: 2.0, color: 'red' }, 300, 400);
    // Power
    c.addWire(vcc.id, 'vcc', timer.id, 'vcc');
    c.addWire(vcc.id, 'vcc', timer.id, 'reset');
    c.addWire(gnd.id, 'gnd', timer.id, 'gnd');
    // Astable: VCC → R1 → discharge → LDR → threshold/trigger → C → GND
    c.addWire(vcc.id, 'vcc', r1.id, 'a');
    c.addWire(r1.id, 'b', timer.id, 'discharge');
    c.addWire(timer.id, 'discharge', ldr.id, 'a');
    c.addWire(ldr.id, 'b', timer.id, 'threshold');
    c.addWire(timer.id, 'threshold', timer.id, 'trigger');
    c.addWire(timer.id, 'threshold', ct.id, 'pos');
    c.addWire(ct.id, 'neg', gnd.id, 'gnd');
    c.addWire(timer.id, 'control', gnd.id, 'gnd');
    // Output → LED
    c.addWire(timer.id, 'output', rLed.id, 'a');
    c.addWire(rLed.id, 'b', led.id, 'anode');
    c.addWire(led.id, 'cathode', gnd.id, 'gnd');
});

// ============================================================
//  ALARM
// ============================================================

// pc75: Alarmgeber (alarm sounder — button activates 555 astable buzzer)
build('pc75-alarmgeber', 'Alarmgeber: Taster aktiviert Sirene', 'Alarm Sounder: Button Activates Siren', 2, (c) => {
    const vcc = c.addPart('vcc', {}, 100, 50);
    const gnd = c.addPart('gnd', {}, 100, 400);
    const timer = c.addPart('timer_555', {}, 300, 200);
    const btn = c.addPart('button', {}, 100, 200);
    const r1 = c.addPart('resistor', { ohms: 1000 }, 200, 100);
    const r2 = c.addPart('resistor', { ohms: 10000 }, 450, 100);
    const ct = c.addPart('capacitor', { farads: 0.0000001 }, 450, 300);
    const buzzer = c.addPart('buzzer', {}, 300, 380);
    // Button in VCC path — only powers 555 when pressed
    c.addWire(vcc.id, 'vcc', btn.id, 'a');
    c.addWire(btn.id, 'b', timer.id, 'vcc');
    c.addWire(btn.id, 'b', timer.id, 'reset');
    c.addWire(gnd.id, 'gnd', timer.id, 'gnd');
    // Astable
    c.addWire(btn.id, 'b', r1.id, 'a');
    c.addWire(r1.id, 'b', timer.id, 'discharge');
    c.addWire(timer.id, 'discharge', r2.id, 'a');
    c.addWire(r2.id, 'b', timer.id, 'threshold');
    c.addWire(timer.id, 'threshold', timer.id, 'trigger');
    c.addWire(timer.id, 'threshold', ct.id, 'pos');
    c.addWire(ct.id, 'neg', gnd.id, 'gnd');
    c.addWire(timer.id, 'control', gnd.id, 'gnd');
    // Output → buzzer
    c.addWire(timer.id, 'output', buzzer.id, 'pos');
    c.addWire(buzzer.id, 'neg', gnd.id, 'gnd');
});

// pc76: Alarmschaltung (alarm circuit — reed/tilt switch + NOR latch + buzzer)
// NOR SR latch remembers the alarm. Reed switch triggers set.
// Reset button clears.
build('pc76-alarmschaltung', 'Alarmschaltung: Kontaktschalter mit Speicher', 'Alarm Circuit: Contact Switch with Memory', 3, (c) => {
    const vcc = c.addPart('vcc', {}, 100, 50);
    const gnd = c.addPart('gnd', {}, 100, 400);
    const g1 = c.addPart('gate_nor', { inputs: 2 }, 300, 150);
    const g2 = c.addPart('gate_nor', { inputs: 2 }, 300, 300);
    const swAlarm = c.addPart('switch', {}, 100, 150);   // alarm trigger (reed/tilt)
    const btnReset = c.addPart('button', {}, 100, 300);  // reset
    const rPd1 = c.addPart('resistor', { ohms: 100000 }, 200, 100);
    const rPd2 = c.addPart('resistor', { ohms: 100000 }, 200, 350);
    const rBuz = c.addPart('resistor', { ohms: 100 }, 450, 150);
    const buzzer = c.addPart('buzzer', {}, 450, 250);
    // Set input: switch → NOR g1 in0, pull-down
    c.addWire(vcc.id, 'vcc', swAlarm.id, 'a');
    c.addWire(swAlarm.id, 'b', g1.id, 'in0');
    c.addWire(g1.id, 'in0', rPd1.id, 'a');
    c.addWire(rPd1.id, 'b', gnd.id, 'gnd');
    // Reset input: button → NOR g2 in1, pull-down
    c.addWire(vcc.id, 'vcc', btnReset.id, 'a');
    c.addWire(btnReset.id, 'b', g2.id, 'in1');
    c.addWire(g2.id, 'in1', rPd2.id, 'a');
    c.addWire(rPd2.id, 'b', gnd.id, 'gnd');
    // Cross-coupling
    c.addWire(g1.id, 'out', g2.id, 'in0');
    c.addWire(g2.id, 'out', g1.id, 'in1');
    // Q output (g1) → buzzer
    c.addWire(g1.id, 'out', rBuz.id, 'a');
    c.addWire(rBuz.id, 'b', buzzer.id, 'pos');
    c.addWire(buzzer.id, 'neg', gnd.id, 'gnd');
});

// ============================================================
//  MESSTECHNIK (Measurement technique)
// ============================================================

// pc77: Leerlauf- und Klemmenspannung (open-circuit vs loaded voltage)
// Battery with internal resistance. No load → V_bat. With load → V < V_bat.
build('pc77-klemmenspannung', 'Leerlauf- und Klemmenspannung', 'Open-Circuit vs Terminal Voltage', 2, (c) => {
    const bat = c.addPart('battery', { volts: 9, rInternal: 1.0 }, 100, 200);
    const rLoad = c.addPart('resistor', { ohms: 100 }, 300, 200);
    const rLed = c.addPart('resistor', { ohms: 470 }, 400, 150);
    const led = c.addPart('led', { vf: 2.0, color: 'red' }, 400, 250);
    // Battery → load resistor (shows voltage drop from internal R)
    c.addWire(bat.id, 'pos', rLoad.id, 'a');
    c.addWire(rLoad.id, 'b', bat.id, 'neg');
    // LED indicator on the load
    c.addWire(bat.id, 'pos', rLed.id, 'a');
    c.addWire(rLed.id, 'b', led.id, 'anode');
    c.addWire(led.id, 'cathode', bat.id, 'neg');
});

// pc78: Belastete Quelle (loaded source — battery sags under load)
// Two loads, different R, show different terminal voltages.
build('pc78-belastete-quelle', 'Belastete Quelle: Spannungseinbruch', 'Loaded Source: Voltage Sag', 2, (c) => {
    const bat = c.addPart('battery', { volts: 9, rInternal: 2.0 }, 100, 200);
    const rLight = c.addPart('resistor', { ohms: 1000 }, 300, 100);
    const rHeavy = c.addPart('resistor', { ohms: 100 }, 300, 300);
    const led1 = c.addPart('led', { vf: 2.0, color: 'green' }, 450, 100);
    const led2 = c.addPart('led', { vf: 2.0, color: 'red' }, 450, 300);
    const rLed1 = c.addPart('resistor', { ohms: 470 }, 400, 80);
    const rLed2 = c.addPart('resistor', { ohms: 470 }, 400, 280);
    // Light load path
    c.addWire(bat.id, 'pos', rLight.id, 'a');
    c.addWire(rLight.id, 'b', rLed1.id, 'a');
    c.addWire(rLed1.id, 'b', led1.id, 'anode');
    c.addWire(led1.id, 'cathode', bat.id, 'neg');
    // Heavy load path
    c.addWire(bat.id, 'pos', rHeavy.id, 'a');
    c.addWire(rHeavy.id, 'b', rLed2.id, 'a');
    c.addWire(rLed2.id, 'b', led2.id, 'anode');
    c.addWire(led2.id, 'cathode', bat.id, 'neg');
});

// pc79: Indirekte Strommessung (indirect current measurement)
// A small shunt resistor in series, voltage across it = I * R_shunt.
build('pc79-indirekte-strommessung', 'Indirekte Strommessung: Shunt-Widerstand', 'Indirect Current Measurement: Shunt Resistor', 2, (c) => {
    const bat = c.addPart('battery', { volts: 9, rInternal: 0.5 }, 100, 200);
    const rShunt = c.addPart('resistor', { ohms: 1 }, 250, 200);
    const rLoad = c.addPart('resistor', { ohms: 470 }, 350, 200);
    const led = c.addPart('led', { vf: 2.0, color: 'red' }, 450, 200);
    // Battery → shunt → load → LED → battery
    c.addWire(bat.id, 'pos', rShunt.id, 'a');
    c.addWire(rShunt.id, 'b', rLoad.id, 'a');
    c.addWire(rLoad.id, 'b', led.id, 'anode');
    c.addWire(led.id, 'cathode', bat.id, 'neg');
});

// pc80: Spannungsquellen vergleichen (comparing voltage sources)
// Two batteries with different internal resistances driving same load.
build('pc80-quellen-vergleich', 'Spannungsquellen vergleichen', 'Comparing Voltage Sources', 2, (c) => {
    const bat1 = c.addPart('battery', { volts: 9, rInternal: 0.5 }, 100, 100);
    const bat2 = c.addPart('battery', { volts: 9, rInternal: 5.0 }, 100, 300);
    const r1 = c.addPart('resistor', { ohms: 470 }, 300, 100);
    const r2 = c.addPart('resistor', { ohms: 470 }, 300, 300);
    const led1 = c.addPart('led', { vf: 2.0, color: 'green' }, 450, 100);
    const led2 = c.addPart('led', { vf: 2.0, color: 'red' }, 450, 300);
    // Battery 1 (low internal R) → R → LED → return
    c.addWire(bat1.id, 'pos', r1.id, 'a');
    c.addWire(r1.id, 'b', led1.id, 'anode');
    c.addWire(led1.id, 'cathode', bat1.id, 'neg');
    // Battery 2 (high internal R) → R → LED → return
    c.addWire(bat2.id, 'pos', r2.id, 'a');
    c.addWire(r2.id, 'b', led2.id, 'anode');
    c.addWire(led2.id, 'cathode', bat2.id, 'neg');
});

console.log(`\n${ok} succeeded, ${fail} failed.`);
if (fail) process.exitCode = 1;

console.log('\nIndex entries:');
for (const e of entries) {
    console.log(JSON.stringify(e));
}
