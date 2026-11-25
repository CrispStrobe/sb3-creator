/**
 * Netlists for the round-6 "x4" lab benches: circuits built from NPN and PNP
 * transistors, a dual op-amp (LM358), a power-amp IC (LM386) and quad Schmitt
 * NAND gates (74HC132 on 5 V, CD4093 on 9 V), written by
 * `node scripts/gen-lab-circuits-4.mjs --set=r6d`.
 *
 * Same shape as lab-benches-4.mjs: pure data, so test/lab-circuits-r6d.test.mjs
 * names parts by role. Ids follow benchIds (breadboard first, then the parts
 * in the order listed). A param written '@name' (a light path's from / to)
 * is resolved to that part's engine id below.
 *
 * Temperature benches put the sensing transistors in surroundings of their
 * own (`surroundC`, bw-board thermal.js): the panel gives each a Temperature
 * slider and the junction's VBE falls 2 mV per kelvin.
 */
import { benchIds } from './lab-benches-4.mjs';
export { benchIds };

const SUP = { pos: 'bat.pos', neg: 'bat.neg' };
const R = (ohms) => ['resistor', { ohms }];
const C = (farads) => ['capacitor', { farads }];
const EL = (farads) => ['polarized_cap', { farads }];
const LED = (color) => ['led', { color }];
const NPN = ['npn', { beta: 100 }];
const PNP = ['pnp', { beta: 100 }];
const BAT9 = ['vsource', { volts: 9, variant: '9v' }];
const BAT5 = ['vsource', { volts: 5 }];
const POT = (ohms, position) => ['potentiometer', { ohms, position }];
const LM358 = ['lm358', {}];
const SW = (position) => ['slide_switch', { position }];
const BTN = ['button', {}];
const D = ['diode', { part: '1N4148' }];
// A transistor used as a temperature sensor: it sits in surroundings of its
// own (room temperature to start) and follows them with a 1 s time constant.
// Solved on its exponential (Shockley / Ebers-Moll) junction, whose
// saturation current carries the temperature: VBE at a held current falls
// 2 mV/K, and at a held VBE the current rises about 8 % per kelvin. A
// mirror built from them needs the same law in its reference transistor.
const NPN_EXP = { model: 'shockley', is: 1e-14, beta: 100, br: 1, n: 1 };
const NPN_T = ['npn', { ...NPN_EXP, surroundC: 25, thermalTau: 1 }];
const NPN_X = ['npn', { ...NPN_EXP }];

export const BENCHES = {
    // Model-railway level crossing. Half of an LM358 compares its + input with
    // 4.5 V (10 k / 10 k). Its + input hangs between that 4.5 V (100 k) and
    // its own output (100 k): positive feedback, so it stays wherever it was
    // put. The ARRIVE contact pulls the + input to ground: output low, and
    // it stays low. The LEAVE contact pulls it to +9 V: output high, and it
    // stays high. 100 nF from the + input to +9 V starts it high (crossing
    // clear). While the output is low a PNP is switched on through 10 k and
    // a yellow LED, and feeds a two-transistor flasher (1 k + red LED in each
    // collector, 47 k bases, 10 µF cross couplings): the two red lamps blink
    // in turn. While it is high the LED and the PNP's base-emitter junction
    // cannot both conduct on the 9 V that is left, so the flasher is dark.
    'lab-crossing-latch': {
        vcc: 9, supply: SUP,
        parts: { bat: BAT9, u: LM358, ra: R(10000), rb: R(10000), rin: R(100000), rfb: R(100000), cpor: C(100e-9),
            arrive: BTN, leave: BTN, rbase: R(10000), occ: LED('yellow'), rbe: R(47000), qp: PNP,
            rc1: R(1000), l1: LED('red'), rc2: R(1000), l2: LED('red'), rb1: R(47000), rb2: R(47000),
            c1: EL(10e-6), c2: EL(10e-6), q1: NPN, q2: NPN },
        nets: [
            ['bat.pos', 'u.vcc', 'ra.a', 'cpor.a', 'leave.a', 'rbe.a', 'qp.emitter'],
            ['ra.b', 'rb.a', 'u.1_neg', 'rin.a'], ['rin.b', 'rfb.a', 'cpor.b', 'u.1_pos', 'arrive.a', 'leave.b'],
            ['u.1_out', 'rfb.b', 'occ.cathode'], ['occ.anode', 'rbase.a'], ['rbase.b', 'rbe.b', 'qp.base'],
            ['qp.collector', 'rc1.a', 'rc2.a', 'rb1.a', 'rb2.a'],
            ['rc1.b', 'l1.anode'], ['l1.cathode', 'q1.collector', 'c1.pos'], ['c1.neg', 'q2.base', 'rb1.b'],
            ['rc2.b', 'l2.anode'], ['l2.cathode', 'q2.collector', 'c2.pos'], ['c2.neg', 'q1.base', 'rb2.b'],
            ['bat.neg', 'u.gnd', 'rb.b', 'arrive.b', 'q1.emitter', 'q2.emitter', 'u.2_pos', 'u.2_neg'],
        ],
        open: ['u.2_out'],
    },

    // Flicker-fusion tester. Half of an LM358 is a square-wave oscillator:
    // three 100 k resistors (to +9 V, to ground, from the output) set its
    // thresholds, 100 nF charges through 15 k plus the RATE pot (100 k used
    // as a variable resistor). Its output clocks a two-transistor binary
    // divider: Q1 and Q2 cross-coupled through 22 k (470 pF speed-up
    // capacitors), 2.2 k collector loads, 47 k base pull-downs. Each base is
    // reached from the clock through 1 nF and a diode, and each diode's
    // anode is held by 47 k at the OTHER transistor's collector, so the
    // positive clock edge passes only to the transistor that is off and
    // switches it on. The divider changes state once per clock period: half
    // the frequency, an exact 50 % duty. A green LED with 1 k from Q1's
    // collector to ground shows it.
    'lab-fusion-divider': {
        vcc: 9, supply: SUP,
        parts: { bat: BAT9, u: LM358, rh1: R(100000), rh2: R(100000), rh3: R(100000),
            rmin: R(15000), rate: POT(100000, 0.5), ct: C(100e-9),
            ck1: C(1e-9), ck2: C(1e-9), rs1: R(47000), rs2: R(47000), d1: D, d2: D,
            q1: NPN, q2: NPN, rc1: R(2200), rc2: R(2200), x12: R(22000), x21: R(22000),
            cs12: C(470e-12), cs21: C(470e-12), rg1: R(47000), rg2: R(47000), rl: R(1000), led: LED('green') },
        nets: [
            ['bat.pos', 'u.vcc', 'rh1.a', 'rc1.a', 'rc2.a'],
            ['u.1_pos', 'rh1.b', 'rh2.a', 'rh3.a'], ['u.1_out', 'rh3.b', 'rmin.a', 'ck1.a', 'ck2.a'],
            ['rmin.b', 'rate.a'], ['rate.wiper', 'ct.a', 'u.1_neg'],
            ['ck1.b', 'rs1.a', 'd1.anode'], ['d1.cathode', 'q1.base', 'x21.b', 'cs21.b', 'rg1.a'],
            ['ck2.b', 'rs2.a', 'd2.anode'], ['d2.cathode', 'q2.base', 'x12.b', 'cs12.b', 'rg2.a'],
            ['q1.collector', 'rc1.b', 'x12.a', 'cs12.a', 'rs2.b', 'rl.a'], ['rl.b', 'led.anode'],
            ['q2.collector', 'rc2.b', 'x21.a', 'cs21.a', 'rs1.b'],
            ['bat.neg', 'u.gnd', 'rh2.b', 'ct.b', 'q1.emitter', 'q2.emitter', 'rg1.b', 'rg2.b', 'led.cathode', 'u.2_pos', 'u.2_neg'],
        ],
        open: ['rate.b', 'u.2_out'],
    },

    // An op-amp astable that becomes a monoflop when one diode is added.
    // Half 2 of an LM358 buffers 4.5 V from 10 k / 10 k: the circuit's
    // middle. Half 1: its + input sits between the middle (22 k) and its own
    // output (22 k); 47 k from the output charges 10 µF, which hangs from
    // the - input to the middle. With the slide switch at the left this is
    // an astable: the red and green LEDs blink in turn. With it at the right
    // a diode (anode at the - input) stops the capacitor 0.6 V above the
    // middle, below where the + input sits while the output is high: it
    // stays high (green) and waits. The START button pulls 100 nF to ground,
    // which kicks the + input down: the output falls (red), the capacitor
    // runs down through 47 k until it reaches the + input, and the output
    // returns high by itself, about 0.4 s later.
    'lab-opamp-monoflop': {
        vcc: 9, supply: SUP,
        parts: { bat: BAT9, u: LM358, ra: R(10000), rb: R(10000), r1: R(22000), r2: R(22000), rt: R(47000), ct: C(10e-6),
            sw: SW(1), d: D, ctr: C(100e-9), rtr: R(100000), start: BTN,
            rg: R(1000), green: LED('green'), rr: R(1000), red: LED('red') },
        nets: [
            ['bat.pos', 'u.vcc', 'ra.a', 'rtr.a', 'rr.a'],
            ['ra.b', 'rb.a', 'u.2_pos'], ['u.2_neg', 'u.2_out', 'r1.a', 'ct.b', 'd.cathode'],
            ['u.1_pos', 'r1.b', 'r2.a', 'ctr.a'], ['ctr.b', 'rtr.b', 'start.a'],
            ['u.1_out', 'r2.b', 'rt.a', 'rg.a', 'red.cathode'], ['rt.b', 'ct.a', 'u.1_neg', 'sw.com'], ['sw.b', 'd.anode'],
            ['rg.b', 'green.anode'], ['rr.b', 'red.anode'],
            ['bat.neg', 'u.gnd', 'rb.b', 'start.b', 'green.cathode'],
        ],
        open: ['sw.a'],
    },

    // A potato with a copper coin and an iron nail in it: about half a volt
    // from a cell with kilo-ohms inside. Half of an LM358 as a non-inverting
    // amplifier (91 k from the output to the - input, 10 k from there to
    // ground: gain 10.1) takes it at its + input, which draws no current. A
    // moving-coil meter (10 V full scale) reads either the potato directly
    // (slide switch left) or the amplifier's output (right).
    'lab-potato-x10': {
        vcc: 9, supply: SUP,
        parts: { bat: BAT9, cell: ['potato_battery', { volts: 0.5 }], u: LM358, rf: R(91000), rg: R(10000),
            sw: SW(1), meter: ['analog_meter', { fullScale: 10, ifs: 0.0001 }] },
        nets: [
            ['bat.pos', 'u.vcc'], ['cell.pos', 'u.1_pos', 'sw.a'], ['u.1_neg', 'rf.b', 'rg.a'], ['u.1_out', 'rf.a', 'sw.b'],
            ['sw.com', 'meter.a'],
            ['bat.neg', 'cell.neg', 'u.gnd', 'rg.b', 'meter.b', 'u.2_pos', 'u.2_neg'],
        ],
        open: ['u.2_out'],
    },

    // Two forward voltages, added and subtracted by the two halves of an
    // LM358. A LED (red, or green with the slide switch at the right) gets
    // about 1.5 mA through 4.7 k; a silicon diode gets 0.8 mA through 10 k.
    // Half 1 adds: both voltages through 10 k each onto its + input (their
    // mean), and a gain of 2 (10 k / 10 k): the sum. Half 2 subtracts: the
    // LED voltage halved (10 k / 10 k) at its + input, the diode voltage
    // through 10 k to its - input with 10 k feedback: LED minus diode. Two
    // moving-coil meters (5 V full scale) show the results.
    'lab-opamp-add-subtract': {
        vcc: 9, supply: SUP,
        parts: { bat: BAT9, rl: R(4700), sw: SW(0), red: LED('red'), green: LED('green'), rd: R(10000), d: D,
            u: LM358, r1: R(10000), r2: R(10000), rf: R(10000), rg: R(10000),
            r3: R(10000), r4: R(10000), r5: R(10000), r6: R(10000),
            msum: ['analog_meter', { fullScale: 5, ifs: 0.0001 }], mdiff: ['analog_meter', { fullScale: 5, ifs: 0.0001 }] },
        nets: [
            ['bat.pos', 'rl.a', 'rd.a', 'u.vcc'],
            ['rl.b', 'sw.com', 'r1.a', 'r3.a'], ['sw.a', 'red.anode'], ['sw.b', 'green.anode'],
            ['rd.b', 'd.anode', 'r2.a', 'r5.a'],
            ['r1.b', 'r2.b', 'u.1_pos'], ['u.1_neg', 'rf.a', 'rg.a'], ['u.1_out', 'rf.b', 'msum.a'],
            ['r3.b', 'r4.a', 'u.2_pos'], ['r5.b', 'r6.a', 'u.2_neg'], ['u.2_out', 'r6.b', 'mdiff.a'],
            ['bat.neg', 'red.cathode', 'green.cathode', 'd.cathode', 'rg.b', 'r4.b', 'u.gnd', 'msum.b', 'mdiff.b'],
        ],
    },

    // Two tones on one line, taking turns. Two 74HC132s on 5 V. Gate 1 of
    // the first chip (22 k / 100 nF) is a low tone, gate 2 (10 k / 100 nF) a
    // high one. The other chip's gates 1–3 are a two-way selector: gate 1
    // passes the low tone while the select line S is high, gate 2 the high
    // tone while S is low (gate 4 of the first chip makes the inverted S),
    // gate 3 joins the two onto the piezo. S comes from the slide switch:
    // at the left a slow third oscillator (gate 3, 220 k / 1 µF, a few
    // hertz) flips it, so the tones alternate by themselves; at the right it
    // is held high by 10 k and the KEY button pulls it low. The yellow LED
    // (470 Ω from +5 V into the inverted S) lights while S is high.
    'lab-tone-mux': {
        vcc: 5, supply: SUP,
        parts: { bat: BAT5, u1: ['74hc132', {}], ra: R(22000), ca: C(100e-9), rb: R(10000), cb: C(100e-9),
            rs: R(220000), cs: EL(1e-6), sel: SW(0), rp: R(10000), key: BTN,
            u2: ['74hc132', {}], rpz: R(1000), pz: ['piezo', {}], rl: R(470), ls: LED('yellow') },
        nets: [
            ['bat.pos', 'u1.vcc', 'u2.vcc', 'u1.1a', 'u1.2a', 'u1.3a', 'rp.a', 'rl.a'],
            ['u1.1b', 'ra.a', 'ca.a'], ['u1.1y', 'ra.b', 'u2.1a'],
            ['u1.2b', 'rb.a', 'cb.a'], ['u1.2y', 'rb.b', 'u2.2a'],
            ['u1.3b', 'rs.a', 'cs.pos'], ['u1.3y', 'rs.b', 'sel.a'],
            ['rp.b', 'key.a', 'sel.b'],
            ['sel.com', 'u1.4a', 'u1.4b', 'u2.1b'], ['rl.b', 'ls.anode'],
            ['u1.4y', 'u2.2b', 'ls.cathode'], ['u2.1y', 'u2.3a'], ['u2.2y', 'u2.3b'], ['u2.3y', 'rpz.a'], ['rpz.b', 'pz.a'],
            ['bat.neg', 'u1.gnd', 'u2.gnd', 'ca.b', 'cb.b', 'cs.neg', 'key.b', 'pz.b', 'u2.4a', 'u2.4b'],
        ],
        open: ['u2.4y'],
    },

    // A voltage doubler pumped by logic gates. A 74HC132 on 5 V: gate 1 with
    // 10 k / 100 nF is an oscillator (about 1.2 kHz); gate 2, wired as an
    // inverter, buffers it (gates 3 and 4 are spare, inputs grounded). The
    // buffer drives the minus plate of a 10 µF pump capacitor. While the
    // buffer is low, D1 fills the pump capacitor from +5 V; when it goes
    // high it lifts the charge by 5 V, and D2 hands it on to a 47 µF
    // reservoir. A red LED with 10 k and a voltmeter load the output.
    'lab-gate-pump': {
        vcc: 5, supply: SUP,
        parts: { bat: BAT5, u: ['74hc132', {}], rt: R(10000), ct: C(100e-9), cp: EL(10e-6), d1: D, d2: D,
            cres: EL(47e-6), rl: R(10000), led: LED('red'), vm: ['voltmeter', {}] },
        nets: [
            ['bat.pos', 'u.vcc', 'u.1a', 'd1.anode'], ['u.1b', 'rt.a', 'ct.a'],
            ['u.1y', 'rt.b', 'u.2a', 'u.2b'],
            ['u.2y', 'cp.neg'], ['cp.pos', 'd1.cathode', 'd2.anode'],
            ['d2.cathode', 'cres.pos', 'rl.a', 'vm.a'], ['rl.b', 'led.anode'],
            ['bat.neg', 'u.gnd', 'ct.b', 'cres.neg', 'led.cathode', 'vm.b', 'u.3a', 'u.3b', 'u.4a', 'u.4b'],
        ],
        open: ['u.3y', 'u.4y'],
    },

    // Temperature watchdog. Two NPNs as a current mirror on 5 V: the
    // reference transistor, base tied to collector, takes about 90 µA
    // through 47 k; the sensor transistor shares its base voltage, so it
    // copies that current into 22 k, and its collector sits near 3 V. Each
    // transistor sits in surroundings of its own (a Temperature slider). If
    // the sensor gets warmer than the reference, its junction needs less
    // voltage for the same current: it draws more, its collector falls
    // below the Schmitt threshold of a 74HC132 gate wired as an inverter,
    // and that gate's output lights the red LED and switches on gate 2 (22 k
    // / 100 nF), an alarm tone into the piezo. Warming both together changes
    // nothing: the mirror cancels the drift.
    'lab-heat-watchdog': {
        vcc: 5, supply: SUP,
        parts: { bat: BAT5, rref: R(47000), qr: NPN_T, qs: NPN_T, rload: R(22000), u: ['74hc132', {}],
            ral: R(470), al: LED('red'), rt: R(22000), ct: C(100e-9), rpz: R(1000), pz: ['piezo', {}] },
        nets: [
            ['bat.pos', 'rref.a', 'rload.a', 'u.vcc'],
            ['rref.b', 'qr.collector', 'qr.base', 'qs.base'], ['rload.b', 'qs.collector', 'u.1a', 'u.1b'],
            ['u.1y', 'u.2a', 'ral.a'], ['ral.b', 'al.anode'], ['u.2b', 'rt.a', 'ct.a'], ['u.2y', 'rt.b', 'rpz.a'], ['rpz.b', 'pz.a'],
            ['bat.neg', 'qr.emitter', 'qs.emitter', 'u.gnd', 'al.cathode', 'ct.b', 'pz.b', 'u.3a', 'u.3b', 'u.4a', 'u.4b'],
        ],
        open: ['u.3y', 'u.4y'],
    },

    // Reflective light barrier that ignores room light. Gate 1 of a 74HC132
    // (22 k / 100 nF, about 570 Hz) clocks an IR LED through an NPN (4.7 k
    // with 10 nF at the base, which rounds the edges a little; 100 Ω from
    // 5 V). A surface reflects it onto a phototransistor (10 k pull-up);
    // gate 2 squares that up again. The four NAND gates of a 74HC00 form an
    // exclusive-OR of the clock and the received signal: when the light
    // that comes back is the LED's own, the two agree and the XOR stays
    // low. Anything else (nothing coming back, or a lamp that holds the
    // phototransistor on) leaves the XOR following the clock, high about
    // half the time. 47 k / 220 nF averages the XOR and half of an LM358
    // compares that with 1.16 V (33 k / 10 k): green LED = object there.
    // The yellow LED shows the plain received signal, which a lamp alone
    // also lights.
    'lab-xor-reflect': {
        vcc: 5, supply: SUP,
        parts: { bat: BAT5, u1: ['74hc132', {}], rc: R(22000), cc: C(100e-9), rbd: R(4700), cbd: C(10e-9), qd: NPN, rir: R(100),
            ir: ['ir_transmitter', {}], pt: ['phototransistor', {}], rpu: R(10000), u2: ['74hc00', {}],
            ri: R(47000), ci: C(220e-9), rin: R(47000), ra: R(33000), rb: R(10000), u: LM358,
            lfb: LED('red'), dfb: D, rok: R(470), ok: LED('green'), rnv: R(470), nv: LED('yellow'),
            surface: ['light_path', { from: '@ir', to: '@pt', medium: 'reflect', surface: 'white', distanceCm: 2,
                knob: 'distanceCm', knobMin: 1, knobMax: 20 }] },
        nets: [
            ['bat.pos', 'u1.vcc', 'u2.vcc', 'u1.1a', 'rir.a', 'rpu.a', 'u.vcc', 'ra.a'],
            ['u1.1b', 'rc.a', 'cc.a'], ['u1.1y', 'rc.b', 'rbd.a', 'u2.1a', 'u2.2a'],
            ['rbd.b', 'cbd.a', 'qd.base'], ['rir.b', 'ir.anode'], ['ir.cathode', 'qd.collector'],
            ['rpu.b', 'pt.collector', 'u1.2a', 'u1.2b'], ['u1.2y', 'u2.1b', 'u2.3a', 'rnv.a'], ['rnv.b', 'nv.anode'],
            ['u2.1y', 'u2.2b', 'u2.3b'], ['u2.2y', 'u2.4a'], ['u2.3y', 'u2.4b'], ['u2.4y', 'ri.a'],
            ['ri.b', 'ci.a', 'rin.a'], ['rin.b', 'u.1_neg', 'lfb.cathode', 'dfb.anode'], ['ra.b', 'rb.a', 'u.1_pos'],
            ['u.1_out', 'lfb.anode', 'dfb.cathode', 'rok.a'], ['rok.b', 'ok.anode'],
            ['bat.neg', 'u1.gnd', 'u2.gnd', 'cc.b', 'cbd.b', 'qd.emitter', 'pt.emitter', 'ci.b', 'rb.b', 'u.gnd', 'ok.cathode', 'nv.cathode',
                'u1.3a', 'u1.3b', 'u1.4a', 'u1.4b', 'u.2_pos', 'u.2_neg'],
        ],
        open: ['u1.3y', 'u1.4y', 'u.2_out'],
    },

    // Slave flash. A PNP/NPN thyristor as in lab-scr-pair (4.7 k from the
    // PNP's base to its emitter, 1 k and 10 nF from the gate to the
    // cathode) with a white LED and 470 Ω as its "flash lamp"; 47 k from
    // the anode to the cathode keeps the anode at a defined voltage while it
    // is off. A phototransistor from +9 V with 1 k in its emitter watches
    // the room; its emitter reaches the gate only through 100 nF, a diode
    // (10 k to ground before it) and 1 k. A sudden flash makes a steep step
    // at the emitter, the capacitor passes it as a gate pulse and the
    // thyristor fires and stays on. Slow changes of the room light pass a
    // current far too small to fire it, and the diode keeps a falling step
    // away from the gate. The main switch resets it. The 10 nF also matters
    // to the engine: the solve that follows a control change ignores the
    // transistors' stored charge, and without a capacitor holding the gate
    // an off latch could land in its on state there.
    'lab-scr-flash': {
        vcc: 9, supply: SUP,
        parts: { bat: BAT9, main: SW(1), rl: R(470), fl: LED('white'), qp: PNP, qn: NPN, rak: R(4700), rgk: R(1000),
            pt: ['phototransistor', {}], re: R(1000), cg: C(100e-9), rpd: R(10000), dg: D, rg: R(1000), cgk: C(10e-9), rbl: R(47000) },
        nets: [
            ['bat.pos', 'main.com', 'pt.collector'], ['main.b', 'rl.a'], ['rl.b', 'fl.anode'],
            ['fl.cathode', 'qp.emitter', 'rak.a', 'rbl.a'], ['qp.base', 'rak.b', 'qn.collector'],
            ['qp.collector', 'qn.base', 'rgk.a', 'rg.b', 'cgk.a'], ['pt.emitter', 're.a', 'cg.a'], ['cg.b', 'rpd.a', 'dg.anode'],
            ['dg.cathode', 'rg.a'],
            ['bat.neg', 'qn.emitter', 'rgk.b', 're.b', 'rpd.b', 'rbl.b', 'cgk.b'],
        ],
        open: ['main.a'],
    },

    // Phase-angle dimmer on low-voltage AC (12 V peak, 50 Hz, as from a bell
    // transformer). A 12 V lamp, a series diode (so the pair never sees the
    // negative half) and the PNP/NPN thyristor. The gate is fed from the AC
    // through the DIMMER pot (100 k as a variable resistor) and 4.7 k into
    // 100 nF; that capacitor's voltage lags the AC, and through a diode and
    // 1 k it fires the gate (4.7 k to the cathode) partway into each
    // positive half. The thyristor then carries the lamp to the end of that
    // half and switches off at the zero crossing. More resistance: a later
    // firing angle and a dimmer lamp.
    'lab-scr-dimmer': {
        vcc: 12, supply: { pos: 'ac.pos', neg: 'ac.neg' },
        parts: { ac: ['vsource', { wave: 'sine', freq: 50, amplitude: 12, offset: 0 }],
            lamp: ['light_bulb', { ohms: 120, vRated: 12 }], d1: ['diode', { part: '1N4001' }],
            qp: PNP, qn: NPN, rak: R(4700), rgk: R(4700), dim: POT(100000, 0.5), rmin: R(4700), cd: C(100e-9), dg: D, rgs: R(1000) },
        nets: [
            ['ac.pos', 'lamp.a', 'dim.a'], ['lamp.b', 'd1.anode'], ['d1.cathode', 'qp.emitter', 'rak.a'],
            ['qp.base', 'rak.b', 'qn.collector'], ['qp.collector', 'qn.base', 'rgk.a', 'rgs.b'],
            ['dim.wiper', 'rmin.a'], ['rmin.b', 'cd.a', 'dg.anode'], ['dg.cathode', 'rgs.a'],
            ['ac.neg', 'qn.emitter', 'rgk.b', 'cd.b'],
        ],
        open: ['dim.b'],
    },

    // Class A against class C. A 1 kHz sine (1.5 V peak) goes through the
    // LEVEL pot to two NPN stages on 9 V. Class A: 47 k / 10 k bias the base
    // to about 1.6 V, the signal arrives through 22 k and 470 nF, 4.7 k
    // collector and 1 k emitter resistors: the transistor carries current
    // all the way round the cycle. Class C: no bias at all, the signal
    // reaches the base through 4.7 k (47 k to ground): the transistor waits
    // until the signal is past about 0.7 V and conducts only on the tops of
    // the positive half-waves, a third of the cycle or less. Its collector
    // load is 1 k and a red LED.
    'lab-amp-classes': {
        vcc: 9, supply: SUP,
        parts: { bat: BAT9, fg: ['function_gen', { wave: 'sine', freq: 1000, amplitude: 1.5, offset: 0 }], lvl: POT(10000, 1),
            rsa: R(22000), cin: C(470e-9), ra1: R(47000), ra2: R(10000), qa: NPN, rca: R(4700), rea: R(1000),
            rsc: R(4700), rbc: R(47000), qc: NPN, rcc: R(1000), lc: LED('red') },
        nets: [
            ['bat.pos', 'ra1.a', 'rca.a', 'rcc.a'],
            ['fg.out', 'lvl.a'], ['lvl.wiper', 'rsa.a', 'rsc.a'], ['rsa.b', 'cin.a'], ['cin.b', 'ra1.b', 'ra2.a', 'qa.base'],
            ['qa.collector', 'rca.b'], ['qa.emitter', 'rea.a'],
            ['rsc.b', 'rbc.a', 'qc.base'], ['rcc.b', 'lc.anode'], ['lc.cathode', 'qc.collector'],
            ['bat.neg', 'fg.gnd', 'lvl.b', 'ra2.b', 'rea.b', 'rbc.b', 'qc.emitter'],
        ],
    },

    // The three ways to wire one transistor, side by side, all biased alike
    // (47 k / 10 k from 9 V, 1 k emitter resistor, 4.7 k collector resistor
    // where there is one) and all fed the same 1 kHz, 0.2 V sine through
    // 10 µF. Common emitter: signal on the base, output at the collector.
    // Common collector (emitter follower): signal on the base, output at the
    // emitter. Common base: base held still by 10 µF, the signal pushed into
    // the emitter through 1 k, output at the collector. Two oscilloscopes
    // show the input with the follower and the two collectors.
    'lab-common-base': {
        vcc: 9, supply: SUP,
        parts: { bat: BAT9, fg: ['function_gen', { wave: 'sine', freq: 1000, amplitude: 0.2, offset: 0 }],
            cie: EL(10e-6), r1e: R(47000), r2e: R(10000), qe: NPN, rce: R(4700), ree: R(1000),
            cic: EL(10e-6), r1c: R(47000), r2c: R(10000), qc: NPN, rec: R(1000),
            cib: EL(10e-6), rsb: R(1000), r1b: R(47000), r2b: R(10000), cbb: EL(10e-6), qb: NPN, rcb: R(4700), reb: R(1000),
            scope1: ['oscilloscope', {}], scope2: ['oscilloscope', {}] },
        nets: [
            ['bat.pos', 'r1e.a', 'rce.a', 'r1c.a', 'qc.collector', 'r1b.a', 'rcb.a'],
            ['fg.out', 'cie.neg', 'cic.neg', 'cib.neg', 'scope2.ch1'],
            ['cie.pos', 'r1e.b', 'r2e.a', 'qe.base'], ['qe.collector', 'rce.b', 'scope1.ch1'], ['qe.emitter', 'ree.a'],
            ['cic.pos', 'r1c.b', 'r2c.a', 'qc.base'], ['qc.emitter', 'rec.a', 'scope2.ch2'],
            ['cib.pos', 'rsb.a'], ['rsb.b', 'qb.emitter', 'reb.a'], ['r1b.b', 'r2b.a', 'cbb.pos', 'qb.base'],
            ['qb.collector', 'rcb.b', 'scope1.ch2'],
            ['bat.neg', 'fg.gnd', 'r2e.b', 'ree.b', 'r2c.b', 'rec.b', 'r2b.b', 'cbb.neg', 'reb.b', 'scope1.gnd', 'scope2.gnd'],
        ],
    },

    // Bird twitter from three oscillators. The slow one is an op-amp
    // integrator and two Schmitt NAND gates: half of an LM358 on 5 V
    // integrates (150 k into its - input, 1 µF feedback, + input at 2.5 V
    // from 10 k / 10 k); gate 4 of the first 74HC132 and gate 1 of the
    // second, both as inverters, follow its output and feed the result back
    // through the 150 k. The output ramps down while that is high and up
    // while it is low, turning round at the gate's two switching levels: a
    // triangle of about 1 V, and a square wave at gate 4, a few hertz. That
    // square wave lets gate 2 (100 k / 470 nF, about 25 Hz) run: the
    // chirps. Gate 3 inverts gate 2 and enables gate 1 (4.7 k / 100 nF, a
    // few kilohertz), the voice, which sounds only during the chirps and
    // only while the phrase lasts. The piezo plays it through 1 k. The
    // op-amp works as an integrator here and never swings to its rails.
    'lab-bird-chirps': {
        vcc: 5, supply: SUP,
        parts: { bat: BAT5, u: LM358, rr1: R(10000), rr2: R(10000), ri: R(150000), ci: C(1e-6),
            ug: ['74hc132', {}], ug2: ['74hc132', {}], rb: R(100000), cb: C(470e-9), ra: R(4700), ca: C(100e-9),
            rpz: R(1000), pz: ['piezo', {}] },
        nets: [
            ['bat.pos', 'u.vcc', 'rr1.a', 'ug.vcc', 'ug2.vcc'],
            ['rr1.b', 'rr2.a', 'u.1_pos'], ['u.1_neg', 'ri.b', 'ci.a'], ['u.1_out', 'ci.b', 'ug.4a', 'ug.4b'],
            ['ug.4y', 'ug2.1a', 'ug2.1b', 'ug.2a'], ['ug2.1y', 'ri.a'],
            ['ug.2b', 'rb.a', 'cb.a'], ['ug.2y', 'rb.b', 'ug.3a', 'ug.3b'], ['ug.3y', 'ug.1a'],
            ['ug.1b', 'ra.a', 'ca.a'], ['ug.1y', 'ra.b', 'rpz.a'], ['rpz.b', 'pz.a'],
            ['bat.neg', 'u.gnd', 'ug.gnd', 'ug2.gnd', 'rr2.b', 'cb.b', 'ca.b', 'pz.b', 'u.2_pos', 'u.2_neg',
                'ug2.2a', 'ug2.2b', 'ug2.3a', 'ug2.3b', 'ug2.4a', 'ug2.4b'],
        ],
        open: ['u.2_out', 'ug2.2y', 'ug2.3y', 'ug2.4y'],
    },

    // Voltage-to-frequency converter with a discrete trigger. Half 2 of an
    // LM358 buffers 4.5 V (10 k / 10 k). Half 1 integrates: its + input at
    // 4.5 V, 220 nF from output to - input, and 100 k from the - input to
    // the INPUT pot's wiper (the pot spans 4.5 V to ground). The further the
    // wiper sits below 4.5 V, the faster the output ramps up from 4.5 V. Two
    // NPNs with a shared 2.2 k emitter resistor are a Schmitt trigger (1 k
    // collector for Q1, coupled to Q2's base by 1 k with 5.1 k to ground;
    // 1 k collector for Q2). When the ramp reaches its upper threshold (about
    // 6.4 V) Q2 turns off and its collector rises from 6.4 V towards 9 V.
    // A divider (10 k down to 22 k to ground) hands that to the base of the
    // reset NPN across the capacitor: at 6.4 V it holds the base below the
    // 4.5 V of its emitter, near 9 V it turns it on and the capacitor is
    // emptied. The ramp falls to the lower threshold (about 5.05 V), Q2
    // conducts again, and the next ramp starts. Each reset clicks the piezo
    // (10 k from Q2's collector): it sings at the conversion frequency.
    'lab-transistor-v-to-f': {
        vcc: 9, supply: SUP,
        parts: { bat: BAT9, u: LM358, ra: R(10000), rb: R(10000), inp: POT(10000, 0.5), ri: R(100000), ci: C(220e-9),
            q1: NPN, q2: NPN, rc1: R(1000), r12: R(1000), r2g: R(5100), rc2: R(1000), re: R(2200),
            rr: R(10000), rbe: R(22000), qr: NPN, rpz: R(10000), pz: ['piezo', {}] },
        nets: [
            ['bat.pos', 'u.vcc', 'ra.a', 'rc1.a', 'rc2.a'],
            ['ra.b', 'rb.a', 'u.2_pos'], ['u.2_out', 'u.2_neg', 'u.1_pos', 'inp.a'],
            ['inp.wiper', 'ri.a'], ['ri.b', 'ci.a', 'u.1_neg', 'qr.emitter'], ['u.1_out', 'ci.b', 'qr.collector', 'q1.base'],
            ['q1.collector', 'rc1.b', 'r12.a'], ['r12.b', 'r2g.a', 'q2.base'], ['q1.emitter', 'q2.emitter', 're.a'],
            ['q2.collector', 'rc2.b', 'rr.a', 'rpz.a'], ['rr.b', 'rbe.a', 'qr.base'], ['rpz.b', 'pz.a'],
            ['bat.neg', 'u.gnd', 'rb.b', 'inp.b', 'r2g.b', 're.b', 'rbe.b', 'pz.b'],
        ],
    },

    // Thermometer from a current mirror. Two NPNs with 1 k in each emitter:
    // the reference one, base tied to collector, takes 0.9 mA through 8.2 k;
    // the sensor shares its base voltage and copies that current into 6.8 k.
    // The sensor sits in surroundings of its own (a Temperature slider):
    // warmer, its junction needs about 2 mV less per kelvin, so it carries
    // about 2 µA more per kelvin and its collector falls. Half 1 of an LM358
    // (10 k in, 120 k feedback: about 7 times, the collector's 6.8 k being
    // in series with the 10 k) turns that into a rising output against a
    // reference that the ZERO pot sets (0.327: zero at room temperature) and
    // half 2 buffers; a moving-coil meter (5 V full scale) between the
    // output and that reference reads about 0.09 V per kelvin of warming.
    'lab-mirror-thermometer': {
        vcc: 9, supply: SUP,
        parts: { bat: BAT9, rref: R(8200), qr: NPN_X, rer: R(1000), qs: NPN_T, res: R(1000), rcs: R(6800),
            zero: POT(10000, 0.327), u: LM358, rin: R(10000), rf: R(120000),
            meter: ['analog_meter', { fullScale: 5, ifs: 0.0001 }] },
        nets: [
            ['bat.pos', 'rref.a', 'rcs.a', 'zero.a', 'u.vcc'],
            ['rref.b', 'qr.collector', 'qr.base', 'qs.base'], ['qr.emitter', 'rer.a'], ['qs.emitter', 'res.a'],
            ['qs.collector', 'rcs.b', 'rin.a'], ['zero.wiper', 'u.2_pos'], ['u.2_out', 'u.2_neg', 'u.1_pos', 'meter.b'],
            ['rin.b', 'rf.a', 'u.1_neg'], ['u.1_out', 'rf.b', 'meter.a'],
            ['bat.neg', 'rer.b', 'res.b', 'zero.b', 'u.gnd'],
        ],
    },

    // A tone whose loudness is set by light, and light that flashes. One NPN
    // is an RC phase-shift oscillator: 4.7 k collector resistor, three
    // 10 nF / 4.7 k sections from collector back to base, 470 k from the
    // collector to the base for bias: about 1.1 kHz, 8 V peak to peak.
    // Through 1 µF and a 1 M / 2.2 k divider (a few tens of millivolts) it
    // reaches an LM386 whose gain pins (1 and 8) are bridged by a
    // phototransistor in series with 10 µF: the more light, the more gain.
    // Half 1 of an LM358 is a square wave of about 20 Hz (three 100 k,
    // 47 k / 470 nF) that flashes an IR LED (470 Ω) 2 cm from the
    // phototransistor: the tone throbs with it, amplitude modulation. The
    // loudspeaker hangs on the LM386 through 220 µF.
    'lab-light-volume-am': {
        vcc: 9, supply: SUP,
        parts: { bat: BAT9, q: NPN, rc: R(4700), rbias: R(470000), c1: C(10e-9), r1: R(4700), c2: C(10e-9), r2: R(4700), c3: C(10e-9),
            cc: C(1e-6), rv: R(1000000), rdn: R(2200), amp: ['lm386', {}], pt: ['phototransistor', {}], cg: EL(10e-6),
            co: EL(220e-6), spk: ['speaker', { ohms: 8 }],
            u: LM358, rh1: R(100000), rh2: R(100000), rh3: R(100000), ro: R(47000), co2: C(470e-9), rir: R(470),
            ir: ['ir_transmitter', {}],
            beam: ['light_path', { from: '@ir', to: '@pt', medium: 'air', distanceCm: 2, knob: 'distanceCm', knobMin: 1, knobMax: 20 }] },
        nets: [
            ['bat.pos', 'rc.a', 'amp.vs', 'u.vcc', 'rh1.a'],
            ['q.collector', 'rc.b', 'rbias.a', 'c1.a', 'cc.a'], ['c1.b', 'r1.a', 'c2.a'], ['c2.b', 'r2.a', 'c3.a'],
            ['c3.b', 'q.base', 'rbias.b'],
            ['cc.b', 'rv.a'], ['rv.b', 'rdn.a', 'amp.inp'], ['amp.gain1', 'pt.collector'], ['pt.emitter', 'cg.pos'], ['cg.neg', 'amp.gain8'],
            ['amp.vout', 'co.pos'], ['co.neg', 'spk.a'],
            ['u.1_pos', 'rh1.b', 'rh2.a', 'rh3.a'], ['u.1_out', 'rh3.b', 'ro.a', 'rir.a'], ['u.1_neg', 'ro.b', 'co2.a'], ['rir.b', 'ir.anode'],
            ['bat.neg', 'q.emitter', 'r1.b', 'r2.b', 'rdn.b', 'amp.gnd', 'amp.inn', 'spk.b', 'u.gnd', 'rh2.b', 'co2.b', 'ir.cathode', 'u.2_pos', 'u.2_neg'],
        ],
        open: ['amp.bypass', 'u.2_out'],
    },
};

// Resolve '@name' params to engine ids.
for (const spec of Object.values(BENCHES)) {
    const ids = benchIds(spec);
    for (const [, params] of Object.values(spec.parts))
        for (const [k, v] of Object.entries(params || {}))
            if (typeof v === 'string' && v.startsWith('@')) params[k] = ids[v.slice(1)];
}
