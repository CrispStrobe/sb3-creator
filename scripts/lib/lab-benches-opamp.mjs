/**
 * Netlists for the op-amp measuring benches: integrators (a tilting table, a
 * stepped store with a meter, a three-LED timer), meter rectifiers (a
 * sound-level meter, a radio level indicator, a bridge in the feedback loop)
 * and an ohmmeter with a linear scale, written by
 * `node scripts/gen-lab-circuits-4.mjs --set=opamp`.
 *
 * Same shape as lab-benches-4.mjs: pure data, so test/lab-circuits-opamp.test.mjs
 * names parts by role. Ids follow benchIds (breadboard first, then the parts
 * in the order listed).
 *
 * One op-amp per bench: each uses ONE half of an LM358 (the engine's
 * ground-sensing macromodel: inputs down to ground, output from about 5 mV
 * up to VCC − 1.5 V, 1 MHz, 0.3 V/µs); the other half is parked as a
 * grounded follower. Every further stage (end-stop and threshold LEDs,
 * microphone gain, a reference buffer) is a discrete transistor.
 * Integrator capacitors are non-polar (`capacitor`): their voltage changes
 * sign with the direction of the ramp.
 */
import { benchIds } from './lab-benches-4.mjs';
export { benchIds };

const SUP = { pos: 'bat.pos', neg: 'bat.neg' };
const R = (ohms) => ['resistor', { ohms }];
const C = (farads) => ['capacitor', { farads }];
const EL = (farads) => ['polarized_cap', { farads }];
const LED = (color) => ['led', { color }];
const POT = (ohms, position) => ['potentiometer', { ohms, position }];
const SW = (position) => ['slide_switch', { position }];
const BTN = ['button', {}];
const SI = ['diode', { part: '1N4148' }];
const GE = ['diode', { part: '1N34A' }];
const NPN = ['npn', { beta: 100 }];
const PNP = ['pnp', { beta: 100 }];
const BAT9 = ['vsource', { volts: 9, variant: '9v' }];
const OPAMP = ['lm358', {}];
/** The unused half of the LM358, parked as a grounded follower. */
const PARK = ['u.2_pos', 'u.2_neg', 'u.2_out'];

export const BENCHES = {
    // The tilting table. 10 kΩ / 10 kΩ put 4.5 V on the + input. The "tilt"
    // knob is a 10 kΩ pot between two 22 kΩ resistors, so its wiper moves
    // about ±0.8 V around 4.5 V. The op-amp integrates the wiper against
    // 4.5 V (100 kΩ, 2.2 µF): its output is the ball, and it starts in the
    // middle because the capacitor starts empty. The end stops are two
    // transistors on dividers from the ball: the NPN (9.1 kΩ / 1 kΩ to
    // ground) lights the right-hand LED as the ball climbs past about 7.0 V,
    // the PNP (9.1 kΩ / 1 kΩ to +9 V) the left-hand LED as it falls below
    // about 2.0 V. The pot's ends are wired so that turning it right sends
    // the ball right.
    'lab-tilt-table': {
        vcc: 9, supply: SUP,
        parts: { bat: BAT9, u: OPAMP, ra: R(10000), rb: R(10000),
            ta: R(22000), tilt: POT(10000, 0.5), tb: R(22000),
            ri: R(100000), ci: C(2.2e-6),
            hr: R(9100), lr: R(1000), qr: NPN, cr: R(1000), right: LED('green'),
            hl: R(9100), ll: R(1000), ql: PNP, cl: R(1000), left: LED('red') },
        nets: [
            ['bat.pos', 'u.vcc', 'ra.a', 'ta.a', 'cr.a', 'll.a', 'ql.emitter'],
            ['ra.b', 'rb.a', 'u.1_pos'],
            ['ta.b', 'tilt.b'], ['tilt.a', 'tb.a'], ['tilt.wiper', 'ri.a'],
            ['ri.b', 'ci.a', 'u.1_neg'], ['u.1_out', 'ci.b', 'hr.a', 'hl.a'],
            ['hr.b', 'lr.a', 'qr.base'], ['cr.b', 'right.anode'], ['right.cathode', 'qr.collector'],
            ['hl.b', 'll.b', 'ql.base'], ['ql.collector', 'cl.a'], ['cl.b', 'left.anode'],
            ['bat.neg', 'u.gnd', 'rb.b', 'tb.b', 'lr.b', 'qr.emitter', 'left.cathode', ...PARK],
        ],
    },

    // A store that counts taps. A PNP emitter follower (base on 82 kΩ /
    // 9.1 kΩ, emitter pulled up by 4.7 kΩ) holds a reference near 1.7 V that
    // can take current back; the op-amp integrates onto 10 µF around it.
    // Each button is a diode charge pump: a 1 µF capacitor whose free end is
    // held at one rail by 22 kΩ and thrown to the other rail (through 1 kΩ)
    // by the button. "Up" pulls charge out of the summing node through one
    // diode and refills from the reference through the other on release;
    // "down" is the mirror image. Each tap moves the output by the same
    // step, however long the button is held. The meter (6 V full scale,
    // 1 mA movement) reads output minus reference; the diode across it
    // limits a backwards swing to a few tenths of a volt; 1 kΩ in the
    // op-amp's output lead keeps that diode from dragging the reference
    // down. "Zero" empties the integrator through 100 Ω.
    'lab-tap-integrator': {
        vcc: 9, supply: SUP,
        parts: { bat: BAT9, u: OPAMP, ra: R(82000), rb: R(9100), qref: PNP, re: R(4700),
            ci: C(10e-6), zero: BTN, rz: R(100),
            up: BTN, ru: R(1000), pu: R(22000), cu: C(1e-6), du1: SI, du2: SI,
            dn: BTN, rd: R(1000), pd: R(22000), cd: C(1e-6), dd1: SI, dd2: SI,
            ro: R(1000), meter: ['analog_meter', { fullScale: 6, ifs: 0.001 }], dm: SI },
        nets: [
            ['bat.pos', 'u.vcc', 'ra.a', 're.a', 'pu.a', 'dn.a'],
            ['ra.b', 'rb.a', 'qref.base'],
            ['qref.emitter', 're.b', 'u.1_pos', 'du2.cathode', 'dd2.anode', 'meter.b', 'dm.anode'],
            ['u.1_neg', 'ci.a', 'zero.a', 'du1.anode', 'dd1.cathode'],
            ['zero.b', 'rz.a'], ['u.1_out', 'ro.a'], ['ro.b', 'rz.b', 'ci.b', 'meter.a', 'dm.cathode'],
            ['pu.b', 'cu.a', 'up.a'], ['up.b', 'ru.a'], ['cu.b', 'du1.cathode', 'du2.anode'],
            ['dn.b', 'rd.a'], ['rd.b', 'pd.a', 'cd.a'], ['cd.b', 'dd1.anode', 'dd2.cathode'],
            ['bat.neg', 'u.gnd', 'rb.b', 'qref.collector', 'ru.b', 'pd.b', ...PARK],
        ],
    },

    // A ramp timer. 82 kΩ / 10 kΩ put about 1 V on the + input. The input
    // resistor (47 kΩ plus a 220 kΩ "time" rheostat) goes through the
    // hold/run switch either to that same 1 V (hold: no current, the ramp
    // stops) or to ground (run: 1 V across the resistor, the output climbs
    // at a steady rate onto 4.7 µF). Three NPN stages watch the ramp through
    // dividers to 1 kΩ (3.3 kΩ, 6.2 kΩ, 9.1 kΩ on top) and light green,
    // yellow and red as it passes about 3, 5 and 7 V. "Zero" empties the
    // capacitor through 100 Ω.
    'lab-ramp-timer': {
        vcc: 9, supply: SUP,
        parts: { bat: BAT9, u: OPAMP, ra: R(82000), rb: R(10000),
            run: SW(1), rin: R(47000), time: POT(220000, 1), ci: C(4.7e-6), zero: BTN, rz: R(100),
            h1: R(3300), b1: R(1000), q1: NPN, c1: R(1000), g: LED('green'),
            h2: R(6200), b2: R(1000), q2: NPN, c2: R(1000), y: LED('yellow'),
            h3: R(9100), b3: R(1000), q3: NPN, c3: R(1000), r: LED('red') },
        nets: [
            ['bat.pos', 'u.vcc', 'ra.a', 'c1.a', 'c2.a', 'c3.a'],
            ['ra.b', 'rb.a', 'u.1_pos', 'run.a'],
            ['run.com', 'rin.a'], ['rin.b', 'time.a'], ['time.wiper', 'time.b', 'ci.a', 'zero.a', 'u.1_neg'],
            ['zero.b', 'rz.a'], ['rz.b', 'ci.b', 'u.1_out', 'h1.a', 'h2.a', 'h3.a'],
            ['h1.b', 'b1.a', 'q1.base'], ['c1.b', 'g.anode'], ['g.cathode', 'q1.collector'],
            ['h2.b', 'b2.a', 'q2.base'], ['c2.b', 'y.anode'], ['y.cathode', 'q2.collector'],
            ['h3.b', 'b3.a', 'q3.base'], ['c3.b', 'r.anode'], ['r.cathode', 'q3.collector'],
            ['bat.neg', 'u.gnd', 'rb.b', 'run.b', 'b1.b', 'b2.b', 'b3.b', 'q1.emitter', 'q2.emitter', 'q3.emitter', ...PARK],
        ],
    },

    // A sound-level meter. A magnetic earphone is the microphone (about
    // 3 mV per pascal); it hears a steady 1 kHz tone whose loudness is the
    // learner's Sound slider. Two transistor stages lift it: Q1 biased by
    // 1 MΩ from its own collector (10 kΩ load, gain near 100), Q2 on a
    // 100 k / 22 k divider with 4.7 kΩ / 1 kΩ (gain near 4.7). The op-amp is
    // a half-wave meter rectifier: its + input sits on the amplified signal
    // around M (half supply, 2.2 kΩ / 2.2 kΩ and 47 µF), and its output
    // drives a diode and the meter (1 mA movement, 100 µF across it as the
    // needle's damping) into the − input, which 1 kΩ returns to M. The loop
    // forces (signal − M) / 1 kΩ through the meter on every positive
    // half-wave and nothing on the negative ones, with no diode drop lost.
    'lab-sound-meter': {
        vcc: 9, supply: SUP,
        parts: { bat: BAT9,
            mic: ['earphone', { type: 'magnetic', ohms: 2000, henrys: 0.1, soundDb: 90, soundWave: 'tone', soundHz: 1000 }],
            k1: C(100e-9), q1: NPN, rc1: R(10000), rf1: R(1000000),
            k2: C(1e-6), rt2: R(100000), rb2: R(27000), q2: NPN, rc2: R(4700), re2: R(2200),
            k3: C(100e-9), ma: R(2200), mb: R(2200), cm: EL(100e-6), rbias: R(100000),
            u: OPAMP, d: SI, meter: ['analog_meter', { mode: 'current', fullScale: 0.001, ifs: 0.001 }],
            cmeter: EL(47e-6), rr: R(560) },
        nets: [
            ['bat.pos', 'u.vcc', 'rc1.a', 'rt2.a', 'rc2.a', 'ma.a'],
            ['mic.a', 'k1.a'], ['k1.b', 'q1.base', 'rf1.b'], ['q1.collector', 'rc1.b', 'rf1.a', 'k2.a'],
            ['k2.b', 'rt2.b', 'rb2.a', 'q2.base'], ['q2.emitter', 're2.a'], ['q2.collector', 'rc2.b', 'k3.a'],
            ['k3.b', 'rbias.a', 'u.1_pos'], ['ma.b', 'mb.a', 'cm.pos', 'rbias.b', 'rr.b'],
            ['u.1_out', 'd.anode'], ['d.cathode', 'meter.a', 'cmeter.pos'],
            ['meter.b', 'cmeter.neg', 'u.1_neg', 'rr.a'],
            ['bat.neg', 'mic.b', 'q1.emitter', 'rb2.b', 're2.b', 'mb.b', 'cm.neg', 'u.gnd', ...PARK],
        ],
    },

    // Level indicator on a crystal set. The radio front end of
    // lab-crystal-set (antenna on the coil's tap, tuning capacitor, germanium
    // detector into 47 kΩ ‖ 2.2 nF, crystal earphone) hears the engine's
    // default broadcast. Its audio goes through 47 nF to the op-amp's +
    // input, held at half supply by 100 kΩ / 100 kΩ; 100 kΩ back and 4.7 kΩ
    // to a second half-supply divider (10 kΩ / 10 kΩ) make it a x11
    // amplifier that sits at half supply with no signal. Two germanium diodes and
    // 1 µF pump the amplified audio into a level L (1 µF held, 47 kΩ bleed).
    // The meter (5 V full scale, 100 µA movement) reads L. An NPN emitter
    // follower (4.7 kΩ) copies L one junction lower without loading it, and
    // three NPN stages on dividers from the follower (150 Ω, 1 kΩ, 1.6 kΩ
    // over 1 kΩ) light green, yellow and red as it climbs.
    'lab-radio-level': {
        vcc: 9, supply: SUP,
        parts: { bat: BAT9, ant: ['antenna', {}], earth: ['earth', {}],
            l: ['ferrite_coil', {}], tc: ['tuning_cap', { minFarads: 10e-12, maxFarads: 500e-12, position: 0.5 }],
            d: GE, cd: C(2.2e-9), rd: R(47000), ep: ['earphone', { type: 'crystal' }],
            ci: C(47e-9), ra: R(100000), rb: R(100000), u: OPAMP, rf: R(100000), rg: R(4700), ma: R(10000), mb: R(10000),
            cp: C(1e-6), dp1: GE, dp2: GE, ch: C(1e-6), rh: R(47000),
            meter: ['analog_meter', { fullScale: 5, ifs: 0.0001 }], qf: NPN, rf2: R(4700),
            h1: R(150), b1: R(1000), q1: NPN, c1: R(1000), g: LED('green'),
            h2: R(1000), b2: R(1000), q2: NPN, c2: R(1000), y: LED('yellow'),
            h3: R(1600), b3: R(1000), q3: NPN, c3: R(1000), r: LED('red') },
        nets: [
            ['ant.a', 'l.tap'], ['l.b', 'tc.a', 'd.anode'], ['d.cathode', 'cd.a', 'rd.a', 'ep.a', 'ci.a'],
            ['bat.pos', 'u.vcc', 'ra.a', 'ma.a', 'qf.collector', 'c1.a', 'c2.a', 'c3.a'],
            ['ci.b', 'ra.b', 'rb.a', 'u.1_pos'], ['u.1_neg', 'rf.b', 'rg.a'], ['rg.b', 'ma.b', 'mb.a'],
            ['u.1_out', 'rf.a', 'cp.a'], ['cp.b', 'dp1.cathode', 'dp2.anode'],
            ['dp2.cathode', 'ch.a', 'rh.a', 'meter.a', 'qf.base'], ['qf.emitter', 'rf2.a', 'h1.a', 'h2.a', 'h3.a'],
            ['h1.b', 'b1.a', 'q1.base'], ['c1.b', 'g.anode'], ['g.cathode', 'q1.collector'],
            ['h2.b', 'b2.a', 'q2.base'], ['c2.b', 'y.anode'], ['y.cathode', 'q2.collector'],
            ['h3.b', 'b3.a', 'q3.base'], ['c3.b', 'r.anode'], ['r.cathode', 'q3.collector'],
            ['bat.neg', 'earth.earth', 'l.a', 'tc.b', 'cd.b', 'rd.b', 'ep.b', 'rb.b', 'mb.b', 'dp1.anode',
                'ch.b', 'rh.b', 'meter.b', 'rf2.b', 'b1.b', 'b2.b', 'b3.b', 'q1.emitter', 'q2.emitter', 'q3.emitter',
                'u.gnd', ...PARK],
        ],
        open: ['l.c1', 'l.c2'],
    },

    // Ohmmeter with a linear scale. The + input is at ground. A 1.5 V cell
    // (its + on ground) is the reference: the range resistor (1.5 kΩ or
    // 15 kΩ, slide switch) runs from the − input to the cell's − pole, so
    // exactly 1.5 V / R_range leaves the − input, and all of it comes
    // through the resistor under test in the feedback path. The output
    // stands I × Rx above ground: the meter (6 V full scale, 1 mA movement)
    // reads 1 V per kΩ or per 10 kΩ. The resistor under test is a fixed
    // "mystery" 3.3 kΩ or a 47 kΩ rheostat.
    'lab-linear-ohmmeter': {
        vcc: 9, supply: SUP,
        parts: { bat: BAT9, gnd: ['gnd', {}], cell: ['vsource', { volts: 1.5, variant: 'aa' }], u: OPAMP,
            range: SW(0), rk1: R(1500), rk10: R(15000),
            pick: SW(0), mystery: R(3300), rx: POT(47000, 0.5),
            meter: ['analog_meter', { fullScale: 6, ifs: 0.001 }] },
        nets: [
            ['bat.pos', 'u.vcc'],
            ['u.1_neg', 'range.com', 'pick.com'], ['range.a', 'rk1.a'], ['range.b', 'rk10.a'],
            ['cell.neg', 'rk1.b', 'rk10.b'],
            ['pick.a', 'mystery.a'], ['pick.b', 'rx.a'],
            ['u.1_out', 'mystery.b', 'rx.wiper', 'rx.b', 'meter.a'],
            ['bat.neg', 'gnd.gnd', 'cell.pos', 'u.gnd', 'u.1_pos', 'meter.b', ...PARK],
        ],
    },

    // Precision full-wave meter on ±9 V (two batteries). The input (a knob
    // spanning about ±1 V, or a 50 Hz sine from the generator, slide switch)
    // goes to the + input. The output drives a bridge: two silicon diodes on
    // top, a red and a green LED as its lower arms, the meter (1 mA
    // movement, 100 Ω coil) across the bridge diagonal. The bridge's other
    // corner is the − input, with 1 kΩ to ground, so the loop forces
    // Vin / 1 kΩ through the bridge whichever way it flows: the meter always
    // reads |Vin| (1 mA per volt), the drops of diode and LED cost nothing,
    // and the LED that carries the current tells the sign. Authored with the
    // knob at three quarters: +0.5 V in.
    'lab-bridge-meter': {
        vcc: 9, supply: { pos: 'bp.pos', neg: 'gnd.gnd' },
        parts: { gnd: ['gnd', {}], bp: BAT9, bn: BAT9,
            ka: R(39000), knob: POT(10000, 0.75), kb: R(39000),
            fg: ['function_gen', { wave: 'sine', freq: 50, amplitude: 1, offset: 0 }], src: SW(0),
            u: OPAMP, dt1: SI, dt2: SI, plus: LED('red'), minus: LED('green'),
            meter: ['analog_meter', { mode: 'current', fullScale: 0.001, ifs: 0.001 }], rr: R(1000) },
        nets: [
            ['gnd.gnd', 'bp.neg', 'bn.pos', 'fg.gnd', 'rr.b', 'u.2_pos'],
            ['bp.pos', 'u.vcc', 'ka.a'], ['bn.neg', 'u.gnd', 'kb.b'],
            ['ka.b', 'knob.a'], ['knob.b', 'kb.a'], ['knob.wiper', 'src.a'], ['fg.out', 'src.b'], ['src.com', 'u.1_pos'],
            ['u.1_out', 'dt1.anode', 'minus.cathode'], ['u.1_neg', 'rr.a', 'dt2.anode', 'plus.cathode'],
            ['dt1.cathode', 'dt2.cathode', 'meter.a'], ['meter.b', 'plus.anode', 'minus.anode'],
            ['u.2_neg', 'u.2_out'],
        ],
    },
};
