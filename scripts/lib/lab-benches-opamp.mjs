/**
 * Netlists for the op-amp measuring benches: a comparator with enormous gain,
 * integrators (a stepped store with a meter, a three-LED timer), meter
 * rectifiers (a sound-level meter, a radio level indicator, a bridge in the
 * feedback loop), op-amp help for meters (a buffered voltmeter, an ammeter)
 * and an ohmmeter with a linear scale, written by
 * `node scripts/gen-lab-circuits-4.mjs --set=opamp`.
 *
 * Same shape as lab-benches-4.mjs: pure data, so test/lab-circuits-opamp.test.mjs
 * names parts by role. Ids follow benchIds (breadboard first, then the parts
 * in the order listed).
 *
 * One quad op-amp per bench: the engine's LM324 (the same ground-sensing
 * macromodel as its LM358: inputs down to ground, output from about 5 mV up
 * to VCC − 1.5 V, 1 MHz, 0.3 V/µs, no input offset voltage; 45 nA input bias
 * current out of each input, 5 nA offset current).
 * Comparators, references and gain stages are op-amp sections; unused
 * sections are parked as grounded followers. Integrator capacitors are
 * non-polar (`capacitor`): their voltage changes sign with the ramp.
 */
import { benchIds } from './lab-benches-4.mjs';
export { benchIds };

const SUP = { pos: 'bat.pos', neg: 'bat.neg' };
const R = (ohms) => ['resistor', { ohms }];
const C = (farads) => ['capacitor', { farads }];
const LED = (color) => ['led', { color }];
const POT = (ohms, position) => ['potentiometer', { ohms, position }];
const SW = (position) => ['slide_switch', { position }];
const BTN = ['button', {}];
const SI = ['diode', { part: '1N4148' }];
const GE = ['diode', { part: '1N34A' }];
const BAT9 = ['vsource', { volts: 9, variant: '9v' }];
const QUAD = ['lm324', {}];
/** Park op-amp section n as a grounded follower (on single supply). */
const park = (...n) => n.flatMap(k => [`u.${k}_pos`, `u.${k}_neg`, `u.${k}_out`]);

export const BENCHES = {
    // The op-amp as a comparator: no feedback at all. The − input sits at
    // half supply (10 kΩ / 10 kΩ). The "tilt" knob is a 1 kΩ pot between two
    // 100 kΩ resistors, so its whole travel only spans about ±22 mV around
    // half supply. The output drives a green LED to ground (lit when high)
    // and a red LED from +9 V (lit when low; at the high output, 7.5 V, the
    // 1.5 V left across it is below its threshold). With a gain near 10^5
    // the changeover takes well under a millivolt: a sliver of the knob.
    'lab-tilt-comparator': {
        vcc: 9, supply: SUP,
        parts: { bat: BAT9, u: QUAD, ra: R(10000), rb: R(10000),
            ta: R(100000), tilt: POT(1000, 0.4), tb: R(100000),
            rg: R(1000), green: LED('green'), rr: R(1000), red: LED('red') },
        nets: [
            ['bat.pos', 'u.vcc', 'ra.a', 'ta.a', 'rr.a'],
            ['ra.b', 'rb.a', 'u.1_neg'], ['ta.b', 'tilt.a'], ['tilt.b', 'tb.a'], ['tilt.wiper', 'u.1_pos'],
            ['u.1_out', 'rg.a', 'red.cathode'], ['rg.b', 'green.anode'], ['rr.b', 'red.anode'],
            ['bat.neg', 'u.gnd', 'rb.b', 'tb.b', 'green.cathode', ...park(2, 3, 4)],
        ],
    },

    // A store that counts taps. Section 2 buffers a reference (10 kΩ /
    // 2.2 kΩ, about 1.6 V); section 1 integrates onto 10 µF around it. Each
    // button is a diode charge pump: a 1 µF capacitor whose free end is held
    // at one rail by 22 kΩ and thrown to the other rail (through 1 kΩ) by
    // the button. "Up" pulls charge out of the summing node through one
    // diode and refills from the reference through the other on release;
    // "down" is the mirror image. Each tap moves the output by the same
    // step, however long the button is held. The meter (6 V full scale,
    // 1 mA movement) reads output minus reference; the diode across it
    // limits a backwards swing to a few tenths of a volt; 1 kΩ in the
    // integrator's output lead limits that diode's current. "Zero" empties
    // the integrator through 100 Ω.
    'lab-tap-integrator': {
        vcc: 9, supply: SUP,
        parts: { bat: BAT9, u: QUAD, ra: R(10000), rb: R(2200),
            ci: C(10e-6), zero: BTN, rz: R(100),
            up: BTN, ru: R(1000), pu: R(22000), cu: C(1e-6), du1: SI, du2: SI,
            dn: BTN, rd: R(1000), pd: R(22000), cd: C(1e-6), dd1: SI, dd2: SI,
            ro: R(1000), meter: ['analog_meter', { fullScale: 6, ifs: 0.001 }], dm: SI },
        nets: [
            ['bat.pos', 'u.vcc', 'ra.a', 'pu.a', 'dn.a'],
            ['ra.b', 'rb.a', 'u.2_pos'],
            ['u.2_out', 'u.2_neg', 'u.1_pos', 'du2.cathode', 'dd2.anode', 'meter.b', 'dm.anode'],
            ['u.1_neg', 'ci.a', 'zero.a', 'du1.anode', 'dd1.cathode'],
            ['zero.b', 'rz.a'], ['u.1_out', 'ro.a'], ['ro.b', 'rz.b', 'ci.b', 'meter.a', 'dm.cathode'],
            ['pu.b', 'cu.a', 'up.a'], ['up.b', 'ru.a'], ['cu.b', 'du1.cathode', 'du2.anode'],
            ['dn.b', 'rd.a'], ['rd.b', 'pd.a', 'cd.a'], ['cd.b', 'dd1.anode', 'dd2.cathode'],
            ['bat.neg', 'u.gnd', 'rb.b', 'ru.b', 'pd.b', ...park(3, 4)],
        ],
    },

    // A ramp timer on one quad. A 20k/20k/20k/20k/10k ladder gives 7, 5, 3
    // and 1 V. Section 1 integrates around the 1 V tap onto 4.7 µF. The input
    // resistor (47 kΩ plus a 220 kΩ "time" rheostat) goes through the
    // hold/run switch either to the 1 V tap (hold: no current) or to ground
    // (run: the output climbs at a steady rate). Sections 2-4 compare the
    // ramp with 3, 5 and 7 V and light green, yellow and red in turn. "Zero"
    // empties the capacitor through 100 Ω.
    'lab-ramp-timer': {
        vcc: 9, supply: SUP,
        parts: { bat: BAT9, u: QUAD, l1: R(20000), l2: R(20000), l3: R(20000), l4: R(20000), l5: R(10000),
            run: SW(1), rin: R(47000), time: POT(220000, 1), ci: C(4.7e-6), zero: BTN, rz: R(100),
            r1: R(1000), g: LED('green'), r2: R(1000), y: LED('yellow'), r3: R(1000), r: LED('red') },
        nets: [
            ['bat.pos', 'u.vcc', 'l1.a'],
            ['l1.b', 'l2.a', 'u.4_neg'], ['l2.b', 'l3.a', 'u.3_neg'], ['l3.b', 'l4.a', 'u.2_neg'],
            ['l4.b', 'l5.a', 'u.1_pos', 'run.a'],
            ['run.com', 'rin.a'], ['rin.b', 'time.a'], ['time.wiper', 'time.b', 'ci.a', 'zero.a', 'u.1_neg'],
            ['zero.b', 'rz.a'], ['rz.b', 'ci.b', 'u.1_out', 'u.2_pos', 'u.3_pos', 'u.4_pos'],
            ['u.2_out', 'r1.a'], ['r1.b', 'g.anode'], ['u.3_out', 'r2.a'], ['r2.b', 'y.anode'],
            ['u.4_out', 'r3.a'], ['r3.b', 'r.anode'],
            ['bat.neg', 'u.gnd', 'l5.b', 'run.b', 'g.cathode', 'y.cathode', 'r.cathode'],
        ],
    },

    // A sound-level meter on one quad. A magnetic earphone is the microphone
    // (about 3 mV per pascal); it hears a steady 1 kHz tone whose loudness is
    // the learner's Sound slider. Section 4 buffers half the supply (M).
    // Sections 1 and 2 are non-inverting gain stages around M (x22 and x11;
    // 10 µF in each ground leg keeps their DC gain at one). Section 3 is a
    // half-wave meter rectifier: its + input takes the amplified signal, its
    // output drives a diode and the meter (1 mA movement, 47 µF across it as
    // the needle's damping) into the − input, which 560 Ω returns to M. The
    // loop forces (signal − M) / 560 Ω through the meter on every positive
    // half-wave, with no diode drop lost.
    'lab-sound-meter': {
        vcc: 9, supply: SUP,
        parts: { bat: BAT9, u: QUAD, ma: R(10000), mb: R(10000),
            mic: ['earphone', { type: 'magnetic', ohms: 2000, henrys: 0.1, soundDb: 90, soundWave: 'tone', soundHz: 1000 }],
            f1: R(100000), g1: R(4700), c1: C(10e-6), f2: R(100000), g2: R(10000), c2: C(10e-6),
            d: SI, meter: ['analog_meter', { mode: 'current', fullScale: 0.001, ifs: 0.001 }],
            cmeter: ['polarized_cap', { farads: 47e-6 }], rr: R(560) },
        nets: [
            ['bat.pos', 'u.vcc', 'ma.a'], ['ma.b', 'mb.a', 'u.4_pos'],
            ['u.4_out', 'u.4_neg', 'mic.b', 'c1.b', 'c2.b', 'rr.b'],
            ['mic.a', 'u.1_pos'], ['u.1_neg', 'f1.b', 'g1.a'], ['g1.b', 'c1.a'],
            ['u.1_out', 'f1.a', 'u.2_pos'], ['u.2_neg', 'f2.b', 'g2.a'], ['g2.b', 'c2.a'],
            ['u.2_out', 'f2.a', 'u.3_pos'],
            ['u.3_out', 'd.anode'], ['d.cathode', 'meter.a', 'cmeter.pos'],
            ['meter.b', 'cmeter.neg', 'u.3_neg', 'rr.a'],
            ['bat.neg', 'u.gnd', 'mb.b'],
        ],
    },

    // Level indicator on a crystal set. The radio front end of
    // lab-crystal-set (antenna on the coil's tap, tuning capacitor, germanium
    // detector into 47 kΩ ‖ 2.2 nF, crystal earphone) hears the engine's
    // default broadcast. Its audio goes through 47 nF to section 1's +
    // input, held at half supply by 100 kΩ / 100 kΩ; 100 kΩ back and 4.7 kΩ
    // to a second half-supply divider (10 kΩ / 10 kΩ) make it a x11
    // amplifier. Two germanium diodes and 1 µF pump the amplified audio into
    // the level L (1 µF held, 47 kΩ bleed); the meter (5 V full scale,
    // 100 µA movement) reads L. Sections 2-4 compare L with the taps of a
    // 62k/5.6k/5.6k/13k ladder (about 2.5, 1.9 and 1.4 V) and light red,
    // yellow and green.
    'lab-radio-level': {
        vcc: 9, supply: SUP,
        parts: { bat: BAT9, ant: ['antenna', {}], earth: ['earth', {}],
            l: ['ferrite_coil', {}], tc: ['tuning_cap', { minFarads: 10e-12, maxFarads: 500e-12, position: 0.5 }],
            d: GE, cd: C(2.2e-9), rd: R(47000), ep: ['earphone', { type: 'crystal' }],
            ci: C(47e-9), ra: R(100000), rb: R(100000), u: QUAD, rf: R(100000), rg: R(4700), ma: R(10000), mb: R(10000),
            cp: C(1e-6), dp1: GE, dp2: GE, ch: C(1e-6), rh: R(47000),
            meter: ['analog_meter', { fullScale: 5, ifs: 0.0001 }],
            t1: R(62000), t2: R(5600), t3: R(5600), t4: R(13000),
            r1: R(1000), g: LED('green'), r2: R(1000), y: LED('yellow'), r3: R(1000), r: LED('red') },
        nets: [
            ['ant.a', 'l.tap'], ['l.b', 'tc.a', 'd.anode'], ['d.cathode', 'cd.a', 'rd.a', 'ep.a', 'ci.a'],
            ['bat.pos', 'u.vcc', 'ra.a', 'ma.a', 't1.a'],
            ['ci.b', 'ra.b', 'rb.a', 'u.1_pos'], ['u.1_neg', 'rf.b', 'rg.a'], ['rg.b', 'ma.b', 'mb.a'],
            ['u.1_out', 'rf.a', 'cp.a'], ['cp.b', 'dp1.cathode', 'dp2.anode'],
            ['dp2.cathode', 'ch.a', 'rh.a', 'meter.a', 'u.2_pos', 'u.3_pos', 'u.4_pos'],
            ['t1.b', 't2.a', 'u.4_neg'], ['t2.b', 't3.a', 'u.3_neg'], ['t3.b', 't4.a', 'u.2_neg'],
            ['u.2_out', 'r1.a'], ['r1.b', 'g.anode'], ['u.3_out', 'r2.a'], ['r2.b', 'y.anode'],
            ['u.4_out', 'r3.a'], ['r3.b', 'r.anode'],
            ['bat.neg', 'earth.earth', 'l.a', 'tc.b', 'cd.b', 'rd.b', 'ep.b', 'rb.b', 'mb.b', 'dp1.anode',
                'ch.b', 'rh.b', 'meter.b', 't4.b', 'g.cathode', 'y.cathode', 'r.cathode', 'u.gnd'],
        ],
        open: ['l.c1', 'l.c2'],
    },

    // The meter needs help. A 220 kΩ / 220 kΩ divider should give 4.5 V. The
    // meter (6 V full scale, 50 µA movement: 120 kΩ in all) put straight
    // across its lower half loads it badly. Section 1 is a voltage follower
    // in front: a silicon diode in its input against a reversed connection,
    // 10 MΩ to ground to give that diode its tiny current; it takes nothing
    // from the divider. The slide switch puts the meter on the divider
    // (direct) or on the follower. Section 2 is a x10 stage (91 kΩ / 10 kΩ)
    // whose input hangs on 1 MΩ to ground; a "probe" button connects it to
    // 0.5 V (82 kΩ / 4.7 kΩ). A second meter (6 V) shows its output.
    'lab-buffered-voltmeter': {
        vcc: 9, supply: SUP,
        parts: { bat: BAT9, u: QUAD, da: R(220000), db: R(220000), din: SI, rin: R(10000000),
            via: SW(0), meter: ['analog_meter', { fullScale: 6, ifs: 0.00005 }],
            pa: R(82000), pb: R(4700), probe: BTN, rpr: R(1000000), rf: R(91000), rg: R(10000),
            meter10: ['analog_meter', { fullScale: 6, ifs: 0.0001 }] },
        nets: [
            ['bat.pos', 'u.vcc', 'da.a', 'pa.a'],
            ['da.b', 'db.a', 'din.anode', 'via.a'], ['din.cathode', 'rin.a', 'u.1_pos'],
            ['u.1_out', 'u.1_neg', 'via.b'], ['via.com', 'meter.a'],
            ['pa.b', 'pb.a', 'probe.a'], ['probe.b', 'rpr.a', 'u.2_pos'],
            ['u.2_neg', 'rf.b', 'rg.a'], ['u.2_out', 'rf.a', 'meter10.a'],
            ['bat.neg', 'u.gnd', 'db.b', 'rin.b', 'meter.b', 'pb.b', 'rpr.b', 'rg.b', 'meter10.b', ...park(3, 4)],
        ],
    },

    // An op-amp ammeter. The circuit under test is a 4.5 V battery driving
    // 47 Ω; its current returns through a 1 Ω sensing resistor to ground.
    // Section 1 is a non-inverting amplifier (1 kΩ to ground, 39 kΩ plus a
    // 22 kΩ "calibrate" rheostat back: about x40 to x62) whose + input the
    // slide switch takes either from the sensing resistor ("measure") or
    // from a calibration voltage: a red LED fed from 9 V through 2.2 kΩ,
    // divided by 18 kΩ / 1 kΩ to about a tenth of a volt, which stands for
    // about 100 mA through the sensing resistor. The meter (6 V full scale,
    // read as 20 mA per volt) shows the output; a diode across it protects it
    // against reverse drive.
    'lab-opamp-ammeter': {
        vcc: 9, supply: SUP,
        parts: { bat: BAT9, gnd: ['gnd', {}], load: ['vsource', { volts: 4.5 }], rl: R(47), shunt: R(1),
            rled: R(2200), led: LED('red'), ca: R(18000), cb: R(1000), sel: SW(0),
            u: QUAD, rg: R(1000), rf: R(39000), cal: POT(22000, 0.545),
            meter: ['analog_meter', { fullScale: 6, ifs: 0.001 }], dm: SI },
        nets: [
            ['bat.pos', 'u.vcc', 'rled.a'], ['load.pos', 'rl.a'], ['rl.b', 'shunt.a', 'sel.a'],
            ['rled.b', 'led.anode', 'ca.a'], ['ca.b', 'cb.a', 'sel.b'], ['sel.com', 'u.1_pos'],
            ['u.1_neg', 'rg.a', 'cal.a'], ['cal.wiper', 'cal.b', 'rf.a'], ['rf.b', 'u.1_out', 'meter.a', 'dm.cathode'],
            ['bat.neg', 'gnd.gnd', 'u.gnd', 'load.neg', 'shunt.b', 'led.cathode', 'cb.b', 'rg.b', 'meter.b', 'dm.anode', ...park(2, 3, 4)],
        ],
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
        parts: { bat: BAT9, gnd: ['gnd', {}], cell: ['vsource', { volts: 1.5, variant: 'aa' }], u: QUAD,
            range: SW(0), rk1: R(1500), rk10: R(15000),
            pick: SW(0), mystery: R(3300), rx: POT(47000, 0.5),
            meter: ['analog_meter', { fullScale: 6, ifs: 0.001 }] },
        nets: [
            ['bat.pos', 'u.vcc'],
            ['u.1_neg', 'range.com', 'pick.com'], ['range.a', 'rk1.a'], ['range.b', 'rk10.a'],
            ['cell.neg', 'rk1.b', 'rk10.b'],
            ['pick.a', 'mystery.a'], ['pick.b', 'rx.a'],
            ['u.1_out', 'mystery.b', 'rx.wiper', 'rx.b', 'meter.a'],
            ['bat.neg', 'gnd.gnd', 'cell.pos', 'u.gnd', 'u.1_pos', 'meter.b', ...park(2, 3, 4)],
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
    // knob at three quarters: +0.5 V in. Unused sections follow ground.
    'lab-bridge-meter': {
        vcc: 9, supply: { pos: 'bp.pos', neg: 'gnd.gnd' },
        parts: { gnd: ['gnd', {}], bp: BAT9, bn: BAT9,
            ka: R(39000), knob: POT(10000, 0.75), kb: R(39000),
            fg: ['function_gen', { wave: 'sine', freq: 50, amplitude: 1, offset: 0 }], src: SW(0),
            u: QUAD, dt1: SI, dt2: SI, plus: LED('red'), minus: LED('green'),
            meter: ['analog_meter', { mode: 'current', fullScale: 0.001, ifs: 0.001 }], rr: R(1000) },
        nets: [
            ['gnd.gnd', 'bp.neg', 'bn.pos', 'fg.gnd', 'rr.b', 'u.2_pos', 'u.3_pos', 'u.4_pos'],
            ['bp.pos', 'u.vcc', 'ka.a'], ['bn.neg', 'u.gnd', 'kb.b'],
            ['ka.b', 'knob.a'], ['knob.b', 'kb.a'], ['knob.wiper', 'src.a'], ['fg.out', 'src.b'], ['src.com', 'u.1_pos'],
            ['u.1_out', 'dt1.anode', 'minus.cathode'], ['u.1_neg', 'rr.a', 'dt2.anode', 'plus.cathode'],
            ['dt1.cathode', 'dt2.cathode', 'meter.a'], ['meter.b', 'plus.anode', 'minus.anode'],
            ['u.2_neg', 'u.2_out'], ['u.3_neg', 'u.3_out'], ['u.4_neg', 'u.4_out'],
        ],
    },
};
