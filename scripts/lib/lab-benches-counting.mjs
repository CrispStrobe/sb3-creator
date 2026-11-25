/**
 * Netlists for the counting / light-sensing lab benches: LEDs used backwards
 * as colour-selective light sensors, an IR light meter with a zero adjust, an
 * IR on/off remote, a seven-octave divider, a light-barrier counter that pulls
 * a relay in after N interruptions, and a counter that only counts loud sound.
 * Written by `node scripts/gen-lab-circuits-4.mjs --set=counting`.
 *
 * Same shape as lab-benches-optics.mjs: pure data, so
 * test/lab-circuits-counting.test.mjs names parts by role. A light path's
 * `from` / `to` are written as '@role' and turned into engine ids below.
 */
import { benchIds } from './lab-benches-4.mjs';
export { benchIds };

const SUP = { pos: 'bat.pos', neg: 'bat.neg' };
const R = (ohms) => ['resistor', { ohms }];
const C = (farads) => ['capacitor', { farads }];
const EL = (farads) => ['polarized_cap', { farads }];
const NPN = ['npn', { beta: 100 }];
const BAT9 = ['vsource', { volts: 9, variant: '9v' }];
const BAT5 = ['vsource', { volts: 5 }];
const LED = (color) => ['led', { color }];
const VM = ['voltmeter', {}];
const POT = (ohms, position) => ['potentiometer', { ohms, position }];
const PATH = (params) => ['light_path', params];
/** An LED used backwards as a light sensor: `amps` of photocurrent at full light. */
const SENSOR = (color, amps) => ['led', { color, photoSensitivity: amps }];

/** Replace '@role' in a light path's from / to with the bench's engine id. */
function resolveRefs(benches) {
    for (const spec of Object.values(benches)) {
        const ids = benchIds(spec);
        for (const [, [, params]] of Object.entries(spec.parts)) {
            for (const k of ['from', 'to']) {
                const v = params?.[k];
                if (typeof v === 'string' && v.startsWith('@')) {
                    if (!ids[v.slice(1)]) throw new Error(`${k}: unknown role ${v}`);
                    params[k] = ids[v.slice(1)];
                }
            }
        }
    }
    return benches;
}

export const BENCHES = resolveRefs({
    // Two LEDs used backwards as sensors, side by side: a red one and an IR
    // one. A selector switch connects one of them to the op-amp, a
    // transimpedance stage (1 MΩ: 1 V per µA of photocurrent). A red LED and
    // an IR emitter, each on its own switch, shine on both sensors from 2 cm.
    // An LED senses only light of shorter wavelength than its own: the IR
    // sensor answers both lamps, the red sensor only red. The LM358's second
    // half is not used (inputs grounded).
    'lab-led-sensor-colours': {
        vcc: 9, supply: SUP,
        parts: { bat: BAT9, swr: ['slide_switch', { position: 1 }], rr: R(470), red: LED('red'),
            swi: ['slide_switch', { position: 0 }], ri: R(470), ir: ['ir_transmitter', {}],
            sr: SENSOR('red', 5e-6), si: SENSOR('ir', 5e-6), sel: ['slide_switch', { position: 0 }],
            u: ['lm358', {}], rf: R(1000000), vm: VM,
            rToR: PATH({ from: '@red', to: '@sr', medium: 'air', distanceCm: 2 }),
            rToI: PATH({ from: '@red', to: '@si', medium: 'air', distanceCm: 2 }),
            iToR: PATH({ from: '@ir', to: '@sr', medium: 'air', distanceCm: 2 }),
            iToI: PATH({ from: '@ir', to: '@si', medium: 'air', distanceCm: 2 }) },
        nets: [
            ['bat.pos', 'swr.com', 'swi.com', 'u.vcc'], ['swr.b', 'rr.a'], ['rr.b', 'red.anode'],
            ['swi.b', 'ri.a'], ['ri.b', 'ir.anode'],
            ['sr.cathode', 'sel.a'], ['si.cathode', 'sel.b'],
            ['sel.com', 'rf.a', 'u.1_neg'], ['u.1_out', 'rf.b', 'vm.a'],
            ['bat.neg', 'red.cathode', 'ir.cathode', 'sr.anode', 'si.anode', 'u.1_pos', 'u.gnd',
                'u.2_pos', 'u.2_neg', 'vm.b'],
        ],
        open: ['swr.a', 'swi.a', 'u.2_out'],
    },

    // Which of two look-alike clear parts is the phototransistor and which
    // the IR LED? Each sits in series with 470 Ω and a red indicator LED
    // across the 9 V battery, the way a phototransistor is wired: its
    // collector (the IR LED's cathode, in the same position) to plus. A white
    // lamp LED on a switch shines on both from 2 cm. Lit, the
    // phototransistor passes milliamps and its indicator glows; the IR LED
    // is reverse biased there, and the few microamps of photocurrent it
    // makes cannot light anything. No transistor stage, no amplifier: the
    // part under test is the only active thing in each branch.
    'lab-phototransistor-or-ir-led': {
        vcc: 9, supply: SUP,
        parts: { bat: BAT9, sw: ['slide_switch', { position: 1 }], rw: R(220), lamp: LED('white'),
            pt: ['phototransistor', {}], ra: R(470), la: LED('red'),
            irs: SENSOR('ir', 10e-6), rb: R(470), lb: LED('red'),
            toA: PATH({ from: '@lamp', to: '@pt', medium: 'air', distanceCm: 2,
                knob: 'distanceCm', knobMin: 1, knobMax: 20 }),
            toB: PATH({ from: '@lamp', to: '@irs', medium: 'air', distanceCm: 2 }) },
        nets: [
            ['bat.pos', 'sw.com', 'pt.collector', 'irs.cathode'], ['sw.b', 'rw.a'], ['rw.b', 'lamp.anode'],
            ['pt.emitter', 'ra.a'], ['ra.b', 'la.anode'],
            ['irs.anode', 'rb.a'], ['rb.b', 'lb.anode'],
            ['bat.neg', 'lamp.cathode', 'la.cathode', 'lb.cathode'],
        ],
        open: ['sw.a'],
    },

    // IR light meter. The sensor is an IR LED used backwards; LM358 half 1
    // turns its photocurrent into volts (4.7 MΩ) above a 1 V reference, which a
    // single-supply amplifier needs to work near zero light. So in the dark
    // its output is not 0 but 1 V: an offset. Half 2 is a difference
    // amplifier (all four resistors 100 k): it outputs half 1 minus the zero
    // pot's voltage. Turn the zero pot until the meter just reads 0 in the
    // dark; from then on it shows the light alone. The IR emitter's distance
    // is the light path's knob (3 .. 20 cm).
    'lab-ir-light-meter': {
        vcc: 9, supply: SUP,
        parts: { bat: BAT9, sw: ['slide_switch', { position: 1 }], re: R(470), ir: ['ir_transmitter', {}],
            sens: SENSOR('ir', 10e-6), ra: R(8200), rb: R(1000), u: ['lm358', {}], rf: R(4700000),
            rz: R(56000), zero: POT(10000, 0.5),
            r1: R(100000), r2: R(100000), r3: R(100000), r4: R(100000), meter: ['analog_meter', { fullScale: 5 }],
            beam: PATH({ from: '@ir', to: '@sens', medium: 'air', distanceCm: 5,
                knob: 'distanceCm', knobMin: 3, knobMax: 20 }) },
        nets: [
            ['bat.pos', 'sw.com', 'ra.a', 'u.vcc', 'rz.a'], ['sw.b', 're.a'], ['re.b', 'ir.anode'],
            ['ra.b', 'rb.a', 'u.1_pos'],
            ['sens.cathode', 'rf.a', 'u.1_neg'], ['u.1_out', 'rf.b', 'r1.a'],
            ['r1.b', 'r2.a', 'u.2_pos'], ['rz.b', 'zero.a'], ['zero.wiper', 'r3.a'],
            ['r3.b', 'r4.a', 'u.2_neg'], ['u.2_out', 'r4.b', 'meter.a'],
            ['bat.neg', 'ir.cathode', 'sens.anode', 'rb.b', 'r2.b', 'zero.b', 'u.gnd', 'meter.b'],
        ],
        open: ['sw.a'],
    },
    // IR on/off remote. The button keys an IR LED; 30 cm away a
    // phototransistor works as an emitter follower into 47 k, so a flash
    // lifts its emitter. 470 nF passes that rising edge to +IN of an LM386
    // (gain 20) used as a monoflop: 1 MΩ from the supply to -IN (with the
    // chip's own 50 k input resistance there) sets a small offset, so at rest
    // the output sits at its low limit. The edge lifts +IN past -IN, the
    // output jumps high and 470 nF from the output to +IN holds +IN up; it
    // decays through 100 k (and the chip's 50 k) until the output falls back:
    // one pulse per flash, short or held. The falling end of the pulse
    // reaches a two-transistor toggle flip-flop through 2.2 nF and a
    // steering diode on each side; 47 k from each collector biases its
    // diode so only the conducting transistor's base is pulled down. Each
    // pulse flips it: red, green, red ...
    'lab-ir-remote-toggle': {
        vcc: 9, supply: SUP,
        parts: { bat: BAT9, btn: ['button', {}], re: R(220), ir: ['ir_transmitter', {}],
            pt: ['phototransistor', {}], rpe: R(100000), ct: C(220e-9),
            u: ['lm386', {}], rn: R(1000000), cm: C(220e-9), rm: R(47000),
            q1: NPN, q2: NPN, rc1: R(1000), red: LED('red'), rc2: R(1000), green: LED('green'),
            x1: R(22000), x2: R(27000),
            cs1: C(2.2e-9), cs2: C(2.2e-9), rs1: R(47000), rs2: R(47000),
            d1: ['diode', { part: '1N4148' }], d2: ['diode', { part: '1N4148' }],
            air: PATH({ from: '@ir', to: '@pt', medium: 'air', distanceCm: 30,
                knob: 'distanceCm', knobMin: 10, knobMax: 150 }) },
        nets: [
            ['bat.pos', 'btn.a', 'pt.collector', 'u.vs', 'rn.a', 'rc1.a', 'rc2.a'],
            ['btn.b', 're.a'], ['re.b', 'ir.anode'],
            ['pt.emitter', 'rpe.a', 'ct.a'], ['ct.b', 'u.inp', 'cm.b', 'rm.a'], ['rn.b', 'u.inn'],
            ['u.vout', 'cm.a', 'cs1.a', 'cs2.a'],
            ['rc1.b', 'red.anode'], ['red.cathode', 'q1.collector', 'x1.a', 'rs1.a'],
            ['rc2.b', 'green.anode'], ['green.cathode', 'q2.collector', 'x2.a', 'rs2.a'],
            ['x1.b', 'q2.base', 'd2.anode'], ['x2.b', 'q1.base', 'd1.anode'],
            ['cs1.b', 'rs1.b', 'd1.cathode'], ['cs2.b', 'rs2.b', 'd2.cathode'],
            ['bat.neg', 'ir.cathode', 'rpe.b', 'rm.b', 'u.gnd', 'q1.emitter', 'q2.emitter'],
        ],
        open: ['u.gain1', 'u.gain8', 'u.bypass'],
    },

    // IR beam alarm. An IR LED shines steadily on a phototransistor 20 cm
    // away (the light path's knob: how much of the beam is blocked). The
    // phototransistor feeds 10 k on -IN of an LM386 that is wired as an
    // oscillator: its output kicks +IN through 47 nF and the kick decays
    // through 22 k (and the chip's own 50 k). While the beam is there, -IN
    // sits well above anything the kicks can reach and the output stays at
    // its low limit: silence. Block the beam and -IN drops to 0 V: the
    // amplifier oscillates and the loudspeaker (through 100 µF) blares.
    'lab-ir-beam-alarm': {
        vcc: 9, supply: SUP,
        parts: { bat: BAT9, re: R(220), ir: ['ir_transmitter', {}], pt: ['phototransistor', {}], rn: R(10000),
            u: ['lm386', {}], cf: C(47e-9), rb: R(22000), co: EL(100e-6), spk: ['speaker', { ohms: 8 }],
            beam: PATH({ from: '@ir', to: '@pt', medium: 'air', distanceCm: 20, blocked: 0,
                knob: 'blocked', knobMin: 0, knobMax: 1 }) },
        nets: [
            ['bat.pos', 're.a', 'pt.collector', 'u.vs'], ['re.b', 'ir.anode'],
            ['pt.emitter', 'rn.a', 'u.inn'],
            ['u.vout', 'cf.a', 'co.pos'], ['cf.b', 'u.inp', 'rb.a'], ['co.neg', 'spk.a'],
            ['bat.neg', 'ir.cathode', 'rn.b', 'rb.b', 'u.gnd', 'spk.b'],
        ],
        open: ['u.gain1', 'u.gain8', 'u.bypass'],
    },

    // Seven octaves from one oscillator. A 555 astable near 4.5 kHz clocks
    // two 74HC93 ripple counters in a chain (each counter's QA feeds its own
    // input B, the first counter's QD clocks the second): seven stages, each
    // half the frequency of the one before, f/2 down to f/128. Every output
    // feeds 47 k into one summing node, and 10 µF couples the mix into a
    // crystal earphone: one chord of seven octaves.
    'lab-octave-divider': {
        vcc: 5, supply: SUP,
        parts: { bat: BAT5, osc: ['timer_555', {}], ra: R(1000), rb: R(6800), ct: C(22e-9), cv: C(10e-9),
            c1: ['74hc93', {}], c2: ['74hc93', {}],
            s1: R(47000), s2: R(47000), s3: R(47000), s4: R(47000), s5: R(47000), s6: R(47000), s7: R(47000),
            cc: EL(10e-6), ear: ['earphone', { type: 'crystal' }] },
        nets: [
            ['bat.pos', 'osc.vcc', 'osc.reset', 'ra.a', 'c1.vcc', 'c2.vcc'],
            ['ra.b', 'osc.discharge', 'rb.a'], ['rb.b', 'osc.threshold', 'osc.trigger', 'ct.a'], ['osc.control', 'cv.a'],
            ['osc.output', 'c1.clk_a'],
            ['c1.qa', 'c1.clk_b', 's1.a'], ['c1.qb', 's2.a'], ['c1.qc', 's3.a'], ['c1.qd', 'c2.clk_a', 's4.a'],
            ['c2.qa', 'c2.clk_b', 's5.a'], ['c2.qb', 's6.a'], ['c2.qc', 's7.a'],
            ['s1.b', 's2.b', 's3.b', 's4.b', 's5.b', 's6.b', 's7.b', 'cc.pos'], ['cc.neg', 'ear.a'],
            ['bat.neg', 'osc.gnd', 'ct.b', 'cv.b', 'c1.gnd', 'c2.gnd', 'c1.r0_1', 'c1.r0_2', 'c2.r0_1', 'c2.r0_2', 'ear.b'],
        ],
        open: ['c1.nc1', 'c1.nc2', 'c1.nc3', 'c1.nc4', 'c2.nc1', 'c2.nc2', 'c2.nc3', 'c2.nc4', 'c2.qd'],
    },

    // Light barrier counter with a pulsed beam. Transmitter: a 555 astable
    // (1 k, 6.8 k, 100 nF: about 1 kHz) flashes an IR LED through 47 Ω.
    // Receiver, 15 cm away: a phototransistor as emitter follower into
    // 220 k. Only the flashes count: 100 nF and two diodes pump them into
    // 220 nF (100 k across it), which holds Q1 on through 10 k while the
    // flashes arrive. Steady light (a lamp, daylight) pumps nothing. Q1's
    // collector drives Q2, so Q2's collector is high while the beam is
    // there and drops when it is broken: a falling edge per interruption.
    // That signal goes through the first changeover contact of a two-pole
    // relay (rest side) to the counter's clock (100 k holds the input low
    // when the contact opens). Two diodes decode 5 (QA and QC both high):
    // only then does 4.7 k lift their junction above the extra diode in the
    // base lead, and Q3 pulls the relay in. Pole 1 cuts the clock, so the
    // count stays at 5; pole 2 lights the lamp. The button clears the
    // counter and the relay drops out. The light path's knob is how much
    // of the beam an object blocks (0 .. 1).
    'lab-barrier-counter': {
        vcc: 5, supply: SUP,
        parts: { bat: BAT5, osc: ['timer_555', {}], ra: R(1000), rb: R(6800), ct: C(100e-9), cv: C(10e-9),
            re: R(47), ir: ['ir_transmitter', {}], pt: ['phototransistor', {}], rpc: R(22000),
            cp: C(10e-9), dp1: ['diode', { part: '1N4148' }], dp2: ['diode', { part: '1N4148' }],
            ch: C(220e-9), rh: R(470000), rb1: R(10000), q1: NPN, rc1: R(10000), rb2: R(10000), q2: NPN, rc2: R(10000), rfb: R(1000000),
            rpd: R(100000), cclk: C(1e-9), cnt: ['74hc93', {}],
            clr: ['button', {}], rcl: R(10000),
            r0: R(470), l0: LED('red'), r1: R(470), l1: LED('red'), r2: R(470), l2: LED('red'),
            db: ['diode', { part: '1N4148' }], dc: ['diode', { part: '1N4148' }], rd: R(4700),
            ds: ['diode', { part: '1N4148' }], rb3: R(1000), rbq: R(10000), q3: NPN,
            k: ['relay_dpdt', { coilR: 200 }], df: ['diode', { part: '1N4148' }],
            rl: R(220), lamp: LED('green'),
            beam: PATH({ from: '@ir', to: '@pt', medium: 'air', distanceCm: 15, blocked: 0,
                knob: 'blocked', knobMin: 0, knobMax: 1 }) },
        nets: [
            ['bat.pos', 'osc.vcc', 'osc.reset', 'ra.a', 'rpc.a', 'rc1.a', 'rc2.a', 'cnt.vcc', 'clr.a', 'rd.a',
                'k.coil_a', 'df.cathode', 'k.com2'],
            ['ra.b', 'osc.discharge', 'rb.a'], ['rb.b', 'osc.threshold', 'osc.trigger', 'ct.a'], ['osc.control', 'cv.a'],
            ['osc.output', 're.a'], ['re.b', 'ir.anode'],
            ['pt.collector', 'rpc.b', 'cp.a'], ['cp.b', 'dp2.cathode', 'dp1.anode'], ['dp1.cathode', 'ch.a', 'rh.a', 'rb1.a'],
            ['rb1.b', 'q1.base', 'rfb.a'], ['q1.collector', 'rc1.b', 'rb2.a'], ['rb2.b', 'q2.base'],
            ['q2.collector', 'rc2.b', 'rfb.b', 'k.com1'], ['k.nc1', 'rpd.a', 'cclk.a', 'cnt.clk_a'],
            ['cnt.qa', 'cnt.clk_b', 'db.cathode', 'r0.a'], ['cnt.qb', 'r1.a'], ['cnt.qc', 'dc.cathode', 'r2.a'],
            ['db.anode', 'dc.anode', 'rd.b', 'ds.anode'], ['ds.cathode', 'rb3.a'], ['rb3.b', 'rbq.a', 'q3.base'],
            ['clr.b', 'rcl.a', 'cnt.r0_1', 'cnt.r0_2'],
            ['r0.b', 'l0.anode'], ['r1.b', 'l1.anode'], ['r2.b', 'l2.anode'],
            ['q3.collector', 'k.coil_b', 'df.anode'], ['k.no2', 'rl.a'], ['rl.b', 'lamp.anode'],
            ['bat.neg', 'osc.gnd', 'ct.b', 'cv.b', 'ir.cathode', 'pt.emitter', 'dp2.anode', 'ch.b', 'rh.b',
                'q1.emitter', 'q2.emitter', 'rpd.b', 'cclk.b', 'cnt.gnd', 'rcl.b',
                'l0.cathode', 'l1.cathode', 'l2.cathode', 'rbq.b', 'q3.emitter', 'lamp.cathode'],
        ],
        open: ['cnt.qd', 'cnt.nc1', 'cnt.nc2', 'cnt.nc3', 'cnt.nc4', 'k.no1', 'k.nc2'],
    },

    // A counter clocked by an audio signal, but only when it is loud enough.
    // The signal (a function generator standing in for an audio source such
    // as a radio's earphone output: 100 Hz, 0.5 V peak as authored) reaches
    // the 74HC93's clock input through 100 nF. 100 k from the wiper of the
    // threshold pot (10 k across the supply) biases that input just below
    // the counter's own switching level, half the supply. The counter
    // itself is the threshold: only a signal whose peaks reach that level
    // makes clock edges. Four LEDs show the count.
    'lab-loud-counter': {
        vcc: 5, supply: SUP,
        parts: { bat: BAT5, sig: ['function_gen', { wave: 'sine', freq: 100, amplitude: 0.5, offset: 0 }],
            cc: C(100e-9), rbias: R(100000), thr: POT(10000, 0.45), cnt: ['74hc93', {}],
            r0: R(470), l0: LED('red'), r1: R(470), l1: LED('red'), r2: R(470), l2: LED('red'), r3: R(470), l3: LED('red') },
        nets: [
            ['bat.pos', 'thr.a', 'cnt.vcc'],
            ['sig.out', 'cc.a'], ['cc.b', 'rbias.a', 'cnt.clk_a'], ['thr.wiper', 'rbias.b'],
            ['cnt.qa', 'cnt.clk_b', 'r0.a'], ['cnt.qb', 'r1.a'], ['cnt.qc', 'r2.a'], ['cnt.qd', 'r3.a'],
            ['r0.b', 'l0.anode'], ['r1.b', 'l1.anode'], ['r2.b', 'l2.anode'], ['r3.b', 'l3.anode'],
            ['bat.neg', 'sig.gnd', 'thr.b', 'cnt.gnd', 'cnt.r0_1', 'cnt.r0_2',
                'l0.cathode', 'l1.cathode', 'l2.cathode', 'l3.cathode'],
        ],
        open: ['cnt.nc1', 'cnt.nc2', 'cnt.nc3', 'cnt.nc4'],
    },
});
