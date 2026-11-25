/**
 * Netlists for the round-6 "r6e" lab-* benches, written by
 * `node scripts/gen-lab-circuits-4.mjs --set=r6e`.
 *
 * Most of them are built from one quad op-amp (LM324) plus NPN/PNP
 * transistors: flashers, latches, tone generators, meters that compute
 * (adder, subtractor, roots, a precision AC voltmeter), a junction
 * thermometer. Three show things beyond a plain circuit: contact bounce
 * counted by a binary counter, a water jet bent out of a light barrier by a
 * charged comb, and the sparks a comb throws across a small gap.
 *
 * Same shape as lab-benches-4.mjs: pure data, so the scenario tests
 * (test/lab-circuits-r6e.test.mjs) name parts by role. Ids follow benchIds
 * (breadboard first, then the parts in the order listed).
 */
import { benchIds } from './lab-benches-4.mjs';
export { benchIds };

const SUP = { pos: 'bat.pos', neg: 'bat.neg' };
const R = (ohms) => ['resistor', { ohms }];
const C = (farads) => ['capacitor', { farads }];
const EL = (farads) => ['polarized_cap', { farads }];
const LED = (color) => ['led', { vf: 2, color }];
const NPN = ['npn', { beta: 100 }];
// Exponential (Shockley) junctions, for the stages whose small-signal gain
// is the lesson: gm = Ic / 26 mV.
const NPN_EXP = ['npn', { model: 'shockley', is: 1e-14, beta: 100, br: 1, n: 1 }];
const BAT9 = ['vsource', { volts: 9, variant: '9v' }];
const POT = (ohms, position) => ['potentiometer', { ohms, position }];
const LM324 = ['lm324', {}];
const D = ['diode', { part: '1N4148' }];

export const BENCHES = {
    // Level-crossing lights from one op-amp: an astable (three 100 k set the
    // thresholds at 1/3 and 2/3 of the swing, 47 k charges 10 µF) whose
    // output lights one red lamp while high and the other while low. The
    // TRAIN switch powers the crossing.
    'lab-opamp-crossing': {
        vcc: 9, supply: SUP,
        parts: { bat: BAT9, train: ['switch', { closed: true }], u: LM324,
            ra: R(100000), rb: R(100000), rf: R(100000), rt: R(47000), ct: EL(10e-6),
            r1: R(1000), left: LED('red'), r2: R(1000), right: LED('red'), rbl: R(10000) },
        nets: [
            ['bat.pos', 'train.a'], ['train.b', 'u.vcc', 'ra.a', 'r2.a', 'rbl.a'],
            ['ra.b', 'rb.a', 'rf.a', 'u.1_pos'], ['rf.b', 'rt.a', 'u.1_out', 'r1.a', 'right.cathode'],
            ['rt.b', 'ct.pos', 'u.1_neg'], ['r1.b', 'left.anode'], ['r2.b', 'right.anode'],
            ['u.2_neg', 'u.2_out'], ['u.3_neg', 'u.3_out'], ['u.4_neg', 'u.4_out'],
            ['bat.neg', 'u.gnd', 'rb.b', 'ct.neg', 'left.cathode', 'rbl.b', 'u.2_pos', 'u.3_pos', 'u.4_pos'],
        ],
    },

    // A comparator that holds its own decision: the − input sits at 3 V
    // (60 k / 30 k as 100 k ‖ … see below), the + input hangs on the output
    // through 100 k with 100 k to ground, so a high output (7.5 V) keeps
    // + at 3.75 V and a low one keeps it at 0. Two touch plates set and
    // reset it through the finger (1 MΩ of skin behind each plate's button).
    'lab-opamp-touch-latch': {
        vcc: 9, supply: SUP,
        parts: { bat: BAT9, u: LM324, ra: R(200000), rb: R(100000),
            rf: R(10e6), rg: R(10e6),
            set: ['button', {}], fset: R(1000000), reset: ['button', {}], freset: R(1000000),
            r1: R(1000), on: LED('red'), r2: R(1000), off: LED('green') },
        nets: [
            ['bat.pos', 'u.vcc', 'ra.a', 'set.a', 'r2.a'],
            ['ra.b', 'rb.a', 'u.1_neg'], ['u.1_pos', 'rf.a', 'rg.a', 'fset.b', 'freset.b'],
            ['set.b', 'fset.a'], ['reset.b', 'freset.a'],
            ['rf.b', 'u.1_out', 'r1.a', 'off.cathode'], ['r1.b', 'on.anode'], ['r2.b', 'off.anode'],
            ['u.2_neg', 'u.2_out'], ['u.3_neg', 'u.3_out'], ['u.4_neg', 'u.4_out'],
            ['bat.neg', 'u.gnd', 'rb.b', 'rg.b', 'reset.a', 'on.cathode', 'u.2_pos', 'u.3_pos', 'u.4_pos'],
        ],
    },

    // The op-amp astable into a loudspeaker: 4.7 k plus a 470 k RATE pot
    // (as a rheostat) charge 100 nF. Turned up it clicks ten times a
    // second, turned down it whistles near 1 kHz. 47 µF and 100 Ω couple the
    // square wave into the speaker.
    'lab-opamp-click-whistle': {
        vcc: 9, supply: SUP,
        parts: { bat: BAT9, u: LM324, ra: R(100000), rb: R(100000), rf: R(100000),
            rmin: R(10000), rate: POT(470000, 1), ct: C(100e-9),
            co: EL(47e-6), rs: R(100), spk: ['speaker', { ohms: 8 }] },
        nets: [
            ['bat.pos', 'u.vcc', 'ra.a'],
            ['ra.b', 'rb.a', 'rf.a', 'u.1_pos'], ['rf.b', 'rmin.a', 'u.1_out', 'co.pos'],
            ['rmin.b', 'rate.a', 'rate.wiper'], ['rate.b', 'ct.a', 'u.1_neg'],
            ['co.neg', 'rs.a'], ['rs.b', 'spk.a'],
            ['u.2_neg', 'u.2_out'], ['u.3_neg', 'u.3_out'], ['u.4_neg', 'u.4_out'],
            ['bat.neg', 'u.gnd', 'rb.b', 'ct.b', 'spk.b', 'u.2_pos', 'u.3_pos', 'u.4_pos'],
        ],
    },

    // Phase-shift oscillator from ONE transistor: three 10 nF / 10 k
    // sections turn the collector signal by 180° on its way back to the
    // base (the last "10 k" is the base's own input resistance in parallel
    // with the bias). 470 k from collector to base sets about 1 mA.
    'lab-transistor-phase-shift': {
        vcc: 9, supply: SUP,
        parts: { bat: BAT9, q: ['npn', { model: 'shockley', is: 1e-14, beta: 250, br: 1, n: 1 }],
            rc: R(4700), rb: R(470000), c1: C(10e-9), r1: R(10000), c2: C(10e-9), r2: R(10000), c3: C(10e-9),
            co: C(100e-9), ep: ['earphone', { type: 'crystal' }], scope: ['oscilloscope', {}] },
        nets: [
            ['bat.pos', 'rc.a'], ['rc.b', 'q.collector', 'rb.a', 'c1.a', 'co.a', 'scope.ch1'],
            ['c1.b', 'r1.a', 'c2.a'], ['c2.b', 'r2.a', 'c3.a'], ['c3.b', 'q.base', 'rb.b', 'scope.ch2'],
            ['co.b', 'ep.a'],
            ['bat.neg', 'q.emitter', 'r1.b', 'r2.b', 'ep.b', 'scope.gnd'],
        ],
    },


    // Resistor heating. A VOLTS pot (with 3.3 k above it, 0 … 6.8 V) sets
    // the + input of an op-amp whose NPN emitter follower is inside the
    // feedback loop: an adjustable supply that can deliver 150 mA. A slide
    // switch puts it across a 47 Ω or a 100 Ω quarter-watt resistor; the
    // ammeter and voltmeter read I and V. Each resistor has a transistor
    // (diode-connected, 10 k from +9 V) glued to it as a thermometer; when
    // its base-emitter voltage falls below a reference (the junction near
    // 75 °C, the resistor's 1/4 W limit), a comparator lights that
    // resistor's red HOT LED.
    'lab-resistor-heating': {
        vcc: 9, supply: SUP,
        parts: { bat: BAT9, rtop: R(3300), volts: POT(10000, 0.5), u: LM324, rbase: R(1000), q: NPN,
            am: ['ammeter', {}], sel: ['slide_switch', { position: 0 }],
            r47: ['resistor', { ohms: 47, rth: 200, thermalTau: 1 }], r100: ['resistor', { ohms: 100, rth: 200, thermalTau: 1 }],
            vm: ['voltmeter', {}],
            s47: ['npn', { beta: 100, heatedBy: '@r47', thermalCoupling: 1, thermalTau: 1 }], rs47: R(10000),
            s100: ['npn', { beta: 100, heatedBy: '@r100', thermalCoupling: 1, thermalTau: 1 }], rs100: R(10000),
            rr1: R(100000), rr2: R(7000),
            rh47: R(1000), hot47: LED('red'), rh100: R(1000), hot100: LED('red') },
        nets: [
            ['bat.pos', 'rtop.a', 'u.vcc', 'q.collector', 'rs47.a', 'rs100.a', 'rr1.a'],
            ['rtop.b', 'volts.a'], ['volts.wiper', 'u.1_pos'], ['u.1_out', 'rbase.a'], ['rbase.b', 'q.base'],
            ['q.emitter', 'am.a'], ['am.b', 'sel.com', 'u.1_neg', 'vm.a'], ['sel.a', 'r47.a'], ['sel.b', 'r100.a'],
            ['rs47.b', 's47.collector', 's47.base', 'u.2_neg'], ['rs100.b', 's100.collector', 's100.base', 'u.3_neg'],
            ['rr1.b', 'rr2.a', 'u.2_pos', 'u.3_pos'],
            ['u.2_out', 'rh47.a'], ['rh47.b', 'hot47.anode'], ['u.3_out', 'rh100.a'], ['rh100.b', 'hot100.anode'],
            ['u.4_neg', 'u.4_out'],
            ['bat.neg', 'volts.b', 'u.gnd', 'r47.b', 'r100.b', 'vm.b', 's47.emitter', 's100.emitter', 'rr2.b',
                'hot47.cathode', 'hot100.cathode', 'u.4_pos'],
        ],
    },

    // Electronic ammeter to 1 A. Every load returns to ground through a
    // 0.1 Ω shunt; an op-amp (+ input on the shunt, 91 k / 10 k feedback,
    // gain 10.1) turns 0.1 V per amp into 1 V per amp on a 1 V meter. LAMP
    // (a 9 V / 0.1 A bulb), HEATER (15 Ω, 0.6 A) and SHORT (8.2 Ω, 1.1 A)
    // switch loads on. A second op-amp compares the reading with 0.98 V
    // (82 k / 10 k); above it, it releases a third op-amp astable (100 k
    // thresholds, 10 k into 100 nF) whose capacitor a diode otherwise holds
    // near ground: an overload tone in the loudspeaker.
    'lab-ammeter-overload': {
        vcc: 9, supply: SUP,
        parts: { bat: BAT9, slamp: ['switch', { closed: true }], lamp: ['light_bulb', { ohms: 90, vRated: 9 }],
            sheat: ['switch', {}], heat: R(15), sshort: ['switch', {}], short: R(8.2), shunt: R(0.1),
            u: LM324, rg: R(10000), rf: R(91000), meter: ['analog_meter', { fullScale: 1, ifs: 0.0001 }],
            rr1: R(82000), rr2: R(10000),
            ra: R(100000), rb: R(100000), rh: R(100000), rt: R(10000), ct: C(100e-9), dg: D,
            co: EL(47e-6), rs: R(100), spk: ['speaker', { ohms: 8 }] },
        nets: [
            ['bat.pos', 'slamp.a', 'sheat.a', 'sshort.a', 'u.vcc', 'rr1.a', 'ra.a'],
            ['slamp.b', 'lamp.a'], ['sheat.b', 'heat.a'], ['sshort.b', 'short.a'],
            ['lamp.b', 'heat.b', 'short.b', 'shunt.a', 'u.1_pos'],
            ['u.1_neg', 'rg.a', 'rf.a'], ['rf.b', 'u.1_out', 'meter.a', 'u.2_pos'],
            ['rr1.b', 'rr2.a', 'u.2_neg'], ['u.2_out', 'dg.cathode'],
            ['ra.b', 'rb.a', 'rh.a', 'u.3_pos'], ['rh.b', 'rt.a', 'u.3_out', 'co.pos'],
            ['rt.b', 'ct.a', 'dg.anode', 'u.3_neg'], ['co.neg', 'rs.a'], ['rs.b', 'spk.a'],
            ['u.4_neg', 'u.4_out'],
            ['bat.neg', 'shunt.b', 'rg.b', 'meter.b', 'rr2.b', 'rb.b', 'ct.b', 'spk.b', 'u.gnd', 'u.4_pos'],
        ],
    },

    // Adder and subtractor with knob inputs. Knobs A and B (10 k each, with
    // 20 k above: 0 … 3 V) are buffered by two followers. A non-inverting
    // adder (A and B through 10 k each to the + input, gain 2) shows A + B;
    // a difference amplifier (four 10 k) shows A − B. Two moving-coil meters
    // (6 V and 3 V full scale) read the results.
    'lab-opamp-adder-subtractor': {
        vcc: 9, supply: SUP,
        parts: { bat: BAT9, rta: R(20000), ka: POT(10000, 0.6), rtb: R(20000), kb: POT(10000, 0.3), u: LM324,
            rsa: R(10000), rsb: R(10000), rsg: R(10000), rsf: R(10000),
            rda: R(10000), rdg: R(10000), rdb: R(10000), rdf: R(10000),
            msum: ['analog_meter', { fullScale: 6, ifs: 0.0001 }], mdiff: ['analog_meter', { fullScale: 3, ifs: 0.0001 }] },
        nets: [
            ['bat.pos', 'u.vcc', 'rta.a', 'rtb.a'], ['rta.b', 'ka.a'], ['rtb.b', 'kb.a'],
            ['ka.wiper', 'u.3_pos'], ['kb.wiper', 'u.4_pos'],
            ['u.3_out', 'u.3_neg', 'rsa.a', 'rda.a'], ['u.4_out', 'u.4_neg', 'rsb.a', 'rdb.a'],
            ['rsa.b', 'rsb.b', 'u.1_pos'], ['u.1_neg', 'rsg.a', 'rsf.a'], ['rsf.b', 'u.1_out', 'msum.a'],
            ['rda.b', 'rdg.a', 'u.2_pos'], ['rdb.b', 'rdf.a', 'u.2_neg'], ['rdf.b', 'u.2_out', 'mdiff.a'],
            ['bat.neg', 'ka.b', 'kb.b', 'u.gnd', 'rsg.b', 'rdg.b', 'msum.b', 'mdiff.b'],
        ],
    },

    // Two-bit analogue-to-digital converter: three op-amp comparators watch
    // the INPUT knob (0 … 6 V, on a 6 V meter) against 1.5, 3 and 4.5 V from
    // a 30 k / 10 k / 10 k / 10 k ladder. The middle comparator is the
    // high bit and lights its LED directly. The low bit is decoded with one
    // transistor and two diodes: the lowest comparator feeds the LED through
    // 1 k and a diode, but the transistor (base from the middle comparator)
    // shorts that feed once the input passes 3 V; the top comparator feeds
    // the LED again through its own 1 k and diode above 4.5 V.
    'lab-opamp-flash-adc': {
        vcc: 9, supply: SUP,
        parts: { bat: BAT9, rin: R(5000), knob: POT(10000, 0.4), meter: ['analog_meter', { fullScale: 6, ifs: 0.0001 }],
            rl3: R(30000), rl2: R(10000), rl1: R(10000), rl0: R(10000), u: LM324,
            rhi: R(1000), hi: LED('red'), rx: R(1000), q: NPN, rqb: R(22000), d1: D, r3: R(1000), d3: D, lo: LED('red') },
        nets: [
            ['bat.pos', 'u.vcc', 'rin.a', 'rl3.a'], ['rin.b', 'knob.a'],
            ['knob.wiper', 'meter.a', 'u.1_pos', 'u.2_pos', 'u.3_pos'],
            ['rl3.b', 'rl2.a', 'u.3_neg'], ['rl2.b', 'rl1.a', 'u.2_neg'], ['rl1.b', 'rl0.a', 'u.1_neg'],
            ['u.2_out', 'rhi.a', 'rqb.a'], ['rhi.b', 'hi.anode'], ['rqb.b', 'q.base'],
            ['u.1_out', 'rx.a'], ['rx.b', 'q.collector', 'd1.anode'],
            ['u.3_out', 'r3.a'], ['r3.b', 'd3.anode'], ['d1.cathode', 'd3.cathode', 'lo.anode'],
            ['u.4_neg', 'u.4_out'],
            ['bat.neg', 'knob.b', 'meter.b', 'rl0.b', 'u.gnd', 'hi.cathode', 'q.emitter', 'lo.cathode', 'u.4_pos'],
        ],
    },

    // Two-tone horn. A slow op-amp astable (three 100 k thresholds, 100 k
    // into 4.7 µF: a change about every 0.4 s) moves a divider (12 k from
    // its output, 10 k from +9 V, 33 k to ground) between 7.0 and 4.2 V; a
    // follower hands that to the base resistors (47 k) of a transistor
    // multivibrator (1 k collectors, 22 nF cross capacitors). A higher base
    // return charges the capacitors back faster: the pitch steps up and
    // down. The SOUND switch sits between the follower and the base
    // resistors (100 k to ground behind it): open, the transistors get no
    // base current and stay silent. 470 Ω and 47 µF couple the tone into the
    // loudspeaker.
    'lab-two-tone-horn': {
        vcc: 9, supply: SUP,
        parts: { bat: BAT9, u: LM324, ra: R(100000), rb: R(100000), rf: R(100000), rt: R(100000), ct: EL(4.7e-6),
            rd1: R(12000), rd2: R(10000), rd3: R(33000), sound: ['switch', { closed: true }], rsb: R(100000),
            q1: NPN, q2: NPN, rc1: R(1000), rc2: R(1000), rb1: R(47000), rb2: R(47000), c1: C(22e-9), c2: C(22e-9),
            ro: R(470), co: EL(47e-6), spk: ['speaker', { ohms: 8 }] },
        nets: [
            ['bat.pos', 'u.vcc', 'ra.a', 'rd2.a', 'rc1.a', 'rc2.a'],
            ['ra.b', 'rb.a', 'rf.a', 'u.1_pos'], ['rt.b', 'ct.pos', 'u.1_neg'], ['rf.b', 'rt.a', 'u.1_out', 'rd1.a'],
            ['rd1.b', 'rd2.b', 'rd3.a', 'u.2_pos'], ['u.2_out', 'u.2_neg', 'sound.a'],
            ['sound.b', 'rsb.a', 'rb1.a', 'rb2.a'],
            ['rc1.b', 'q1.collector', 'c1.a'], ['c1.b', 'q2.base', 'rb2.b'],
            ['rc2.b', 'q2.collector', 'c2.a', 'ro.a'], ['c2.b', 'q1.base', 'rb1.b'],
            ['ro.b', 'co.pos'], ['co.neg', 'spk.a'],
            ['u.3_neg', 'u.3_out'], ['u.4_neg', 'u.4_out'],
            ['bat.neg', 'u.gnd', 'rb.b', 'ct.neg', 'rd3.b', 'rsb.b', 'q1.emitter', 'q2.emitter', 'spk.b', 'u.3_pos', 'u.4_pos'],
        ],
    },

    // Siren and canary. The capacitor of a slow op-amp astable (100 k into
    // 4.7 µF) climbs and falls between 3 and 5.4 V. A second op-amp
    // (10 k feedback, 10 k to a 3.9 k / 2.2 k divider at 3.25 V) stretches
    // that to about 2.8 … 7.3 V and feeds the base resistors (47 k) of a
    // transistor multivibrator (2.2 k collectors, so even the lowest return
    // saturates them), so the pitch follows the ramp. MODE: up and down alike (siren), or with a diode
    // and 1 k across the timing resistor the capacitor drops back at once
    // and the pitch only ever glides up: a chirp, again and again (canary).
    'lab-siren-canary': {
        vcc: 9, supply: SUP,
        parts: { bat: BAT9, u: LM324, ra: R(100000), rb: R(100000), rf: R(100000), rt: R(100000), ct: EL(4.7e-6),
            mode: ['slide_switch', { position: 0 }], dq: D, rq: R(1000),
            rr1: R(3900), rr2: R(2200), rg: R(10000), rfb: R(10000), sound: ['switch', { closed: true }], rsb: R(100000),
            q1: NPN, q2: NPN, rc1: R(2200), rc2: R(2200), rb1: R(47000), rb2: R(47000), c1: C(22e-9), c2: C(22e-9),
            ro: R(470), co: EL(47e-6), spk: ['speaker', { ohms: 8 }] },
        nets: [
            ['bat.pos', 'u.vcc', 'ra.a', 'rr1.a', 'rc1.a', 'rc2.a'],
            ['ra.b', 'rb.a', 'rf.a', 'u.1_pos'], ['rt.b', 'ct.pos', 'u.1_neg', 'u.2_pos', 'dq.anode'],
            ['rf.b', 'rt.a', 'u.1_out', 'mode.b'], ['mode.com', 'rq.a'], ['rq.b', 'dq.cathode'],
            ['rr1.b', 'rr2.a', 'rg.a'], ['rg.b', 'rfb.a', 'u.2_neg'], ['rfb.b', 'u.2_out', 'sound.a'],
            ['sound.b', 'rsb.a', 'rb1.a', 'rb2.a'],
            ['rc1.b', 'q1.collector', 'c1.a'], ['c1.b', 'q2.base', 'rb2.b'],
            ['rc2.b', 'q2.collector', 'c2.a', 'ro.a'], ['c2.b', 'q1.base', 'rb1.b'],
            ['ro.b', 'co.pos'], ['co.neg', 'spk.a'],
            ['u.3_neg', 'u.3_out'], ['u.4_neg', 'u.4_out'],
            ['bat.neg', 'u.gnd', 'rb.b', 'ct.neg', 'rr2.b', 'rsb.b', 'q1.emitter', 'q2.emitter', 'spk.b', 'u.3_pos', 'u.4_pos'],
        ],
        open: ['mode.a'],
    },

    // LED-circuit tester. The tester sends 1 k from +9 V into the circuit
    // under test (an indicator LED behind a BREAK switch, with a SHORT
    // switch across it) and halves the probe voltage (10 k / 10 k). Two
    // op-amp comparators watch it: above 3 V the circuit is open, below
    // 0.4 V it is shorted. Their outputs reach a 47 k to ground through a
    // diode each (the short comparator through 47 k more): about 6.7 V for
    // open, 3.3 V for a short, nothing while the LED is fine. A follower
    // (then 1 k and 1 µF) hands that to the base resistors of a transistor
    // multivibrator: a high tone, a low tone, or silence.
    'lab-led-tester': {
        vcc: 9, supply: SUP,
        parts: { bat: BAT9, rt: R(1000), brk: ['switch', { closed: true }], dut: LED('green'), short: ['switch', {}],
            rp1: R(10000), rp2: R(10000), u: LM324, rh1: R(20000), rh2: R(10000), rl1: R(82000), rl2: R(4000),
            da: D, rbb: R(47000), db: D, rp: R(47000), rfo: R(1000), cfo: EL(1e-6),
            q1: NPN, q2: NPN, rc1: R(1000), rc2: R(1000), rb1: R(47000), rb2: R(47000), c1: C(22e-9), c2: C(22e-9),
            ro: R(470), co: EL(47e-6), spk: ['speaker', { ohms: 8 }] },
        nets: [
            ['bat.pos', 'rt.a', 'u.vcc', 'rh1.a', 'rl1.a', 'rc1.a', 'rc2.a'],
            ['rt.b', 'brk.a', 'rp1.a'], ['brk.b', 'dut.anode', 'short.a'],
            ['rp1.b', 'rp2.a', 'u.1_pos', 'u.2_neg'],
            ['rh1.b', 'rh2.a', 'u.1_neg'], ['rl1.b', 'rl2.a', 'u.2_pos'],
            ['u.1_out', 'da.anode'], ['u.2_out', 'rbb.a'], ['rbb.b', 'db.anode'], ['da.cathode', 'db.cathode', 'rp.a', 'u.3_pos'],
            ['u.3_out', 'u.3_neg', 'rfo.a'], ['rfo.b', 'cfo.pos', 'rb1.a', 'rb2.a'],
            ['rc1.b', 'q1.collector', 'c1.a'], ['c1.b', 'q2.base', 'rb2.b'],
            ['rc2.b', 'q2.collector', 'c2.a', 'ro.a'], ['c2.b', 'q1.base', 'rb1.b'],
            ['ro.b', 'co.pos'], ['co.neg', 'spk.a'],
            ['u.4_neg', 'u.4_out'],
            ['bat.neg', 'dut.cathode', 'short.b', 'rp2.b', 'u.gnd', 'rh2.b', 'rl2.b', 'rp.b', 'cfo.neg',
                'q1.emitter', 'q2.emitter', 'spk.b', 'u.4_pos'],
        ],
    },

    // Moisture alarm. The probe (two wires in the nappy) is the WET pot, a
    // 10 MΩ rheostat: turned up, the wires sit in water. Its current into
    // q1's base (through 10 k; 100 k from base to emitter keeps the dry
    // probe's leakage from opening it) lights the blue LED in q1's collector. q2
    // (220 k from q1's collector) is the inverter: while it conducts it holds
    // the base return of a multivibrator (4.7 k pull-up, 47 k base
    // resistors) at ground and the multivibrator is silent; once the probe
    // is wet q1 takes q2's base current away and the tone starts.
    'lab-moisture-beeper': {
        vcc: 9, supply: SUP,
        parts: { bat: BAT9, wet: POT(10e6, 0), rbq: R(10000), q1: NPN, rbe: R(100000), rl: R(1000), led: LED('blue'),
            rq2: R(220000), q2: NPN, rn: R(4700),
            q3: NPN, q4: NPN, rc1: R(1000), rc2: R(1000), rb1: R(47000), rb2: R(47000), c1: C(22e-9), c2: C(22e-9),
            ro: R(470), co: EL(47e-6), spk: ['speaker', { ohms: 8 }] },
        nets: [
            ['bat.pos', 'wet.a', 'rl.a', 'rn.a', 'rc1.a', 'rc2.a'],
            ['wet.wiper', 'wet.b', 'rbq.a'], ['rbq.b', 'q1.base', 'rbe.a'],
            ['rl.b', 'led.anode'], ['led.cathode', 'q1.collector', 'rq2.a'], ['rq2.b', 'q2.base'],
            ['rn.b', 'q2.collector', 'rb1.a', 'rb2.a'],
            ['rc1.b', 'q3.collector', 'c1.a'], ['c1.b', 'q4.base', 'rb2.b'],
            ['rc2.b', 'q4.collector', 'c2.a', 'ro.a'], ['c2.b', 'q3.base', 'rb1.b'],
            ['ro.b', 'co.pos'], ['co.neg', 'spk.a'],
            ['bat.neg', 'q1.emitter', 'rbe.b', 'q2.emitter', 'q3.emitter', 'q4.emitter', 'spk.b'],
        ],
    },

    // Transistor thermometer and thermostat. A diode-connected NPN on a lead
    // (10 k from +9 V, about 0.8 mA) is the sensor: its base-emitter voltage
    // falls 2 mV per kelvin. An op-amp subtracts it from the ZERO setting
    // (the junction's voltage at 0 °C, from a 100 k / 10 k pot / 4.7 k chain)
    // with a gain of 25 (10 k in, 250 k feedback): 50 mV per kelvin, so the
    // 5 V meter reads 0–100 °C. A second op-amp compares the reading with the
    // SET knob (4.7 M of feedback for a little hysteresis) and, while it is
    // colder than set, drives the relay through an NPN; the relay's contact
    // lights the lamp that stands for the heater.
    'lab-transistor-thermometer': {
        vcc: 9, supply: SUP,
        parts: { bat: BAT9, rs: R(10000), sensor: ['npn', { beta: 100, surroundC: 25, thermalTau: 1 }],
            rz1: R(100000), zero: POT(10000, 0.457), rz2: R(4700), rzp: R(100000), rzg: R(2700000),
            u: LM324, ri: R(10000), rfb: R(250000), meter: ['analog_meter', { fullScale: 5, ifs: 0.0001 }],
            rs1: R(8200), set: POT(10000, 0.5), rset: R(47000), rhy: R(4.7e6),
            rq: R(10000), q: NPN, k: ['relay', { coilR: 200 }], df: D, lamp: ['light_bulb', { ohms: 90, vRated: 9 }] },
        nets: [
            ['bat.pos', 'rs.a', 'rz1.a', 'u.vcc', 'rs1.a', 'k.coil_a', 'df.cathode', 'k.com'],
            ['rs.b', 'sensor.collector', 'sensor.base', 'ri.a'],
            ['rz1.b', 'zero.a'], ['zero.b', 'rz2.a'], ['zero.wiper', 'rzp.a'], ['rzp.b', 'rzg.a', 'u.1_pos'],
            ['ri.b', 'rfb.a', 'u.1_neg'], ['rfb.b', 'u.1_out', 'meter.a', 'u.2_neg'],
            ['rs1.b', 'set.a'], ['set.wiper', 'rset.a'], ['rset.b', 'rhy.a', 'u.2_pos'],
            ['rhy.b', 'u.2_out', 'rq.a'], ['rq.b', 'q.base'], ['q.collector', 'k.coil_b', 'df.anode'], ['k.no', 'lamp.a'],
            ['u.3_neg', 'u.3_out'], ['u.4_neg', 'u.4_out'],
            ['bat.neg', 'sensor.emitter', 'rz2.b', 'rzg.b', 'u.gnd', 'meter.b', 'set.b', 'q.emitter', 'lamp.b', 'u.3_pos', 'u.4_pos'],
        ],
        open: ['k.nc'],
    },

    // Square and cube roots by logarithms. A stiff 1 k / 1 k divider makes
    // the 4.5 V reference every stage works around. Op-amp 1 is a log
    // amplifier: the INPUT knob drives x µA through 45 k into its − input,
    // an NPN in the feedback path (base on the reference) turns it into a
    // base-emitter voltage, Vt·ln(x/Is). Op-amp 2 does the same for a fixed
    // 1 µA (4.5 M from +9 V). ROOT picks a divider between the two log
    // outputs: halfway (square root) or one third of the way from the
    // reference current (cube root). Op-amp 4 buffers the divider and an
    // antilog transistor (emitter on the buffer, base on the reference)
    // turns the averaged logarithm back into a current, which op-amp 3
    // turns into volts across 100 k: √x or ∛x µA, read on the 1 V meter
    // (10 µA = 1 V). 10 nF across each feedback path keeps the loops calm.
    'lab-log-roots': {
        vcc: 9, supply: SUP,
        parts: { bat: BAT9, rv1: R(1000), rv2: R(1000), knob: POT(10000, 0.5), rin: R(42000),
            min: ['analog_meter', { fullScale: 4.2, ifs: 0.0001 }],
            u: LM324, q1: ['npn', { model: 'shockley', is: 1e-14, beta: 200, br: 1, n: 1 }], c1: C(100e-12),
            rref: R(4.3e6), q2: ['npn', { model: 'shockley', is: 1e-14, beta: 200, br: 1, n: 1 }], c2: C(100e-12),
            root: ['slide_switch', { position: 0 }], rsq1: R(10000), rsq2: R(10000), rcb1: R(20000), rcb2: R(10000),
            q3: ['npn', { model: 'shockley', is: 1e-14, beta: 200, br: 1, n: 1 }], rout: R(100000), c3: C(100e-12),
            mout: ['analog_meter', { fullScale: 1, ifs: 0.0001 }] },
        nets: [
            ['bat.pos', 'rv1.a', 'knob.a', 'u.vcc', 'rref.a'],
            ['rv1.b', 'rv2.a', 'knob.b', 'min.b', 'q1.base', 'u.1_pos', 'q2.base', 'u.2_pos', 'q3.base', 'u.3_pos', 'mout.b'],
            ['knob.wiper', 'rin.a', 'min.a'], ['rin.b', 'q1.collector', 'c1.a', 'u.1_neg'],
            ['q1.emitter', 'c1.b', 'u.1_out', 'rsq1.a', 'rcb1.a'],
            ['rref.b', 'q2.collector', 'c2.a', 'u.2_neg'], ['q2.emitter', 'c2.b', 'u.2_out', 'rsq2.a', 'rcb2.a'],
            ['rsq1.b', 'rsq2.b', 'root.a'], ['rcb1.b', 'rcb2.b', 'root.b'], ['root.com', 'u.4_pos'],
            ['u.4_out', 'u.4_neg', 'q3.emitter'],
            ['u.3_neg', 'rout.a', 'c3.a', 'q3.collector'], ['rout.b', 'c3.b', 'u.3_out', 'mout.a'],
            ['bat.neg', 'rv2.b', 'u.gnd'],
        ],
    },

    // Two-bit counter. An op-amp astable (100 k thresholds, 22 k into
    // 4.7 µF, about 4 Hz) is the clock. Each bit is a transistor flip-flop
    // (1 k + LED collectors, 22 k cross feeds) with steering: from each
    // collector 100 k to a diode (anode at that base) and a 2.2 nF from the
    // trigger line. A falling edge on the trigger line pulls down the base
    // of whichever transistor is on, so every edge flips the pair. The clock
    // triggers bit 0; bit 0's other collector triggers bit 1, which then
    // flips each time bit 0 goes back to 0. RESET drives both "0" side
    // transistors hard on (1 k, then a 1N4148 to each base): 00.
    'lab-opamp-binary-counter': {
        vcc: 9, supply: SUP,
        parts: { bat: BAT9, u: LM324, ra: R(100000), rb: R(100000), rf: R(100000), rt: R(22000), ct: EL(4.7e-6),
            a1: NPN, b1: NPN, rla: R(1000), bit0: LED('red'), rlb: R(1000), xa1: R(22000), xb1: R(22000),
            sa1: R(100000), sb1: R(100000), da1: D, db1: D, ca1: C(2.2e-9), cb1: C(2.2e-9),
            a2: NPN, b2: NPN, rla2: R(1000), bit1: LED('red'), rlb2: R(1000), xa2: R(22000), xb2: R(22000),
            sa2: R(100000), sb2: R(100000), da2: D, db2: D, ca2: C(2.2e-9), cb2: C(2.2e-9),
            reset: ['button', {}], rr: R(1000), dr1: D, dr2: D },
        nets: [
            ['bat.pos', 'u.vcc', 'ra.a', 'rla.a', 'rlb.a', 'rla2.a', 'rlb2.a', 'reset.a'],
            ['ra.b', 'rb.a', 'rf.a', 'u.1_pos'], ['rt.b', 'ct.pos', 'u.1_neg'],
            ['rf.b', 'rt.a', 'u.1_out', 'ca1.a', 'cb1.a'],
            ['rla.b', 'bit0.anode'], ['bit0.cathode', 'a1.collector', 'xa1.a', 'sa1.a'],
            ['rlb.b', 'b1.collector', 'xb1.a', 'sb1.a', 'ca2.a', 'cb2.a'],
            ['xa1.b', 'b1.base', 'db1.anode', 'dr1.cathode'], ['xb1.b', 'a1.base', 'da1.anode'],
            ['sa1.b', 'ca1.b', 'da1.cathode'], ['sb1.b', 'cb1.b', 'db1.cathode'],
            ['rla2.b', 'bit1.anode'], ['bit1.cathode', 'a2.collector', 'xa2.a', 'sa2.a'],
            ['rlb2.b', 'b2.collector', 'xb2.a', 'sb2.a'],
            ['xa2.b', 'b2.base', 'db2.anode', 'dr2.cathode'], ['xb2.b', 'a2.base', 'da2.anode'],
            ['sa2.b', 'ca2.b', 'da2.cathode'], ['sb2.b', 'cb2.b', 'db2.cathode'],
            ['reset.b', 'rr.a'], ['rr.b', 'dr1.anode', 'dr2.anode'],
            ['u.2_neg', 'u.2_out'], ['u.3_neg', 'u.3_out'], ['u.4_neg', 'u.4_out'],
            ['bat.neg', 'u.gnd', 'rb.b', 'ct.neg', 'a1.emitter', 'b1.emitter', 'a2.emitter', 'b2.emitter',
                'u.2_pos', 'u.3_pos', 'u.4_pos'],
        ],
    },

    // Active bass and treble control (Baxandall) on one op-amp. Two signal
    // generators stand for the music: a 100 Hz bass note and a 5 kHz
    // treble note, mixed through 10 k each and buffered by a follower. The
    // tone stage works around a 4.5 V reference (10 k / 10 k, a follower).
    // BASS: 10 k, a 100 k pot, 10 k from input to output, its halves
    // bridged by 22 nF each, its wiper into the − input. TREBLE: 2.2 nF, a
    // 100 k pot, 2.2 nF, its wiper into the − input through 3.3 k. Pot
    // towards its end a boosts, towards b cuts; in the middle both notes
    // pass at the same level.
    'lab-tone-control': {
        vcc: 9, supply: SUP,
        parts: { bat: BAT9, gl: ['function_gen', { wave: 'sine', freq: 100, amplitude: 0.5, offset: 4.5, rOut: 50 }],
            gh: ['function_gen', { wave: 'sine', freq: 5000, amplitude: 0.5, offset: 4.5, rOut: 50 }],
            rml: R(10000), rmh: R(10000), u: LM324, rv1: R(10000), rv2: R(10000),
            rb1: R(10000), bass: POT(100000, 0.5), rb2: R(10000), cb1: C(22e-9), cb2: C(22e-9), rbw: R(10000),
            ct1: C(4.7e-9), treble: POT(100000, 0.5), ct2: C(4.7e-9),
            co: EL(10e-6), ep: ['earphone', { type: 'crystal' }], scope: ['oscilloscope', {}] },
        nets: [
            ['bat.pos', 'u.vcc', 'rv1.a'],
            ['gl.out', 'rml.a'], ['gh.out', 'rmh.a'], ['rml.b', 'rmh.b', 'u.1_pos'],
            ['u.1_out', 'u.1_neg', 'rb1.a', 'ct1.a', 'scope.ch1'],
            ['rv1.b', 'rv2.a', 'u.4_pos'], ['u.4_out', 'u.4_neg', 'u.2_pos'],
            ['rb1.b', 'bass.a', 'cb1.a'], ['bass.wiper', 'cb1.b', 'cb2.a', 'rbw.a'], ['rbw.b', 'treble.wiper', 'u.2_neg'], ['bass.b', 'cb2.b', 'rb2.a'],
            ['ct1.b', 'treble.a'], ['treble.b', 'ct2.a'],
            ['rb2.b', 'ct2.b', 'u.2_out', 'co.pos', 'scope.ch2'], ['co.neg', 'ep.a'],
            ['u.3_neg', 'u.3_out'],
            ['bat.neg', 'gl.gnd', 'gh.gnd', 'rv2.b', 'u.gnd', 'ep.b', 'scope.gnd', 'u.3_pos'],
        ],
    },

    // Voice canceller. Three signal generators stand for a stereo record: a
    // voice (300 Hz) recorded in the middle, so it is in both channels, a
    // guitar (110 Hz) only on the left and a flute (660 Hz) only on the
    // right; each channel mixes its two through 10 k. Two followers buffer
    // the channels; a difference amplifier (four 10 k, the + side returned
    // to a buffered 4.5 V) gives left − right, in which the voice cancels.
    // CANCEL picks what the earphone hears: the left channel, or the
    // difference.
    'lab-voice-canceller': {
        vcc: 9, supply: SUP,
        parts: { bat: BAT9, gv: ['function_gen', { wave: 'sine', freq: 300, amplitude: 1, offset: 4.5, rOut: 50 }],
            gg: ['function_gen', { wave: 'sine', freq: 110, amplitude: 1, offset: 4.5, rOut: 50 }],
            gf: ['function_gen', { wave: 'sine', freq: 660, amplitude: 1, offset: 4.5, rOut: 50 }],
            rvl: R(10000), rgl: R(10000), rvr: R(10000), rfr: R(10000), u: LM324,
            rv1: R(10000), rv2: R(10000), rdl: R(10000), rdg: R(10000), rdr: R(10000), rdf: R(10000),
            cancel: ['slide_switch', { position: 0 }], co: EL(10e-6), ep: ['earphone', { type: 'crystal' }], scope: ['oscilloscope', {}] },
        nets: [
            ['bat.pos', 'u.vcc', 'rv1.a'],
            ['gv.out', 'rvl.a', 'rvr.a'], ['gg.out', 'rgl.a'], ['gf.out', 'rfr.a'],
            ['rvl.b', 'rgl.b', 'u.1_pos'], ['rvr.b', 'rfr.b', 'u.2_pos'],
            ['u.1_out', 'u.1_neg', 'rdl.a', 'cancel.a', 'scope.ch1'], ['u.2_out', 'u.2_neg', 'rdr.a'],
            ['rv1.b', 'rv2.a', 'u.4_pos'], ['u.4_out', 'u.4_neg', 'rdg.b'],
            ['rdl.b', 'rdg.a', 'u.3_pos'], ['rdr.b', 'rdf.a', 'u.3_neg'], ['rdf.b', 'u.3_out', 'cancel.b'],
            ['cancel.com', 'co.pos', 'scope.ch2'], ['co.neg', 'ep.a'],
            ['bat.neg', 'gv.gnd', 'gg.gnd', 'gf.gnd', 'rv2.b', 'u.gnd', 'ep.b', 'scope.gnd'],
        ],
    },

    // The three ways to connect a transistor, side by side, all fed by one
    // signal generator (1 kHz, 10 mV). Common emitter: 47 k / 10 k bias,
    // 1 k emitter bypassed by 22 µF, 4.7 k collector. Common collector
    // (emitter follower): 47 k / 47 k bias, 3.9 k emitter. Common base:
    // 47 k / 10 k bias with the base held by 2.2 µF, the signal into the
    // emitter through 4.7 µF and 220 Ω, 1 k emitter resistor, 4.7 k
    // collector. The other inputs go through 1 µF and 470 nF. The scope
    // shows the generator and, picked by two slide switches, one of the
    // three outputs.
    'lab-amp-configurations': {
        vcc: 9, supply: SUP,
        parts: { bat: BAT9, fg: ['function_gen', { wave: 'sine', freq: 1000, amplitude: 0.01, offset: 0, rOut: 50 }],
            cie: EL(1e-6), r1e: R(47000), r2e: R(10000), qe: NPN_EXP, rce: R(4700), ree: R(1000), cee: EL(22e-6),
            cic: C(470e-9), r1c: R(47000), r2c: R(47000), qc: NPN_EXP, rec: R(3900),
            cib: EL(4.7e-6), rsb: R(220), r1b: R(47000), r2b: R(10000), cbb: EL(2.2e-6), qb: NPN_EXP, rcb: R(4700), reb: R(1000),
            s1: ['slide_switch', { position: 0 }], s2: ['slide_switch', { position: 0 }], scope: ['oscilloscope', {}] },
        nets: [
            ['bat.pos', 'r1e.a', 'rce.a', 'r1c.a', 'qc.collector', 'r1b.a', 'rcb.a'],
            ['fg.out', 'cie.neg', 'cic.a', 'cib.neg', 'scope.ch1'],
            ['cie.pos', 'r1e.b', 'r2e.a', 'qe.base'], ['rce.b', 'qe.collector', 's1.a'], ['qe.emitter', 'ree.a', 'cee.pos'],
            ['cic.b', 'r1c.b', 'r2c.a', 'qc.base'], ['qc.emitter', 'rec.a', 's2.b'],
            ['cib.pos', 'rsb.a'], ['rsb.b', 'qb.emitter', 'reb.a'], ['r1b.b', 'r2b.a', 'cbb.pos', 'qb.base'],
            ['rcb.b', 'qb.collector', 's1.b'],
            ['s1.com', 's2.a'], ['s2.com', 'scope.ch2'],
            ['bat.neg', 'fg.gnd', 'r2e.b', 'ree.b', 'cee.neg', 'r2c.b', 'rec.b', 'r2b.b', 'cbb.neg', 'reb.b', 'scope.gnd'],
        ],
    },

    // Tapped-coil (Hartley) oscillator. The coil is one winding with a tap:
    // modelled as two coupled windings in series (10 mH and 1 mH, k 0.9),
    // the tap on +9 V. The collector drives the top end, the bottom end
    // swings the other way and goes back to the base through 100 nF; 100 nF
    // across the whole coil sets the pitch, f = 1/(2π√(L·C)) with
    // L = 10 + 1 + 2·0.9·√10 mH ≈ 16.7 mH: about 3.9 kHz. Base bias 47 k /
    // 10 k, emitter 1 k bypassed by 10 µF. A crystal earphone listens at
    // the collector through 10 nF; the scope shows both coil ends.
    'lab-hartley-oscillator': {
        vcc: 9, supply: SUP,
        parts: { bat: BAT9, coil: ['transformer', { l1: 0.01, l2: 0.001, k: 0.9 }], ct: C(100e-9),
            q: NPN, cb: C(100e-9), r1: R(47000), r2: R(10000), re: R(1000), ce: EL(10e-6),
            co: C(10e-9), ep: ['earphone', { type: 'crystal' }], scope: ['oscilloscope', {}] },
        nets: [
            ['bat.pos', 'coil.p2', 'coil.s1', 'r1.a'],
            ['coil.p1', 'ct.a', 'q.collector', 'co.a', 'scope.ch1'], ['coil.s2', 'ct.b', 'cb.a', 'scope.ch2'],
            ['cb.b', 'r1.b', 'r2.a', 'q.base'], ['q.emitter', 're.a', 'ce.pos'], ['co.b', 'ep.a'],
            ['bat.neg', 'r2.b', 're.b', 'ce.neg', 'ep.b', 'scope.gnd'],
        ],
    },

    // Precision AC voltmeter. Op-amp 1 is a Wien-bridge oscillator around
    // a buffered 4.5 V (op-amp 4): 16 k / 10 nF in series and in parallel
    // set about 1 kHz; the gain (12 k + 15 k in feedback, 10 k to the
    // reference) starts above three and two anti-parallel diodes across
    // the 15 k pull it back, so the sine settles near 1.8 V peak. The LEVEL
    // pot (10 k between output and reference) picks how much is measured.
    // Op-amp 3 is the RANGE amplifier: a follower for the 1 V range, gain
    // 10 (9.1 k / 1 k) for the 100 mV range. Op-amp 2 is a "superdiode", a
    // follower with a 1N4148 inside its loop: it rectifies without the
    // diode's 0.6 V. Its output P reaches the meter (1 V, 1 MΩ) through
    // 10 k into 1 µF. MODE AVERAGE puts 220 Ω from P to the reference, so P
    // is the half wave and the meter shows its average, peak/π; MODE PEAK
    // takes the 220 Ω away and connects P straight to the 1 µF, which keeps
    // the peak.
    'lab-ac-voltmeter': {
        vcc: 9, supply: SUP,
        parts: { bat: BAT9, u: LM324, rv1: R(10000), rv2: R(10000),
            rs: R(16000), cs: C(10e-9), rp: R(16000), cp: C(10e-9), rg: R(10000), rf1: R(12000), rf2: R(15000), dl1: D, dl2: D,
            level: POT(10000, 1), rfr: R(9100), rgr: R(1000), range: ['slide_switch', { position: 0 }],
            dr: D, rl: R(220), mode: ['slide_switch', { position: 0 }],
            ra: R(10000), cm: C(1e-6), meter: ['analog_meter', { fullScale: 1, ifs: 1e-6 }],
            scope: ['oscilloscope', {}] },
        nets: [
            ['bat.pos', 'u.vcc', 'rv1.a'], ['rv1.b', 'rv2.a', 'u.4_pos'],
            ['u.4_out', 'u.4_neg', 'cp.b', 'rp.b', 'rg.b', 'level.b', 'range.b', 'rl.b', 'cm.b', 'meter.b'],
            ['u.1_out', 'rs.a', 'rf1.a', 'level.a', 'scope.ch1'], ['rs.b', 'cs.a'], ['cs.b', 'cp.a', 'rp.a', 'u.1_pos'],
            ['rf1.b', 'rf2.a', 'dl1.anode', 'dl2.cathode'], ['rf2.b', 'dl1.cathode', 'dl2.anode', 'rg.a', 'u.1_neg'],
            ['level.wiper', 'u.3_pos'], ['u.3_neg', 'rfr.a', 'rgr.a'], ['rgr.b', 'range.com'], ['rfr.b', 'u.3_out', 'u.2_pos'],
            ['u.2_out', 'dr.anode'], ['dr.cathode', 'u.2_neg', 'mode.com', 'ra.a', 'scope.ch2'], ['mode.a', 'rl.a'],
            ['ra.b', 'mode.b', 'cm.a', 'meter.a'],
            ['bat.neg', 'rv2.b', 'u.gnd', 'scope.gnd'],
        ],
        open: ['range.a'],
    },

    // Contact bounce made visible. A binary counter (74HC93, its 3-bit
    // half: CLK B in, QB … QD out) counts falling edges on its clock and
    // shows the count, 0 … 7, on three LEDs (1 k each), on 5 V. CLOCK FROM
    // picks the source. BOUNCY: a push button to +5 V with 10 k to ground,
    // straight in; its contacts bounce for a few milliseconds on press and
    // release, and every bounce is an edge. CLEAN: the same kind of button
    // charges 1 µF through 1 k (100 k discharges it slowly); the brief gaps
    // of the bounce cannot empty the capacitor, and a 555 used only as a
    // Schmitt trigger (TRIGGER and THRESHOLD together) gives one sharp edge
    // per press. RESET (to +5 V, 10 k down) clears the count. The 1-bit half
    // (CLK A) is not used: its input is grounded.
    'lab-bounce-counter': {
        vcc: 5, supply: { pos: 'bat.pos', neg: 'bat.neg' },
        parts: { bat: ['vsource', { volts: 5 }], cnt: ['74hc93', {}],
            src: ['slide_switch', { position: 0 }],
            bouncy: ['button', { bounceMs: 5, bounces: 4, bounceSeed: 7 }], rk: R(10000),
            clean: ['button', { bounceMs: 5, bounces: 4, bounceSeed: 7 }], rc: R(1000), cc: EL(1e-6), rd: R(100000),
            t: ['timer_555', {}], cv: C(10e-9),
            reset: ['button', {}], rr: R(10000),
            r1: R(1000), l1: LED('red'), r2: R(1000), l2: LED('red'), r3: R(1000), l3: LED('red') },
        nets: [
            ['bat.pos', 'cnt.vcc', 'bouncy.a', 'clean.a', 't.vcc', 't.reset', 'reset.a'],
            ['bouncy.b', 'rk.a', 'src.a'], ['clean.b', 'rc.a'], ['rc.b', 'cc.pos', 'rd.a', 't.trigger', 't.threshold'],
            ['t.output', 'src.b'], ['t.control', 'cv.a'], ['src.com', 'cnt.clk_b'],
            ['reset.b', 'rr.a', 'cnt.r0_1', 'cnt.r0_2'],
            ['cnt.qb', 'r1.a'], ['cnt.qc', 'r2.a'], ['cnt.qd', 'r3.a'],
            ['r1.b', 'l1.anode'], ['r2.b', 'l2.anode'], ['r3.b', 'l3.anode'],
            ['bat.neg', 'cnt.gnd', 'cnt.clk_a', 'rk.b', 'cc.neg', 'rd.b', 't.gnd', 'cv.b', 'rr.b', 'l1.cathode', 'l2.cathode', 'l3.cathode'],
        ],
        open: ['t.discharge', 'cnt.qa', 'cnt.nc1', 'cnt.nc2', 'cnt.nc3', 'cnt.nc4'],
    },

    // A charged comb, two ways. JET: a red LED (470 Ω) shines across 2 cm
    // onto a phototransistor (emitter 1 k to ground); a thin water jet
    // falls through the beam and shadows most of it. The light path's knob
    // is the comb's distance from the jet (20 cm … 1 cm, at 10 kV): close
    // enough, the comb pulls the jet aside, light reaches the receiver, its
    // emitter voltage drives an NPN (10 k) and the green BEAM LED lights.
    // SPARK: a comb is a small capacitance (10 pF) that combing charges with
    // a tiny current (100 nA). COMB slides the current onto the comb, or
    // back to ground (resting). At 4.35 kV the 1 mm gap to an earthed
    // electrode breaks down and the comb empties through the arc; the charge
    // arrives through a diode on 10 nF (about 4 V), which a Darlington
    // pair drains slowly through 4.7 MΩ: the yellow LED flashes for a
    // twentieth of a second.
    'lab-comb-jet-spark': {
        vcc: 9, supply: SUP,
        parts: { bat: BAT9, rled: R(470), led: LED('red'), pt: ['phototransistor', {}],
            jet: ['light_path', { from: '@led', to: '@pt', medium: 'jet', distanceCm: 2, combKv: 10, combCm: 20 }],
            rpe: R(1000), rqb: R(10000), q: NPN, rbl: R(1000), beam: LED('green'),
            ic: ['isource', { amps: 1e-7 }], comb: ['slide_switch', { position: 1 }], cc: C(10e-12),
            gap: ['spark_gap', { gapMm: 1 }], rgl: R(10e6), ds: D, cs: C(10e-9), rsb: R(4.7e6), qs1: NPN, qs2: NPN,
            rfl: R(1000), flash: LED('yellow') },
        nets: [
            ['bat.pos', 'rled.a', 'pt.collector', 'rbl.a', 'rfl.a'], ['rled.b', 'led.anode'],
            ['pt.emitter', 'rpe.a', 'rqb.a'], ['rqb.b', 'q.base'], ['rbl.b', 'beam.anode'], ['beam.cathode', 'q.collector'],
            ['ic.pos', 'comb.com'], ['comb.a', 'cc.a', 'gap.a'], ['gap.b', 'rgl.a', 'ds.anode'],
            ['ds.cathode', 'cs.a', 'rsb.a'], ['rsb.b', 'qs1.base'], ['qs1.emitter', 'qs2.base'], ['rfl.b', 'flash.anode'], ['flash.cathode', 'qs1.collector', 'qs2.collector'],
            ['bat.neg', 'led.cathode', 'rpe.b', 'q.emitter', 'ic.neg', 'comb.b', 'cc.b', 'rgl.b', 'cs.b', 'qs2.emitter'],
        ],
    },

};

// Labels the learner sees on the controls and readouts the pages name.
const LABELS = {
    'lab-opamp-crossing': { train: 'TRAIN', left: 'left lamp', right: 'right lamp' },
    'lab-opamp-touch-latch': { set: 'SET plate (finger)', reset: 'RESET plate (finger)', fset: 'finger 1 MΩ', freset: 'finger 1 MΩ', on: 'set', off: 'reset' },
    'lab-opamp-click-whistle': { rate: 'RATE' },
    'lab-resistor-heating': { volts: 'VOLTS', sel: 'SELECT (47 Ω / 100 Ω)', r47: '47 Ω, 1/4 W', r100: '100 Ω, 1/4 W',
        s47: 'thermometer on 47 Ω', s100: 'thermometer on 100 Ω', hot47: 'HOT 47 Ω', hot100: 'HOT 100 Ω' },
    'lab-ammeter-overload': { slamp: 'LAMP', sheat: 'HEATER', sshort: 'SHORT', shunt: 'shunt 0.1 Ω', meter: 'AMPS (1 V = 1 A)' },
    'lab-opamp-adder-subtractor': { ka: 'A', kb: 'B', msum: 'SUM', mdiff: 'DIFFERENCE' },
    'lab-amp-configurations': { fg: 'signal 1 kHz', qe: 'common emitter', qc: 'common collector', qb: 'common base',
        s1: 'scope: emitter / base circuit', s2: 'scope: those / collector circuit' },
    'lab-hartley-oscillator': { coil: 'tapped coil' },
    'lab-ac-voltmeter': { level: 'LEVEL', range: 'RANGE (1 V / 100 mV)', mode: 'MODE (average / peak)', meter: 'AC volts' },
    'lab-opamp-flash-adc': { knob: 'INPUT', meter: 'input volts', hi: 'bit 1', lo: 'bit 0' },
    'lab-log-roots': { knob: 'INPUT (x µA)', root: 'ROOT (square / cube)', min: 'x (0–100 µA)', mout: 'root (1 V = 10 µA)' },
    'lab-opamp-binary-counter': { reset: 'RESET', bit0: 'bit 0', bit1: 'bit 1' },
    'lab-tone-control': { bass: 'BASS', treble: 'TREBLE', gl: 'bass note 100 Hz', gh: 'treble note 5 kHz' },
    'lab-siren-canary': { mode: 'MODE (siren / canary)', sound: 'SOUND' },
    'lab-transistor-thermometer': { sensor: 'sensor transistor', zero: 'ZERO', set: 'SET', meter: '0–100 °C', lamp: 'heater' },
    'lab-two-tone-horn': { sound: 'SOUND' },
    'lab-led-tester': { brk: 'BREAK (wire intact)', short: 'SHORT', dut: 'LED under test' },
    'lab-moisture-beeper': { wet: 'WET (probe in the nappy)', led: 'wet' },
    'lab-voice-canceller': { cancel: 'CANCEL (left / left − right)', gv: 'voice 300 Hz (both)', gg: 'guitar 110 Hz (left)', gf: 'flute 660 Hz (right)' },
    'lab-bounce-counter': { src: 'CLOCK FROM (bouncy / clean)', bouncy: 'BOUNCY', clean: 'CLEAN', reset: 'RESET' },
    'lab-comb-jet-spark': { jet: 'comb distance', comb: 'COMB (combing / resting)', gap: 'spark gap 1 mm', cc: 'comb 10 pF',
        ic: 'combing 100 nA', beam: 'BEAM', flash: 'SPARK' },
};
for (const [id, names] of Object.entries(LABELS))
    for (const [name, label] of Object.entries(names)) {
        const [kind, params] = BENCHES[id].parts[name];
        BENCHES[id].parts[name] = [kind, params, label];
    }

// Resolve '@name' params (a sensor's heatedBy) to engine ids.
for (const spec of Object.values(BENCHES)) {
    const ids = benchIds(spec);
    for (const [, params] of Object.values(spec.parts))
        for (const [k, v] of Object.entries(params || {}))
            if (typeof v === 'string' && v.startsWith('@')) params[k] = ids[v.slice(1)];
}
