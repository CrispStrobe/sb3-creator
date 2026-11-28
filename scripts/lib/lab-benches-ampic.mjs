/**
 * Netlists for two benches built on the LM386 power-amp IC, written by
 * `node scripts/gen-lab-circuits-4.mjs --set=ampic`.
 *
 * lab-led-amp-switch: an LED used backwards as a light sensor. Its tiny
 * photovoltage on the LM386's + input (50 kΩ to ground inside the chip) is
 * amplified 20 times, DC coupled, against a LEVEL voltage on the − input;
 * the amplifier's output drives an NPN that switches a lamp LED.
 *
 * lab-voice-motor: the loudspeaker as a microphone into an LM386 at gain 200,
 * then an LM358: section 1 amplifies 45 times more, a diode pump turns that
 * into an envelope, and section 2 compares it with a THRESHOLD and, while the
 * sound lasts, sinks the base current of a PNP that runs a DC motor.
 *
 * Same shape as lab-benches-4.mjs: pure data, so test/lab-circuits-ampic.test.mjs
 * names parts by role. Ids follow benchIds (breadboard first, then the parts
 * in the order listed).
 */
import { benchIds } from './lab-benches-4.mjs';
export { benchIds };

const SUP = { pos: 'bat.pos', neg: 'bat.neg' };
const R = (ohms) => ['resistor', { ohms }];
const C = (farads) => ['capacitor', { farads }];
const EL = (farads) => ['polarized_cap', { farads }];
const LED = (color) => ['led', { color }];
const POT = (ohms, position) => ['potentiometer', { ohms, position }];
const SI = ['diode', { part: '1N4148' }];
const BAT9 = ['vsource', { volts: 9, variant: '9v' }];
const LM386 = ['lm386', {}];
const NPN = ['npn', { beta: 100 }];
const PNP = ['pnp', { beta: 100 }];
const VM = ['voltmeter', {}];

export const BENCHES = {
    // The LED light switch. The sensor is a red LED with no bias at all: light
    // drives up to 5 µA out of its anode (photoSensitivity, at full light)
    // into the LM386's + input, whose 50 kΩ to ground turns it into at most
    // 0.25 V. LEVEL (10 kΩ pot under 150 kΩ from +9 V) puts 0 to about
    // 0.5 V on the − input. The chip, gain pins open, makes Vs/2 + 20 × (+ − −) of the
    // difference, DC coupled, inside its 0.9 V to 8.1 V swing: dark, the
    // output sits at the bottom; light above the LEVEL voltage lifts it.
    // 10 kΩ over 10 kΩ from the output divides it to the NPN's base, so the
    // transistor stays off until the output passes about 1.3 V and saturates
    // near 3 V: the collector LED (390 Ω from +9 V) lights. The
    // voltmeter reads the amplifier's output. 10 µF steadies BYPASS.
    'lab-led-amp-switch': {
        vcc: 9, supply: SUP,
        parts: { bat: BAT9, sensor: ['led', { color: 'red', photoSensitivity: 5e-6 }], u: LM386,
            rs: R(150000), level: POT(10000, 0.45), cb: EL(10e-6), vm: VM,
            rb: R(10000), rbe: R(10000), q: NPN, rl: R(390), lamp: LED('yellow') },
        nets: [
            ['bat.pos', 'u.vs', 'rs.a', 'rl.a'],
            ['sensor.anode', 'u.inp'], ['rs.b', 'level.a'], ['level.wiper', 'u.inn'],
            ['u.bypass', 'cb.pos'],
            ['u.vout', 'vm.a', 'rb.a'], ['rb.b', 'rbe.a', 'q.base'],
            ['rl.b', 'lamp.anode'], ['lamp.cathode', 'q.collector'],
            ['bat.neg', 'u.gnd', 'sensor.cathode', 'level.b', 'cb.neg', 'vm.b', 'rbe.b', 'q.emitter'],
        ],
        open: ['u.gain1', 'u.gain8'],
    },

    // Sound starts the motor. The loudspeaker, used as a microphone, drives
    // the LM386's + input directly (− input grounded); 10 µF across the gain
    // pins sets gain 200. That is not enough on its own: a voice-loud 80 dB
    // gives the speaker about 0.3 mV, so the LM386 makes some 60 mV of it.
    // LM358 section 1 takes the LM386's output through 1 µF and 2.2 kΩ into
    // an inverting stage (100 kΩ feedback, gain 45) around a 4.5 V midpoint
    // (10 kΩ / 10 kΩ, 10 µF). Its output passes 220 nF into a diode pump (two
    // 1N4148, 4.7 kΩ to ground so the switch-on ramps do not pump) that
    // charges the ENVELOPE capacitor, 1 µF with 1 MΩ across it (about a
    // second to fall). Section 2 compares the envelope (− input) with
    // THRESHOLD (10 kΩ pot under 47 kΩ from +9 V, 0 to 1.6 V) on its + input.
    // 470 kΩ from its output back to the + input adds a little hysteresis
    // (about 70 mV) so it snaps over instead of lingering half-way while the
    // envelope drifts through. In silence its output is high; once the
    // envelope passes THRESHOLD it falls to ground and sinks the PNP's base
    // current through 680 Ω and a red RUN LED. The PNP (emitter on +9 V, 10 kΩ base to emitter holding it
    // off) then runs the DC motor from its collector; a 1N4148 catches the
    // motor's switch-off spike.
    'lab-voice-motor': {
        vcc: 9, supply: SUP,
        parts: { bat: BAT9, mic: ['speaker', { ohms: 8, soundDb: 0, soundWave: 'tone', soundHz: 400 }], u: LM386,
            cg: EL(10e-6), cb: EL(10e-6), w: ['lm358', {}],
            ca: EL(1e-6), ri: R(2200), rf: R(100000), rm1: R(10000), rm2: R(10000), cm: EL(10e-6),
            cp: C(220e-9), rp: R(4700), d1: SI, d2: SI, ch: C(1e-6), rdis: R(1000000),
            rt: R(47000), thr: POT(10000, 0.5), rh: R(470000),
            rb: R(680), run: LED('red'), rbe: R(10000), q: PNP,
            m: ['dc_motor', { J: 5e-6, loadTorque: 0.002 }], df: SI },
        nets: [
            ['bat.pos', 'u.vs', 'w.vcc', 'rm1.a', 'rt.a', 'q.emitter', 'rbe.a'],
            ['mic.a', 'u.inp'], ['u.gain1', 'cg.pos'], ['u.gain8', 'cg.neg'], ['u.bypass', 'cb.pos'],
            ['u.vout', 'ca.pos'], ['ca.neg', 'ri.a'], ['ri.b', 'rf.a', 'w.1_neg'],
            ['rm1.b', 'rm2.a', 'cm.pos', 'w.1_pos'],
            ['w.1_out', 'rf.b', 'cp.a'], ['cp.b', 'rp.a', 'd1.cathode', 'd2.anode'],
            ['d2.cathode', 'ch.a', 'rdis.a', 'w.2_neg'],
            ['rt.b', 'thr.a'], ['thr.wiper', 'rh.a', 'w.2_pos'],
            ['w.2_out', 'rh.b', 'run.cathode'], ['run.anode', 'rb.a'], ['rb.b', 'rbe.b', 'q.base'],
            ['q.collector', 'm.a', 'df.cathode'],
            ['bat.neg', 'mic.b', 'u.inn', 'u.gnd', 'cb.neg', 'rm2.b', 'cm.neg', 'rp.b', 'd1.anode', 'ch.b', 'rdis.b', 'thr.b',
                'w.gnd', 'm.b', 'df.anode'],
        ],
    },
};

// Labels the learner sees on the controls and readouts the pages name.
const LABELS = {
    'lab-led-amp-switch': { sensor: 'sensor LED (used backwards)', level: 'LEVEL', vm: 'amplifier output', lamp: 'LAMP' },
    'lab-voice-motor': { mic: 'loudspeaker as microphone', thr: 'THRESHOLD', ch: 'ENVELOPE', run: 'RUN', m: 'motor' },
};
for (const [id, names] of Object.entries(LABELS))
    for (const [name, label] of Object.entries(names)) {
        const [kind, params] = BENCHES[id].parts[name];
        BENCHES[id].parts[name] = [kind, params, label];
    }
