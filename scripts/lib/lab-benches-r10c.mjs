/**
 * Netlists for the r10c lab benches, written by
 * `node scripts/gen-lab-circuits-4.mjs --set=r10c`.
 *
 * One quad op-amp (LM324) does the active work on every bench: comparators,
 * Schmitt triggers, integrators, oscillators, latches, gain stages and gates
 * built from op-amps (the chirp's pitch switch is one support transistor).
 * Two benches add one more part where the job needs it:
 * a depletion dual-gate MOSFET as the voltage-controlled resistor that holds
 * a Wien-bridge oscillator's amplitude, and a power-amplifier IC (LM386)
 * sounding the alarm of a reflective infrared alarm.
 *
 * Same shape as lab-benches-4.mjs: pure data, so test/lab-circuits-r10c.test.mjs
 * names parts by role. Ids follow benchIds (breadboard first, then the parts
 * in the order listed). A param written '@name' (a light path's from / to)
 * is resolved to that part's engine id at the end of this file.
 *
 * THE OP-AMP. bw-board's LM324 (src/ground-sensing-opamp.js) swings from
 * 5 mV above its GND pin to 1.5 V below its VCC pin, has a gain of 10^5 and
 * a 1 MHz gain-bandwidth, slews 0.3 V/µs and has no input offset voltage.
 * Its inputs carry the chip's bias current (PNP inputs: 45 nA typical out of
 * each pin, 5 nA offset between the two). Unused sections are parked as
 * followers on a defined input.
 */
import { benchIds } from './lab-benches-4.mjs';
export { benchIds };

const SUP = { pos: 'bat.pos', neg: 'bat.neg' };
const R = (ohms) => ['resistor', { ohms }];
const C = (farads) => ['capacitor', { farads }];
const EL = (farads) => ['polarized_cap', { farads }];
const LED = (color) => ['led', { color }];
const POT = (ohms, position) => ['potentiometer', { ohms, position }];
const SLIDE = (position = 0) => ['slide_switch', { position }];
const SW = (closed = false) => ['switch', { closed }];
const BTN = ['button', {}];
const SI = ['diode', { part: '1N4148' }];
const GE = ['diode', { part: '1N34A' }];
const BAT9 = ['vsource', { volts: 9, variant: '9v' }];
const QUAD = ['lm324', {}];
const NPN = ['npn', { beta: 100 }];
const SPK = ['speaker', { ohms: 8 }];
const VM = ['voltmeter', {}];
/** Park sections n… of `u` on the ground net: + and − and output together. */
const park = (...n) => n.flatMap(k => [`u.${k}_pos`, `u.${k}_neg`, `u.${k}_out`]);

export const BENCHES = {
    // The first op-amp on a ± supply. Two 9 V batteries in series: their
    // junction is 0 V, the LM324's VCC pin +9 V, its GND pin −9 V. The INPUT
    // pot runs from −9 V to +9 V. Section 1 is a bare comparator: + input on
    // the wiper, − input on 0 V. With a gain of 10^5 its output is only
    // between the rails while the wiper is within about 0.1 mV of zero — a
    // ten-thousandth of the knob's travel — so it can hardly be balanced:
    // red LED (output to 0 V) when above, green (0 V to output) when below.
    // Section 2 follows the wiper; its output drives 1 kΩ into a red and a
    // green LED back to back to 0 V. The meter across the LEDs follows the
    // knob through zero and stops at about +1.8 V and −1.9 V: each LED's
    // threshold, one per polarity. The second meter shows the wiper itself.
    'lab-opamp-plus-minus': {
        vcc: 9, supply: { pos: 'bp.pos', neg: 'gnd.gnd' },
        parts: { gnd: ['gnd', {}], bp: BAT9, bn: BAT9, knob: POT(10000, 0.6), u: QUAD,
            r1: R(1000), up: LED('red'), down: LED('green'),
            r2: R(1000), lp: LED('red'), ln: LED('green'), vm: VM, vin: VM },
        nets: [
            ['gnd.gnd', 'bp.neg', 'bn.pos', 'u.1_neg', 'up.cathode', 'down.anode', 'lp.cathode', 'ln.anode', 'vm.b', 'vin.b', ...park(3, 4)],
            ['bp.pos', 'u.vcc', 'knob.a'], ['bn.neg', 'u.gnd', 'knob.b'],
            ['knob.wiper', 'u.1_pos', 'u.2_pos', 'vin.a'],
            ['u.1_out', 'r1.a'], ['r1.b', 'up.anode', 'down.cathode'],
            ['u.2_out', 'u.2_neg', 'r2.a'], ['r2.b', 'lp.anode', 'ln.cathode', 'vm.a'],
        ],
    },

    // A function generator whose waveform a diode bends. Section 2 is a
    // Schmitt trigger (10 kΩ / 22 kΩ around a 4.5 V reference), section 1 an
    // integrator (100 nF) charged from the trigger's output through 47 kΩ:
    // a triangle at the integrator, a square at the trigger, about 25 Hz.
    // The SHAPE switch puts a diode and 2.2 kΩ beside the 47 kΩ: while the
    // trigger is low the integrator now runs back twenty times faster, so
    // the triangle becomes a sawtooth and the square a train of short
    // pulses. Red LED on the square, yellow on the triangle.
    'lab-opamp-sawtooth': {
        vcc: 9, supply: SUP,
        parts: { bat: BAT9, ra: R(10000), rb: R(10000), u: QUAD,
            rt: R(47000), shape: SW(false), dd: SI, rd: R(2200), ci: C(470e-9),
            r1: R(10000), r2: R(22000), rq: R(1000), lq: LED('red'), rr: R(1000), lr: LED('yellow') },
        nets: [
            ['bat.pos', 'ra.a', 'u.vcc'],
            ['ra.b', 'rb.a', 'u.1_pos', 'u.2_neg'],
            ['u.2_out', 'r2.b', 'rq.a', 'rt.a', 'dd.cathode'], ['dd.anode', 'rd.a'], ['rd.b', 'shape.a'],
            ['shape.b', 'rt.b', 'ci.a', 'u.1_neg'],
            ['u.1_out', 'ci.b', 'r1.a', 'rr.a'], ['r1.b', 'r2.a', 'u.2_pos'],
            ['rq.b', 'lq.anode'], ['rr.b', 'lr.anode'],
            ['bat.neg', 'rb.b', 'u.gnd', 'lq.cathode', 'lr.cathode', ...park(3, 4)],
        ],
    },

    // A staircase. Section 1 is a slow square-wave oscillator (Schmitt
    // trigger, 100 kΩ into 1 µF): about 7 steps a second, green LED. Each of
    // its falling edges drags 1 µF (the step capacitor) down; a diode then
    // pulls one capacitor-full of charge out of the summing node of the
    // integrator (section 2, 10 µF, + input at 0.3 V), so its output climbs
    // by the same step every time: a staircase. Each rising edge empties the
    // step capacitor through a second diode to ground. (The + input sits as
    // low as 0.3 V so that the two diodes in series, from the summing node
    // to ground, stay far below their threshold and leak nothing.) The red
    // LED on the staircase brightens in steps; the meter reads it. Section 3
    // watches the stairs: at about 4.2 V it switches high and, through 1 kΩ
    // and a diode, drives the integrator back down to about 0.8 V in a few
    // milliseconds, then lets go — and the climb starts again.
    'lab-opamp-staircase': {
        vcc: 9, supply: SUP,
        parts: { bat: BAT9, u: QUAD,
            sa: R(10000), sb: R(10000), sh: R(10000), st: R(100000), cs: EL(1e-6), rg: R(1000), clk: LED('green'),
            cp: C(1e-6), dout: SI, dref: SI, ia: R(47000), ib: R(1600), ci: EL(10e-6),
            ra: R(10000), rb: R(4700), rin: R(10000), rfb: R(22000), drst: SI, rrst: R(1000),
            rl: R(1000), step: LED('red'), meter: ['analog_meter', { fullScale: 6, ifs: 0.0001 }] },
        nets: [
            ['bat.pos', 'u.vcc', 'sa.a', 'ia.a', 'ra.a'],
            // section 1: square-wave oscillator
            ['sa.b', 'sb.a', 'sh.a', 'u.1_pos'], ['u.1_out', 'sh.b', 'st.a', 'rg.a', 'cp.a'], ['st.b', 'cs.pos', 'u.1_neg'],
            ['rg.b', 'clk.anode'],
            // the charge pump into the integrator
            ['cp.b', 'dout.cathode', 'dref.anode'],
            ['ia.b', 'ib.a', 'u.2_pos'],
            ['u.2_neg', 'dout.anode', 'ci.neg', 'drst.cathode'], ['u.2_out', 'ci.pos', 'rin.a', 'rl.a', 'meter.a'],
            // section 3: the reset trigger
            ['ra.b', 'rb.a', 'u.3_neg'], ['rin.b', 'rfb.a', 'u.3_pos'], ['u.3_out', 'rfb.b', 'rrst.a'], ['rrst.b', 'drst.anode'],
            ['rl.b', 'step.anode'],
            ['bat.neg', 'u.gnd', 'sb.b', 'cs.neg', 'clk.cathode', 'dref.cathode', 'ib.b', 'rb.b', 'step.cathode', 'meter.b', ...park(4)],
        ],
    },

    // Wien-bridge sine generator. Section 1 is a non-inverting amplifier:
    // 10 kΩ feedback against 4.3 kΩ plus the channel of a depletion
    // dual-gate MOSFET (both gates together) to the 4.5 V reference that
    // section 2 buffers. The Wien network (15 kΩ + 10 nF in series, 15 kΩ ‖
    // 10 nF) feeds back to the + input: about 1.06 kHz, where it passes a
    // third. With its gates at the source the channel is a few hundred ohms
    // and the gain about 3.2: the oscillation grows. A germanium diode from
    // the output charges 220 nF on the gates negative on every downward peak
    // (1 MΩ lets it go): the channel narrows until the gain is just three,
    // and the sine settles at about 1.2 V peak, clean (22 kΩ in the diode's
    // lead makes the control slow enough not to overshoot). AGC OFF (switch)
    // shorts the gates to the source: the gain stays at 3.2 and the
    // oscillation grows until the output clips at its limits.
    'lab-wien-mosfet': {
        vcc: 9, supply: SUP,
        parts: { bat: BAT9, u: QUAD, ra: R(10000), rb: R(10000),
            rs: R(15000), cs: C(10e-9), rp: R(15000), cp: C(10e-9),
            rf: R(10000), rg: R(4300), q: ['dual_gate_mosfet', {}],
            dg: GE, ra2: R(22000), cg: C(220e-9), rgl: R(1000000), agcoff: SW(false), vm: VM },
        nets: [
            ['bat.pos', 'u.vcc', 'ra.a'], ['ra.b', 'rb.a', 'u.2_pos'],
            ['u.2_out', 'u.2_neg', 'rp.b', 'cp.b', 'q.source', 'rgl.b', 'cg.b', 'agcoff.b', 'vm.b'],
            ['u.1_out', 'rs.a', 'rf.a', 'ra2.a', 'vm.a'], ['ra2.b', 'dg.cathode'], ['rs.b', 'cs.a'], ['cs.b', 'rp.a', 'cp.a', 'u.1_pos'],
            ['rf.b', 'rg.a', 'u.1_neg'], ['rg.b', 'q.drain'],
            ['q.gate1', 'q.gate2', 'dg.anode', 'cg.a', 'rgl.a', 'agcoff.a'],
            ['bat.neg', 'u.gnd', 'rb.b', ...park(3, 4)],
        ],
    },

    // A baby monitor: three op-amp stages one after the other. The
    // loudspeaker in the nursery is the microphone. Section 4 buffers a
    // 4.5 V midpoint; sections 1 and 2 are inverting amplifiers of 100 each
    // (1 kΩ in through 4.7 µF, 100 kΩ back); section 3 is a further
    // inverting stage of 1 (10 kΩ / 10 kΩ) or, with the GAIN switch
    // closed, 10 (1.1 kΩ beside its 10 kΩ input resistor). Ten thousand or a hundred
    // thousand: a few microvolts of speech at the loudspeaker become volts.
    // The earphone in the next room listens through 10 µF and 1 kΩ; the red
    // LED flickers with the loud parts.
    'lab-opamp-baby-monitor': {
        vcc: 9, supply: SUP,
        parts: { bat: BAT9, mic: ['speaker', { ohms: 8, soundDb: 0, soundWave: 'voice' }], u: QUAD,
            ma: R(10000), mb: R(10000), mc: EL(1e-6),
            c1: EL(4.7e-6), r1: R(1000), f1: R(100000),
            c2: EL(4.7e-6), r2: R(1000), f2: R(100000),
            c3: EL(4.7e-6), r3: R(10000), f3: R(10000), gain: SW(false), r3x: R(1100),
            co: EL(10e-6), ro: R(1000), ear: ['earphone', {}], rl: R(1000), led: LED('red') },
        nets: [
            ['bat.pos', 'u.vcc', 'ma.a'], ['ma.b', 'mb.a', 'mc.pos', 'u.4_pos'],
            ['u.4_out', 'u.4_neg', 'u.1_pos', 'u.2_pos', 'u.3_pos', 'mic.b', 'led.cathode'],
            ['mic.a', 'c1.neg'], ['c1.pos', 'r1.a'], ['r1.b', 'f1.a', 'u.1_neg'],
            ['u.1_out', 'f1.b', 'c2.pos'], ['c2.neg', 'r2.a'], ['r2.b', 'f2.a', 'u.2_neg'],
            ['u.2_out', 'f2.b', 'c3.pos'], ['c3.neg', 'r3.a', 'gain.a'], ['gain.b', 'r3x.a'], ['r3.b', 'r3x.b', 'f3.a', 'u.3_neg'],
            ['u.3_out', 'f3.b', 'co.pos', 'rl.a'], ['co.neg', 'ro.a'], ['ro.b', 'ear.a'], ['rl.b', 'led.anode'],
            ['bat.neg', 'u.gnd', 'mb.b', 'mc.neg', 'ear.b'],
        ],
    },

    // Op-amp Schmitt trigger: what sets the hysteresis. The INPUT pot is
    // 100 kΩ: a source with up to 25 kΩ of its own. Section 2 is the
    // trigger: − input on 4.5 V (10 kΩ / 10 kΩ), + input fed through 10 kΩ
    // from the input and through the WIDTH switch's 47 kΩ (left) or 15 kΩ
    // (right) from its own output. The window is the output swing (7.5 V)
    // times 10 kΩ over the feedback resistor: about 1.6 V or 5 V wide. The
    // BUFFER switch takes the input straight from the wiper (left) or from
    // section 1, a follower (right). Without the buffer the pot's own
    // resistance adds to the 10 kΩ and the window changes with the knob;
    // with it the window is exactly what the two resistors say. Red LED:
    // output high. The meter reads the input.
    'lab-opamp-hysteresis': {
        vcc: 9, supply: SUP,
        parts: { bat: BAT9, knob: POT(100000, 0.5), u: QUAD, buffer: SLIDE(1), rin: R(10000),
            width: SLIDE(0), rw: R(47000), rn: R(15000), ra: R(10000), rb: R(6800),
            rl: R(1000), hi: LED('red'), vm: VM },
        nets: [
            ['bat.pos', 'knob.a', 'u.vcc', 'ra.a'],
            ['knob.wiper', 'u.1_pos', 'buffer.a', 'vm.a'], ['u.1_out', 'u.1_neg', 'buffer.b'], ['buffer.com', 'rin.a'],
            ['rin.b', 'width.com', 'u.2_pos'], ['width.a', 'rw.a'], ['width.b', 'rn.a'],
            ['u.2_out', 'rw.b', 'rn.b', 'rl.a'], ['ra.b', 'rb.a', 'u.2_neg'], ['rl.b', 'hi.anode'],
            ['bat.neg', 'knob.b', 'u.gnd', 'rb.b', 'hi.cathode', 'vm.b', ...park(3, 4)],
        ],
    },

    // A flip-flop worked by hand, then by itself. Section 1 is an inverting
    // Schmitt trigger: + input on three 10 kΩ from +9 V, ground and its own
    // output — 5.5 V while the output is high, 3.0 V while it is low. Its −
    // input is a 22 µF capacitor that only the learner fills and empties:
    // CHARGE (10 kΩ from +9 V) and DRAIN (10 kΩ to ground). Fill it past
    // 5.5 V and the output drops (green LED → red LED); drain it below 3 V
    // and it comes back. AUTO closes 47 kΩ from the output to the capacitor:
    // now the output fills and drains it by itself, a little over half a
    // second each way — an astable.
    'lab-opamp-hand-astable': {
        vcc: 9, supply: SUP,
        parts: { bat: BAT9, u: QUAD, ha: R(10000), hb: R(10000), hf: R(10000),
            charge: BTN, rc: R(10000), drain: BTN, rd: R(10000), ct: EL(22e-6),
            auto: SW(false), rt: R(47000),
            rg: R(1000), high: LED('green'), rr: R(1000), low: LED('red'), vm: VM },
        nets: [
            ['bat.pos', 'u.vcc', 'ha.a', 'charge.a', 'rr.a'],
            ['ha.b', 'hb.a', 'hf.a', 'u.1_pos'],
            ['charge.b', 'rc.a'], ['drain.b', 'rd.a'],
            ['rc.b', 'rd.b', 'ct.pos', 'u.1_neg', 'auto.a', 'vm.a'], ['auto.b', 'rt.a'],
            ['u.1_out', 'hf.b', 'rt.b', 'rg.a', 'low.cathode'], ['rg.b', 'high.anode'], ['rr.b', 'low.anode'],
            ['bat.neg', 'u.gnd', 'hb.b', 'drain.a', 'ct.neg', 'high.cathode', 'vm.b', ...park(2, 3, 4)],
        ],
    },

    // A tone at the edge of hearing. Section 1 is a relaxation oscillator:
    // a Schmitt trigger (three 10 kΩ, thresholds 3 V and 5.5 V) whose
    // output charges 10 nF through 2.2 kΩ and the 100 kΩ PITCH pot. Knob
    // down: about 650 Hz; knob up: about 20 kHz, where the op-amp's slew
    // rate is already rounding the square's edges. The loudspeaker listens
    // through 10 µF and 220 Ω.
    'lab-opamp-hearing-limit': {
        vcc: 9, supply: SUP,
        parts: { bat: BAT9, u: QUAD, ha: R(10000), hb: R(10000), hf: R(10000),
            rmin: R(2200), pitch: POT(100000, 0.5), ct: C(10e-9),
            co: EL(10e-6), rs: R(1000), spk: SPK },
        nets: [
            ['bat.pos', 'u.vcc', 'ha.a'], ['ha.b', 'hb.a', 'hf.a', 'u.1_pos'],
            ['u.1_out', 'hf.b', 'rmin.a', 'co.pos'], ['rmin.b', 'pitch.a'], ['pitch.wiper', 'pitch.b', 'ct.a', 'u.1_neg'],
            ['co.neg', 'rs.a'], ['rs.b', 'spk.a'],
            ['bat.neg', 'u.gnd', 'hb.b', 'ct.b', 'spk.b', ...park(2, 3, 4)],
        ],
    },

    // Two op-amp flip-flops. Both are latches: an LM324 section whose +
    // input hangs between its own output (100 kΩ) and a 1.5 V tap (33 kΩ),
    // against a − input on 3.0 V. Output high (7.5 V): + at 3.0 + … = 3.0 V
    // plus, i.e. above; output low: + at 1.1 V, below. It stays put.
    // Section 1, SET / RESET: SET pulls its + input to +9 V through 4.7 kΩ,
    // RESET pulls it to ground; yellow LED = set. Section 2, TOGGLE: one
    // button. Its output charges 1 µF through 100 kΩ, so the capacitor
    // always holds the output's level of a moment ago. The button connects
    // that capacitor to the − input. Output high: the capacitor is at 7.5 V,
    // the − input jumps above the + input and the output falls. Output low:
    // the capacitor is at 0 V, the − input falls below the + input and the
    // output rises. One press, one change; red LED = on.
    'lab-opamp-toggle': {
        vcc: 9, supply: SUP,
        parts: { bat: BAT9, u: QUAD, ta: R(47000), tb: R(10000), tc: R(10000),
            f1: R(100000), g1: R(47000), set: BTN, rs: R(4700), reset: BTN, rr: R(4700), l1: R(1000), q1: LED('yellow'),
            f2: R(100000), g2: R(47000), rx: R(10000), tog: BTN, rm: R(220000), cm: EL(1e-6), l2: R(1000), q2: LED('red') },
        nets: [
            ['bat.pos', 'u.vcc', 'ta.a', 'set.a'],
            ['ta.b', 'tb.a', 'u.1_neg', 'rx.a'], ['rx.b', 'u.2_neg', 'tog.a'], ['tb.b', 'tc.a', 'g1.b', 'g2.b'],
            ['u.1_pos', 'f1.b', 'g1.a', 'rs.b', 'rr.b'], ['set.b', 'rs.a'], ['reset.b', 'rr.a'],
            ['u.1_out', 'f1.a', 'l1.a'], ['l1.b', 'q1.anode'],
            ['u.2_pos', 'f2.b', 'g2.a'], ['u.2_out', 'f2.a', 'rm.a', 'l2.a'], ['rm.b', 'cm.pos', 'tog.b'], ['l2.b', 'q2.anode'],
            ['bat.neg', 'u.gnd', 'tc.b', 'reset.a', 'q1.cathode', 'cm.neg', 'q2.cathode', ...park(3, 4)],
        ],
    },

    // Op-amp meter stages, and what they need. Section 4 buffers a 4.5 V
    // midpoint. Section 1 is a ×10 stage (91 kΩ / 10 kΩ) for small voltages
    // against that midpoint; its input lead hangs on 1 MΩ. The LM324 drives
    // about 45 nA out of each input (its input transistors are PNP; the
    // engine's model carries it, 47.5 nA at this + input). Through the 1 MΩ
    // (‖ 10 MΩ) that makes +43 mV at the input, about +0.48 V at the meter,
    // with nothing connected. The ZERO pot feeds a small opposing current
    // through 10 MΩ into the input: turned to the right place, the meter
    // reads zero.
    // PROBE connects a 50 mV source (330 Ω from the midpoint): the meter
    // then reads 0.5 V. Section 2 is an ammeter: the circuit under test is
    // 4.5 V driving 47 Ω and a 10 Ω sensing resistor; section 2 amplifies
    // the sensing voltage five times (40 kΩ / 10 kΩ) onto a second meter.
    // Its + input comes through 10 kΩ, and a germanium diode from ground
    // clamps it: reverse the circuit under test (POLARITY) and the input
    // stays at about −0.25 V instead of −0.8 V, so the meter only drops to
    // zero.
    'lab-opamp-meter-stages': {
        vcc: 9, supply: SUP,
        parts: { bat: BAT9, gnd: ['gnd', {}], u: QUAD, ma: R(10000), mb: R(10000),
            rin: R(1000000), zero: POT(10000, 0.5), rz: R(10000000),
            probe: BTN, pa: R(330), pb: R(30000), rf: R(91000), rg: R(10000), meter: VM,
            load: ['vsource', { volts: 4.5 }], rev: ['vsource', { volts: 4.5 }], pol: SLIDE(0), rl: R(47), shunt: R(10), rp: R(10000), dp: GE,
            rf2: R(40000), rg2: R(10000), amps: VM },
        nets: [
            ['bat.pos', 'u.vcc', 'ma.a', 'zero.a', 'pb.a'],
            ['ma.b', 'mb.a', 'u.4_pos'],
            ['u.4_out', 'u.4_neg', 'rin.b', 'pa.b', 'rg.b', 'meter.b'],
            ['rin.a', 'rz.b', 'probe.b', 'u.1_pos'], ['zero.wiper', 'rz.a'],
            ['probe.a', 'pa.a', 'pb.b'],
            ['u.1_neg', 'rf.b', 'rg.a'], ['u.1_out', 'rf.a', 'meter.a'],
            ['load.pos', 'pol.a'], ['rev.neg', 'pol.b'], ['pol.com', 'rl.a'],
            ['rl.b', 'shunt.a', 'rp.a'], ['rp.b', 'dp.cathode', 'u.2_pos'],
            ['u.2_neg', 'rf2.b', 'rg2.a'], ['u.2_out', 'rf2.a', 'amps.a'],
            ['bat.neg', 'gnd.gnd', 'u.gnd', 'mb.b', 'zero.b', 'shunt.b', 'load.neg', 'rev.pos', 'dp.anode', 'rg2.b', 'amps.b', ...park(3)],
        ],
        open: [],
    },

    // Gated tone generators. Section 1 is a slow square-wave oscillator
    // (Schmitt trigger, 100 kΩ into 1 µF: about 7 Hz; RATTLE swaps in
    // 100 nF instead: about 70 Hz). Section 2 is a tone oscillator (Schmitt
    // trigger, 22 kΩ into 47 nF: about 640 Hz). While the slow oscillator's
    // output is high a diode holds the tone's capacitor above its upper
    // threshold and the tone stops: short pips of tone seven times a second
    // — a chick — or, with RATTLE, a rattle. Green LED: lit while the gate
    // holds the tone off; the loudspeaker plays.
    'lab-opamp-gated-tones': {
        vcc: 9, supply: SUP,
        parts: { bat: BAT9, u: QUAD,
            sa: R(10000), sb: R(10000), sh: R(10000), st: R(100000), cs: C(1e-6), rattle: SLIDE(0), cr: C(100e-9),
            ta: R(10000), tb: R(10000), th: R(10000), tt: R(22000), ct: C(47e-9), dg: SI,
            rg: R(1000), gate: LED('green'), co: EL(10e-6), rs: R(220), spk: SPK },
        nets: [
            ['bat.pos', 'u.vcc', 'sa.a', 'ta.a'],
            ['sa.b', 'sb.a', 'sh.a', 'u.1_pos'], ['u.1_out', 'sh.b', 'st.a', 'rg.a', 'dg.anode'],
            ['st.b', 'rattle.com', 'u.1_neg'], ['rattle.a', 'cs.a'], ['rattle.b', 'cr.a'],
            ['ta.b', 'tb.a', 'th.a', 'u.2_pos'], ['u.2_out', 'th.b', 'tt.a', 'co.pos'],
            ['tt.b', 'ct.a', 'u.2_neg', 'dg.cathode'],
            ['rg.b', 'gate.anode'], ['co.neg', 'rs.a'], ['rs.b', 'spk.a'],
            ['bat.neg', 'u.gnd', 'sb.b', 'cs.b', 'cr.b', 'tb.b', 'ct.b', 'gate.cathode', 'spk.b', ...park(3, 4)],
        ],
    },

    // A pitch-sliding chirp. Section 1 is a slow Schmitt-trigger astable
    // (thresholds 3 V / 5.5 V) whose capacitor charges through 100 kΩ and
    // is emptied quickly through a diode and 4.7 kΩ: a sawtooth, rising for
    // about 85 ms and dropping in a few. SLOW swaps 1 µF for 10 µF: ten
    // times slower. Section 2 amplifies the sawtooth 2.7 times around the
    // 4.5 V midpoint (47 kΩ / 22 kΩ to a 10 kΩ / 10 kΩ divider): a control
    // voltage sweeping from about 0.4 V to 7 V. Sections 3 and 4 are a
    // voltage-controlled oscillator: an integrator (100 kΩ, 10 nF, + input
    // at half the control voltage) ramps down while the transistor is off
    // and up while it pulls 47 kΩ from its − input to ground; the Schmitt
    // trigger of section 4 switches the transistor at 3 V and 5.5 V. The
    // ramp's speed, and so the pitch, is proportional to the control
    // voltage: about 100 Hz per volt. Each sawtooth is one chirp, sliding up
    // from a growl to over 700 Hz and falling back at once: a chick's
    // cheeping, or with SLOW a long rising crow. Green LED: section 1's
    // output (lit while a chirp rises); the loudspeaker plays section 4.
    'lab-opamp-chirp': {
        vcc: 9, supply: SUP,
        parts: { bat: BAT9, u: QUAD,
            sa: R(10000), sb: R(10000), sh: R(10000), st: R(100000), ds: SI, rd: R(4700), slow: SLIDE(0), cs: EL(1e-6), cw: EL(10e-6),
            ma: R(10000), mb: R(10000), rg: R(22000), rf: R(47000),
            rv1: R(100000), rv2: R(100000), ri: R(100000), rq: R(47000), ci: C(10e-9), q: NPN, rb: R(22000),
            ta: R(10000), tb: R(10000), th: R(10000), rl: R(1000), led: LED('green'), co: EL(10e-6), rs: R(220), spk: SPK },
        nets: [
            ['bat.pos', 'u.vcc', 'sa.a', 'ma.a', 'ta.a'],
            ['sa.b', 'sb.a', 'sh.a', 'u.1_pos'], ['u.1_out', 'sh.b', 'st.a', 'rd.a', 'rl.a'], ['rd.b', 'ds.cathode'],
            ['st.b', 'ds.anode', 'slow.com', 'u.1_neg', 'u.2_pos'], ['slow.a', 'cs.pos'], ['slow.b', 'cw.pos'],
            ['ma.b', 'mb.a', 'rg.a'], ['rg.b', 'rf.a', 'u.2_neg'], ['u.2_out', 'rf.b', 'rv1.a', 'ri.a'],
            ['rv1.b', 'rv2.a', 'u.3_pos'], ['ri.b', 'rq.a', 'ci.a', 'u.3_neg'], ['u.3_out', 'ci.b', 'u.4_neg'], ['rq.b', 'q.collector'],
            ['ta.b', 'tb.a', 'th.a', 'u.4_pos'], ['u.4_out', 'th.b', 'rb.a', 'co.pos'], ['rb.b', 'q.base'],
            ['co.neg', 'rs.a'], ['rs.b', 'spk.a'], ['rl.b', 'led.anode'],
            ['bat.neg', 'u.gnd', 'sb.b', 'cs.neg', 'cw.neg', 'mb.b', 'rv2.b', 'q.emitter', 'tb.b', 'spk.b', 'led.cathode'],
        ],
    },

    // Two tone generators in beat. Sections 1 and 2 are the same relaxation
    // oscillator (Schmitt trigger, thresholds 3 V and 5.5 V, 10 nF): one
    // with 68 kΩ, the other with 56 kΩ plus the 22 kΩ DETUNE pot — near the
    // first one's pitch when the knob is a little past half. Section 3 adds
    // the two capacitor voltages (100 kΩ each into its − input, 47 kΩ back,
    // around the 4.5 V midpoint): where the two triangles are in step they
    // add, where they are opposite they cancel. The sum swells and fades as
    // often per second as the two pitches differ: a floating tone. The
    // loudspeaker plays the sum through 10 µF and 1 kΩ.
    'lab-opamp-beats': {
        vcc: 9, supply: SUP,
        parts: { bat: BAT9, u: QUAD, ma: R(10000), mb: R(10000),
            a1: R(10000), b1: R(10000), h1: R(10000), t1: R(68000), c1: C(10e-9),
            a2: R(10000), b2: R(10000), h2: R(10000), t2: R(56000), detune: POT(22000, 0.5), c2: C(10e-9),
            s1: R(100000), s2: R(100000), sf: R(47000), co: EL(10e-6), rs: R(1000), spk: SPK },
        nets: [
            ['bat.pos', 'u.vcc', 'ma.a', 'a1.a', 'a2.a'],
            ['ma.b', 'mb.a', 'u.3_pos'],
            ['a1.b', 'b1.a', 'h1.a', 'u.1_pos'], ['u.1_out', 'h1.b', 't1.a'], ['t1.b', 'c1.a', 'u.1_neg', 's1.a'],
            ['a2.b', 'b2.a', 'h2.a', 'u.2_pos'], ['u.2_out', 'h2.b', 't2.a'], ['t2.b', 'detune.a'],
            ['detune.wiper', 'detune.b', 'c2.a', 'u.2_neg', 's2.a'],
            ['s1.b', 's2.b', 'sf.a', 'u.3_neg'], ['u.3_out', 'sf.b', 'co.pos'], ['co.neg', 'rs.a'], ['rs.b', 'spk.a'],
            ['bat.neg', 'u.gnd', 'mb.b', 'b1.b', 'c1.b', 'b2.b', 'c2.b', 'spk.b', ...park(4)],
        ],
    },

    // A frequency doubler. Section 1 is a slow astable (Schmitt trigger,
    // thresholds 3 V and 5.5 V, 47 kΩ into 10 µF): about 1.5 blinks a second
    // on the green LED, and on its capacitor a ramp that climbs from 3 V to
    // 5.4 V and falls back. Sections 2 and 3 compare that ramp with the two
    // ends of a window: 18 kΩ from +9 V, the WIDTH rheostat (up to 10 kΩ),
    // 16 kΩ to ground — centred on about 4.2 V like the ramp, about 2 V wide
    // with the knob down and nothing with it up. Section 2 is high while the ramp is above the lower edge,
    // section 3 while it is below the upper edge. Section 4 is a NAND built
    // from an op-amp: the two outputs, averaged by two 10 kΩ, against
    // 5.6 V. Only when both are high (the ramp inside the window) does its
    // output go low. The ramp leaves the window twice in every period —
    // once over the top, once under the bottom — so the red LED on the NAND
    // blinks twice for every blink of the green one.
    'lab-opamp-doubler': {
        vcc: 9, supply: SUP,
        parts: { bat: BAT9, u: QUAD, ha: R(10000), hb: R(10000), hf: R(10000), rt: R(47000), ct: EL(10e-6),
            wa: R(18000), width: POT(10000, 0.3), wb: R(16000),
            na: R(10000), nb: R(10000), ra: R(10000), rb: R(16000),
            rg: R(1000), slow: LED('green'), rr: R(1000), fast: LED('red') },
        nets: [
            ['bat.pos', 'u.vcc', 'ha.a', 'wa.a', 'ra.a'],
            ['ha.b', 'hb.a', 'hf.a', 'u.1_pos'], ['u.1_out', 'hf.b', 'rt.a', 'rg.a'],
            ['rt.b', 'ct.pos', 'u.1_neg', 'u.2_pos', 'u.3_neg'],
            ['wa.b', 'width.a', 'u.3_pos'], ['width.wiper', 'width.b', 'wb.a', 'u.2_neg'],
            ['u.2_out', 'na.a'], ['u.3_out', 'nb.a'], ['na.b', 'nb.b', 'u.4_neg'], ['ra.b', 'rb.a', 'u.4_pos'],
            ['u.4_out', 'rr.a'], ['rg.b', 'slow.anode'], ['rr.b', 'fast.anode'],
            ['bat.neg', 'u.gnd', 'hb.b', 'ct.neg', 'wb.b', 'rb.b', 'slow.cathode', 'fast.cathode'],
        ],
    },

    // Logic gates from op-amps. The buttons A and B each lift a line to
    // 6.1 V (22 kΩ from +9 V against 47 kΩ to ground). Sections 1 and 2
    // buffer the two lines, so what follows cannot load them; two 10 kΩ
    // average the buffered lines: 0 V, 3.05 V (one pressed) or 6.1 V (both).
    // The MODE switch picks the reference the average is compared with:
    // 4.5 V (left, AND) or 1.5 V (right, OR). Section 3 has the average on
    // its + input and the reference on its −: green LED = AND (or OR).
    // Section 4 has them the other way round: red LED = NAND (or NOR) —
    // swapping a comparator's inputs inverts the gate.
    'lab-opamp-gates': {
        vcc: 9, supply: SUP,
        parts: { bat: BAT9, u: QUAD, a: BTN, ra: R(22000), ga: R(47000), b: BTN, rb: R(22000), gb: R(47000),
            sa: R(10000), sb: R(10000), r1: R(10000), r2: R(6800), r3: R(3300), mode: SLIDE(0),
            rg: R(1000), and: LED('green'), rr: R(1000), nand: LED('red') },
        nets: [
            ['bat.pos', 'u.vcc', 'a.a', 'b.a', 'r1.a'],
            ['a.b', 'ra.a'], ['ra.b', 'ga.a', 'u.1_pos'], ['b.b', 'rb.a'], ['rb.b', 'gb.a', 'u.2_pos'],
            ['u.1_out', 'u.1_neg', 'sa.a'], ['u.2_out', 'u.2_neg', 'sb.a'], ['sa.b', 'sb.b', 'u.3_pos', 'u.4_neg'],
            ['r1.b', 'r2.a', 'mode.a'], ['r2.b', 'r3.a', 'mode.b'], ['mode.com', 'u.3_neg', 'u.4_pos'],
            ['u.3_out', 'rg.a'], ['u.4_out', 'rr.a'], ['rg.b', 'and.anode'], ['rr.b', 'nand.anode'],
            ['bat.neg', 'u.gnd', 'ga.b', 'gb.b', 'r3.b', 'and.cathode', 'nand.cathode'],
        ],
    },

    // Telling LEDs apart by ear. The LED in the socket (the slide switch
    // picks the red or the green one) carries 1.5 mA from +9 V through
    // 4.7 kΩ; section 3 buffers its forward voltage. Section 1 integrates
    // the difference between that voltage and the NULL pot's (10 nF; 10 kΩ
    // in, + input on the pot): its output ramps down at a rate set by the
    // difference. Section 2 is a Schmitt trigger: when the ramp reaches
    // about 3 V it switches low and, through a diode and 4.7 kΩ, throws the
    // integrator back up to about 5 V, then lets go. The pulses per second
    // follow the difference: turn NULL until the tone stops for the red LED
    // — the pot now matches its forward voltage — then switch to the green
    // one: its higher forward voltage makes a tone again. The loudspeaker
    // plays the pulses through 10 µF and 220 Ω.
    'lab-opamp-led-pitch': {
        vcc: 9, supply: SUP,
        parts: { bat: BAT9, u: QUAD, rled: R(4700), sel: SLIDE(0), red: LED('red'), green: LED('green'),
            na: R(82000), null: POT(10000, 0.1), nb: R(18000),
            ri: R(10000), ci: C(10e-9), ha: R(10000), hb: R(8200), hx: R(10000), hf: R(33000), dr: SI, rr: R(4700),
            co: EL(10e-6), rs: R(220), spk: SPK, vm: VM },
        nets: [
            ['bat.pos', 'u.vcc', 'rled.a', 'na.a', 'ha.a'],
            ['rled.b', 'sel.com', 'u.3_pos'], ['sel.a', 'red.anode'], ['sel.b', 'green.anode'],
            ['u.3_out', 'u.3_neg', 'ri.a', 'vm.a'],
            ['na.b', 'null.a'], ['null.b', 'nb.a'], ['null.wiper', 'u.1_pos', 'vm.b'],
            ['ri.b', 'ci.a', 'u.1_neg', 'dr.anode'], ['dr.cathode', 'rr.a'],
            ['u.1_out', 'ci.b', 'hx.a'], ['hx.b', 'hf.a', 'u.2_pos'], ['ha.b', 'hb.a', 'u.2_neg'],
            ['u.2_out', 'hf.b', 'rr.b', 'co.pos'], ['co.neg', 'rs.a'], ['rs.b', 'spk.a'],
            ['bat.neg', 'u.gnd', 'red.cathode', 'green.cathode', 'nb.b', 'hb.b', 'spk.b', ...park(4)],
        ],
    },

    // A key finder that whistles back. The loudspeaker is the microphone.
    // Section 1 amplifies it 100 times (1 kΩ in through 4.7 µF, 100 kΩ
    // back, + input on a 4.5 V midpoint), section 2 another 33 times;
    // SENSITIVE (slide switch) also routes it through section 3 (10 more).
    // Section 4 is a latch: the signal's
    // positive peaks reach its + input through a diode; the THRESHOLD pot
    // sets its − input; a voltmeter between the two shows how far the
    // peaks stay below the threshold, a help in setting it. Once a peak
    // gets over, the output goes high and
    // holds itself there through 47 kΩ and a diode; the red ALARM LED stays
    // on until RESET pulls the + input down.
    'lab-opamp-key-finder': {
        vcc: 9, supply: SUP,
        parts: { bat: BAT9, mic: ['speaker', { ohms: 8, soundDb: 0, soundWave: 'tone', soundHz: 2000 }], u: QUAD,
            ma: R(10000), mb: R(10000), mc: EL(1e-6),
            c1: EL(4.7e-6), r1: R(1000), f1: R(100000), c2: EL(4.7e-6), r2: R(3300), f2: R(100000),
            c3: EL(4.7e-6), r3: R(10000), f3: R(100000), sens: SLIDE(0),
            dpk: SI, rpk: R(1000000), thr: POT(10000, 0.55), vm: VM, dh: SI, rh: R(47000), reset: BTN, rrs: R(1000),
            ra: R(1000), alarm: LED('red') },
        nets: [
            ['bat.pos', 'u.vcc', 'ma.a', 'thr.a'], ['ma.b', 'mb.a', 'mc.pos', 'u.1_pos', 'u.2_pos', 'u.3_pos', 'mic.b'],
            ['mic.a', 'c1.neg'], ['c1.pos', 'r1.a'], ['r1.b', 'f1.a', 'u.1_neg'],
            ['u.1_out', 'f1.b', 'c2.pos'], ['c2.neg', 'r2.a'], ['r2.b', 'f2.a', 'u.2_neg'],
            ['u.2_out', 'f2.b', 'c3.pos', 'sens.a'], ['c3.neg', 'r3.a'], ['r3.b', 'f3.a', 'u.3_neg'], ['u.3_out', 'f3.b', 'sens.b'],
            ['sens.com', 'dpk.anode'],
            ['dpk.cathode', 'rpk.a', 'dh.cathode', 'u.4_pos', 'reset.a', 'vm.a'], ['thr.wiper', 'u.4_neg', 'vm.b'],
            ['u.4_out', 'rh.a', 'ra.a'], ['rh.b', 'dh.anode'], ['reset.b', 'rrs.a'], ['ra.b', 'alarm.anode'],
            ['bat.neg', 'u.gnd', 'mb.b', 'mc.neg', 'rpk.b', 'thr.b', 'rrs.b', 'alarm.cathode'],
        ],
    },

    // A reflective infrared alarm. Section 1 is an astable (Schmitt
    // trigger, thresholds 3 V and 5.5 V, 12 kΩ into 47 nF: about 1.2 kHz)
    // that pulses the infrared LED through 220 Ω. Beside it the
    // phototransistor (10 kΩ in its emitter) sees what a surface in front of
    // them reflects; the light path's knob is the distance. Section 2 is a
    // band-pass tuned to the pulses (multiple feedback: 10 kΩ, 1 kΩ, two
    // 22 nF, 47 kΩ, around a 4.5 V midpoint): steady light does not pass,
    // the pulses do. A germanium diode rectifies its output onto 1 µF
    // (22 kΩ drains it); the meter reads that level above the midpoint.
    // Section 3 compares it, through 100 kΩ, with 4.9 V and, once over,
    // holds itself high through a diode and 10 kΩ: the red ALARM LED stays
    // on until RESET (held a moment, while the
    // level drains) pulls its + input down. The alarm sounds from an LM386
    // relaxation oscillator whose + input a "kill" NPN holds at ground; the
    // latch's output turns on a second NPN that takes the kill NPN's base
    // current away, and the tone starts.
    'lab-ir-reflect-alarm': {
        vcc: 9, supply: SUP,
        parts: { bat: BAT9, u: QUAD, ma: R(10000), mb: R(10000), mc: EL(1e-6),
            ha: R(10000), hb: R(10000), hf: R(10000), rt: R(12000), ct: C(47e-9), rir: R(220), ir: ['ir_transmitter', {}],
            pt: ['phototransistor', { light: 0 }], rpt: R(10000), cin: C(100e-9),
            b1: R(10000), b2: R(1000), bc1: C(22e-9), bc2: C(22e-9), bf: R(47000),
            dr: GE, ch: C(1e-6), rdis: R(22000), meter: ['analog_meter', { fullScale: 3, ifs: 0.0001 }], rcr: R(100000),
            ta: R(10000), tb: R(12000), dh: SI, rh: R(10000), reset: BTN, rrs: R(1000), rled: R(1000), led: LED('red'),
            rsb: R(10000), qs: NPN, rk: R(47000), qk: NPN,
            amp: ['lm386', {}], rah: R(47000), caf: C(1e-9), rav: R(100000), rat: R(10000), cat: C(100e-9),
            cao: EL(47e-6), rsp: R(47), spk: SPK,
            surface: ['light_path', { from: '@ir', to: '@pt', medium: 'reflect', surface: 'white', distanceCm: 20,
                knob: 'distanceCm', knobMin: 1, knobMax: 20 }] },
        nets: [
            ['bat.pos', 'u.vcc', 'ma.a', 'ha.a', 'pt.collector', 'ta.a', 'rk.a', 'amp.vs', 'rav.a'],
            ['ma.b', 'mb.a', 'mc.pos', 'u.2_pos', 'meter.b'],
            ['ha.b', 'hb.a', 'hf.a', 'u.1_pos'], ['u.1_out', 'hf.b', 'rt.a', 'rir.a'], ['rt.b', 'ct.a', 'u.1_neg'],
            ['rir.b', 'ir.anode'],
            ['pt.emitter', 'rpt.a', 'cin.a'], ['cin.b', 'b1.a'], ['b1.b', 'b2.a', 'bc1.a', 'bc2.a'],
            ['bc2.b', 'bf.a', 'u.2_neg'], ['u.2_out', 'bf.b', 'bc1.b', 'dr.anode'],
            ['dr.cathode', 'ch.a', 'rdis.a', 'rcr.a', 'meter.a'],
            ['rcr.b', 'u.3_pos', 'dh.cathode', 'reset.a'], ['ta.b', 'tb.a', 'u.3_neg'],
            ['u.3_out', 'rh.a', 'rled.a', 'rsb.a'], ['rh.b', 'dh.anode'], ['reset.b', 'rrs.a'], ['rled.b', 'led.anode'],
            ['rsb.b', 'qs.base'], ['rk.b', 'qk.base', 'qs.collector'],
            ['amp.inp', 'rah.b', 'caf.b', 'rav.b', 'qk.collector'],
            ['amp.vout', 'rah.a', 'caf.a', 'rat.a', 'cao.pos'], ['amp.inn', 'rat.b', 'cat.a'], ['cao.neg', 'rsp.a'], ['rsp.b', 'spk.a'],
            ['bat.neg', 'u.gnd', 'mb.b', 'mc.neg', 'hb.b', 'ct.b', 'ir.cathode', 'rpt.b', 'b2.b', 'ch.b', 'rdis.b', 'tb.b', 'rrs.b',
                'led.cathode', 'qs.emitter', 'qk.emitter', 'amp.gnd', 'cat.b', 'spk.b', ...park(4)],
        ],
        open: ['amp.gain1', 'amp.gain8', 'amp.bypass'],
    },
};

// Labels the learner sees on the controls and readouts the pages name.
const LABELS = {
    'lab-opamp-plus-minus': { bp: '+9 V battery', bn: '−9 V battery', knob: 'INPUT', vm: 'LED pair volts', vin: 'input volts' },
    'lab-opamp-sawtooth': { shape: 'SHAPE (diode)' },
    'lab-opamp-staircase': { meter: 'staircase volts', step: 'stairs', clk: 'clock' },
    'lab-wien-mosfet': { agcoff: 'AGC OFF', vm: 'output volts' },
    'lab-opamp-baby-monitor': { mic: 'nursery (loudspeaker as microphone)', gain: 'GAIN ×10', ear: 'listening room' },
    'lab-opamp-hysteresis': { knob: 'INPUT', buffer: 'BUFFER (off / on)', width: 'WIDTH (47 kΩ / 15 kΩ)', vm: 'input volts' },
    'lab-opamp-hand-astable': { charge: 'CHARGE', drain: 'DRAIN', auto: 'AUTO', vm: 'capacitor volts' },
    'lab-opamp-hearing-limit': { pitch: 'PITCH' },
    'lab-opamp-toggle': { set: 'SET', reset: 'RESET', tog: 'TOGGLE' },
    'lab-opamp-meter-stages': { zero: 'ZERO', probe: 'PROBE 50 mV', meter: '×10 meter',
        load: 'circuit under test 4.5 V', rev: 'the same, connected backwards', pol: 'POLARITY', amps: 'ammeter (1 V = 20 mA)' },
    'lab-opamp-gated-tones': { rattle: 'RATTLE', gate: 'gate' },
    'lab-opamp-chirp': { slow: 'SLOW (chick / crow)', led: 'chirp', ci: 'pitch', q: 'pitch switch' },
    'lab-opamp-beats': { detune: 'DETUNE' },
    'lab-opamp-doubler': { width: 'WIDTH', slow: 'astable', fast: 'doubled' },
    'lab-opamp-gates': { a: 'A', b: 'B', mode: 'MODE (AND / OR)', and: 'AND / OR', nand: 'NAND / NOR' },
    'lab-opamp-led-pitch': { sel: 'LED (red / green)', null: 'NULL', vm: 'LED minus NULL' },
    'lab-opamp-key-finder': { mic: 'loudspeaker as microphone', sens: 'SENSITIVE', thr: 'THRESHOLD', reset: 'RESET', vm: 'peak minus threshold', alarm: 'ALARM' },
    'lab-ir-reflect-alarm': { surface: 'distance to the object', reset: 'RESET', meter: 'received level', led: 'ALARM' },
};
for (const [id, names] of Object.entries(LABELS))
    for (const [name, label] of Object.entries(names)) {
        const [kind, params] = BENCHES[id].parts[name];
        BENCHES[id].parts[name] = [kind, params, label];
    }

// Resolve '@name' params to engine ids.
for (const spec of Object.values(BENCHES)) {
    const ids = benchIds(spec);
    for (const [, params] of Object.values(spec.parts))
        for (const [k, v] of Object.entries(params || {}))
            if (typeof v === 'string' && v.startsWith('@')) {
                if (!ids[v.slice(1)]) throw new Error(`${k}: unknown role ${v}`);
                params[k] = ids[v.slice(1)];
            }
}
