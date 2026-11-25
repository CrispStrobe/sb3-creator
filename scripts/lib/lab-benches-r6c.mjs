/**
 * Netlists for the r6c lab benches: a power-amplifier IC (LM386) and NPN
 * transistors doing the work a whole kit of small experiments asks of them —
 * the amplifier as a relaxation oscillator, a comparator, a latch and a
 * monoflop; transistors as flip-flops, Schmitt triggers, a current mirror
 * thermometer and a differential pair; phototransistors on light paths.
 * Written by `node scripts/gen-lab-circuits-4.mjs --set=r6c`.
 *
 * Same shape as lab-benches-4.mjs: pure data, so
 * test/lab-circuits-r6c.test.mjs names parts by role. Ids follow benchIds
 * (breadboard first, then the parts in the order listed). A param written
 * '@name' (a light path's from / to) is resolved to that part's engine id
 * at the end of this file.
 *
 * THE LM386 AS A SWITCH. bw-board's LM386 macromodel (src/lm386.js) has
 * 50 kΩ from each input to ground and an open-loop output of
 * Vs/2 + 20·(V+ − V−) inside a 0.9 V .. Vs − 0.9 V swing window (pins 1/8
 * open). Two resistors give its + input a threshold that moves with the
 * output (47 kΩ from the output, 100 kΩ from +9 V, against the internal
 * 50 kΩ: about 5.1 V with the output high, 2.1 V with it low); an RC from
 * the output to the − input then makes the relaxation oscillator every
 * amplifier-IC bench here is built round. 1 nF across the 47 kΩ is a
 * speed-up capacitor: it makes the flips cleaner and the simulation
 * cheaper. An NPN from the + input to ground ("kill" transistor) holds the
 * oscillator off while it conducts — the way a sensor gates a tone.
 */
import { benchIds } from './lab-benches-4.mjs';
export { benchIds };

const SUP = { pos: 'bat.pos', neg: 'bat.neg' };
const R = (ohms) => ['resistor', { ohms }];
const C = (farads) => ['capacitor', { farads }];
const EL = (farads) => ['polarized_cap', { farads }];
const LED = (color) => ['led', { color }];
const NPN = ['npn', { beta: 100 }];
// Exponential junctions (Ebers-Moll) where the transistor's own law is the
// point: a current mirror and a differential pair.
const NPN_EM = (extra = {}) => ['npn', { model: 'shockley', is: 1e-14, beta: 150, br: 1, n: 1, rb: 10, rc: 1, ...extra }];
const BAT9 = ['vsource', { volts: 9, variant: '9v' }];
const POT = (ohms, position) => ['potentiometer', { ohms, position }];
const D = ['diode', { part: '1N4148' }];
const LM386 = ['lm386', {}];
const BTN = ['button', {}];

export const BENCHES = {
    // LM386 relaxation oscillator at a few hertz: the output flips between
    // 0.9 V and 8.1 V each time the 10 µF on the − input charges past the
    // threshold its + input sets. Red LED from the output to ground (lit
    // while the output is high), green LED from +9 V to the output (lit while
    // it is low): an alternating pair. The switch puts a loudspeaker on the
    // output through 10 µF and 33 Ω: it clicks at every edge.
    'lab-amp-blinker': {
        vcc: 9, supply: SUP,
        parts: { bat: BAT9, u: LM386, rh: R(47000), cf: C(1e-9), rv: R(100000), rt: R(10000), ct: EL(10e-6),
            r1: R(1000), red: LED('red'), r2: R(1000), green: LED('green'),
            sw: ['switch', {}], cc: EL(10e-6), rs: R(33), spk: ['speaker', { ohms: 8 }] },
        nets: [
            ['bat.pos', 'u.vs', 'rv.a', 'r2.a'],
            ['u.vout', 'rh.a', 'cf.a', 'rt.a', 'r1.a', 'green.cathode', 'sw.a'],
            ['u.inp', 'rh.b', 'cf.b', 'rv.b'], ['u.inn', 'rt.b', 'ct.pos'],
            ['r1.b', 'red.anode'], ['r2.b', 'green.anode'],
            ['sw.b', 'cc.pos'], ['cc.neg', 'rs.a'], ['rs.b', 'spk.a'],
            ['bat.neg', 'u.gnd', 'ct.neg', 'red.cathode', 'spk.b'],
        ],
        open: ['u.gain1', 'u.gain8', 'u.bypass'],
    },

    // The same oscillator at audio rate (220 nF), its timing resistor made
    // of 1 kΩ plus whatever lies between two probe tips. Probe A is the end
    // of 1 kΩ from the output, probe B the − input. Between them: a "harp"
    // of four resistors in a chain (2.2 k, 2.2 k, 2.7 k, 3.3 k) whose taps
    // the four touch buttons connect to probe B — four notes — or, with the
    // PROBES button, a test object (a 47 kΩ rheostat). Low resistance, high
    // note; above about 27 kΩ the − input can no longer reach the upper
    // threshold and the tone stops: no continuity.
    'lab-amp-probe-harp': {
        vcc: 9, supply: SUP,
        parts: { bat: BAT9, u: LM386, rh: R(47000), cf: C(1e-9), rv: R(100000), r0: R(1000), ct: C(220e-9),
            h1: R(2200), h2: R(2200), h3: R(2700), h4: R(3300),
            k1: BTN, k2: BTN, k3: BTN, k4: BTN, probes: BTN, obj: POT(47000, 0.75),
            co: EL(47e-6), rs: R(47), spk: ['speaker', { ohms: 8 }] },
        nets: [
            ['bat.pos', 'u.vs', 'rv.a'],
            ['u.vout', 'rh.a', 'cf.a', 'r0.a', 'co.pos'], ['u.inp', 'rh.b', 'cf.b', 'rv.b'],
            ['r0.b', 'h1.a', 'probes.a'], ['h1.b', 'h2.a', 'k1.a'], ['h2.b', 'h3.a', 'k2.a'], ['h3.b', 'h4.a', 'k3.a'], ['h4.b', 'k4.a'],
            ['probes.b', 'obj.a'],
            ['u.inn', 'ct.a', 'k1.b', 'k2.b', 'k3.b', 'k4.b', 'obj.wiper', 'obj.b'],
            ['co.neg', 'rs.a'], ['rs.b', 'spk.a'],
            ['bat.neg', 'u.gnd', 'ct.b', 'spk.b'],
        ],
        open: ['u.gain1', 'u.gain8', 'u.bypass'],
    },

    // Morse key without moving parts. The tone oscillator (100 nF, about
    // 550 Hz) is held off by a "kill" NPN on its + input, which 47 kΩ and a
    // diode keep conducting. A Darlington (two NPN) hangs from that node:
    // a fingertip across the touch contacts (2.2 MΩ of skin) turns it on, it
    // pulls the node to about 0.7 V — too little to push current through the
    // diode into the kill transistor's base (47 kΩ holds that base down) — the
    // kill transistor lets go and the tone sounds for as long as the finger
    // stays.
    'lab-touch-morse': {
        vcc: 9, supply: SUP,
        parts: { bat: BAT9, touch: BTN, skin: R(2200000), qa: NPN, qb: NPN,
            rup: R(47000), dk: D, rbk: R(10000), rbe: R(47000), qk: NPN,
            u: LM386, rh: R(47000), cf: C(1e-9), rv: R(100000), rt: R(10000), ct: C(100e-9),
            co: EL(47e-6), rs: R(47), spk: ['speaker', { ohms: 8 }] },
        nets: [
            ['bat.pos', 'touch.a', 'rup.a', 'u.vs', 'rv.a'],
            ['touch.b', 'skin.a'], ['skin.b', 'qa.base'], ['qa.emitter', 'qb.base'],
            ['rup.b', 'qa.collector', 'qb.collector', 'dk.anode'], ['dk.cathode', 'rbk.a'], ['rbk.b', 'qk.base', 'rbe.a'],
            ['u.inp', 'rh.b', 'cf.b', 'rv.b', 'qk.collector'],
            ['u.vout', 'rh.a', 'cf.a', 'rt.a', 'co.pos'], ['u.inn', 'rt.b', 'ct.a'],
            ['co.neg', 'rs.a'], ['rs.b', 'spk.a'],
            ['bat.neg', 'qb.emitter', 'rbe.b', 'qk.emitter', 'u.gnd', 'ct.b', 'spk.b'],
        ],
        open: ['u.gain1', 'u.gain8', 'u.bypass'],
    },
    // Trip-wire alarm with a two-tone siren. A transistor flip-flop: Q2
    // (green, "armed") conducts at switch-on (1 µF on Q1's base). The trip
    // wire is a closed switch holding the set line at ground; break it and
    // 22 kΩ lifts the line, the diode passes it to Q1's base, Q1 turns on
    // (red) and holds itself. Mending the wire grounds the set line again,
    // but the diode blocks: the alarm stays until the hidden RESET button
    // grounds Q1's base. Q1's collector, high while armed, keeps the kill
    // NPN on the LM386's + input conducting; when Q1 turns on, the
    // oscillator runs. A slow two-transistor astable (4.7 µF, 33 kΩ: about
    // 4 Hz) pulls the timing capacitor's node through a diode and 33 kΩ
    // whenever its Q4 conducts: the pitch drops, then rises — two tones.
    'lab-trip-wire-siren': {
        vcc: 9, supply: SUP,
        parts: { bat: BAT9, q1: NPN, q2: NPN, rc1: R(1000), red: LED('red'), rc2: R(1000), green: LED('green'),
            x1: R(22000), x2: R(22000), cb: EL(1e-6), rset: R(22000), wire: ['switch', { closed: true }], ds: D, rds: R(10000),
            reset: BTN, rbk: R(47000), qk: NPN,
            u: LM386, rh: R(47000), cf: C(1e-9), rv: R(100000), rt: R(10000), ct: C(100e-9),
            q3: NPN, q4: NPN, rc3: R(2200), rc4: R(2200), c3: EL(4.7e-6), c4: EL(4.7e-6), rb3: R(33000), rb4: R(33000),
            dm: D, rm: R(33000),
            co: EL(47e-6), rs: R(47), spk: ['speaker', { ohms: 8 }] },
        nets: [
            ['bat.pos', 'rc1.a', 'rc2.a', 'rset.a', 'u.vs', 'rv.a', 'rc3.a', 'rc4.a', 'rb3.a', 'rb4.a'],
            ['rc1.b', 'red.anode'], ['rc2.b', 'green.anode'],
            ['red.cathode', 'q1.collector', 'x1.a', 'rbk.a'], ['green.cathode', 'q2.collector', 'x2.a'],
            ['x1.b', 'q2.base'], ['x2.b', 'q1.base', 'cb.pos', 'rds.b', 'reset.a'],
            ['rset.b', 'wire.a', 'ds.anode'], ['ds.cathode', 'rds.a'],
            ['rbk.b', 'qk.base'],
            ['u.inp', 'rh.b', 'cf.b', 'rv.b', 'qk.collector'],
            ['u.vout', 'rh.a', 'cf.a', 'rt.a', 'co.pos'], ['u.inn', 'rt.b', 'ct.a', 'rm.a'],
            ['rm.b', 'dm.anode'], ['dm.cathode', 'q4.collector', 'rc4.b', 'c4.pos'],
            ['rc3.b', 'q3.collector', 'c3.pos'], ['c3.neg', 'q4.base', 'rb4.b'], ['c4.neg', 'q3.base', 'rb3.b'],
            ['co.neg', 'rs.a'], ['rs.b', 'spk.a'],
            ['bat.neg', 'q1.emitter', 'q2.emitter', 'cb.neg', 'wire.b', 'reset.b', 'qk.emitter', 'u.gnd', 'ct.b',
                'q3.emitter', 'q4.emitter', 'spk.b'],
        ],
        open: ['u.gain1', 'u.gain8', 'u.bypass'],
    },

    // Toggle flip-flop with steering diodes, and a coin toss. Q1 (red) and
    // Q2 (green) are cross-coupled (22 k / 27 k, 1 nF speed-up capacitors).
    // The trigger line T idles high; each falling edge on it reaches both
    // bases through 10 nF, but only through the diode whose cathode node
    // sits LOW — the one on the side that conducts (47 kΩ ties each steering
    // node to its own collector). So each falling edge turns off whichever
    // transistor is on: one toggle per edge. STEP pulls T to ground by hand.
    // TOSS releases an LM386 relaxation oscillator (1 µF, about 55 Hz) whose
    // output drives T through 1 kΩ (47 nF on T keeps its edges from being
    // instantaneous): while TOSS is held the flip-flop toggles
    // 55 times a second; let go, and whichever LED is lit stays lit.
    'lab-steered-toggle-toss': {
        vcc: 9, supply: SUP,
        parts: { bat: BAT9, q1: NPN, q2: NPN, rc1: R(1000), red: LED('red'), rc2: R(1000), green: LED('green'),
            x1: R(22000), cx1: C(1e-9), x2: R(27000), cx2: C(1e-9),
            rtr: R(1000), ctr: C(47e-9), step: BTN, cs1: C(10e-9), rs1: R(47000), d1: D, cs2: C(10e-9), rs2: R(47000), d2: D,
            u: LM386, rh: R(47000), cf: C(1e-9), rv: R(100000), rt: R(10000), ct: EL(1e-6),
            rk: R(47000), qk: NPN, toss: BTN },
        nets: [
            ['bat.pos', 'rc1.a', 'rc2.a', 'u.vs', 'rv.a', 'rk.a'],
            ['rc1.b', 'red.anode'], ['rc2.b', 'green.anode'],
            ['red.cathode', 'q1.collector', 'x1.a', 'cx1.a', 'rs1.a'], ['green.cathode', 'q2.collector', 'x2.a', 'cx2.a', 'rs2.a'],
            ['x1.b', 'cx1.b', 'q2.base', 'd2.anode'], ['x2.b', 'cx2.b', 'q1.base', 'd1.anode'],
            ['u.vout', 'rh.a', 'cf.a', 'rt.a', 'rtr.a'], ['u.inp', 'rh.b', 'cf.b', 'rv.b'], ['u.inn', 'rt.b', 'ct.pos', 'qk.collector'],
            ['rk.b', 'qk.base', 'toss.a'],
            ['rtr.b', 'ctr.a', 'step.a', 'cs1.a', 'cs2.a'], ['cs1.b', 'rs1.b', 'd1.cathode'], ['cs2.b', 'rs2.b', 'd2.cathode'],
            ['bat.neg', 'q1.emitter', 'q2.emitter', 'ctr.b', 'step.b', 'u.gnd', 'ct.neg', 'qk.emitter', 'toss.b'],
        ],
        open: ['u.gain1', 'u.gain8', 'u.bypass'],
    },

    // Supply watchdog with an emitter-coupled Schmitt trigger. The pot
    // across the battery hands Q1's base a fraction of the battery voltage
    // less two diode drops (a nearly fixed 1.2 V), so that base falls
    // faster than the battery. Q1 and Q2 share 470 Ω; Q1's collector feeds
    // Q2's base through 10 k / 22 k. While the battery is good Q1 conducts
    // and Q2 is off; when Q1's base falls below the trigger point Q2 takes
    // the current and the yellow LED warns. Q2's current through the shared
    // resistor raises the emitters, so the way back needs a clearly higher
    // input: hysteresis.
    'lab-schmitt-supply-watch': {
        vcc: 9, supply: SUP,
        parts: { bat: ['vsource', { volts: 9 }], pot: POT(10000, 0.6), zref: LED('red'), da: D, db: D, rin: R(10000),
            q1: NPN, q2: NPN, rc1: R(2200), rd1: R(10000), rd2: R(8200), re: R(1000), rc2: R(1000), warn: LED('yellow') },
        nets: [
            ['bat.pos', 'pot.a', 'rc1.a', 'rc2.a'],
            ['pot.wiper', 'zref.anode'], ['zref.cathode', 'da.anode'], ['da.cathode', 'db.anode'], ['db.cathode', 'rin.a'], ['rin.b', 'q1.base'],
            ['q1.collector', 'rc1.b', 'rd1.a'], ['rd1.b', 'rd2.a', 'q2.base'],
            ['q1.emitter', 'q2.emitter', 're.a'],
            ['rc2.b', 'warn.anode'], ['warn.cathode', 'q2.collector'],
            ['bat.neg', 'pot.b', 'rd2.b', 're.b'],
        ],
    },

    // Parking light that switches on at dusk without flickering. A
    // phototransistor into 22 kΩ turns the light on the bench into a
    // voltage; an emitter-coupled Schmitt trigger (two NPN, shared 470 Ω)
    // decides "light" or "dark" with hysteresis; an LM386 used as an
    // inverting comparator (its + input held at 3 V by 100 kΩ from +9 V
    // against its own 50 kΩ) drives the white parking light. Dark: Q2
    // conducts, its collector is low, the amplifier's output goes high and
    // the light is on.
    'lab-dusk-parking-light': {
        vcc: 9, supply: SUP,
        parts: { bat: BAT9, pt: ['phototransistor', { iMax: 0.0005, light: 0.5 }], rl: R(22000), rin: R(10000),
            q1: NPN, q2: NPN, rc1: R(4700), rd1: R(10000), rd2: R(22000), re: R(470), rc2: R(4700),
            rs: R(22000), u: LM386, rv: R(100000), rlamp: R(330), lamp: LED('white') },
        nets: [
            ['bat.pos', 'pt.collector', 'rc1.a', 'rc2.a', 'u.vs', 'rv.a'],
            ['pt.emitter', 'rl.a', 'rin.a'], ['rin.b', 'q1.base'],
            ['q1.collector', 'rc1.b', 'rd1.a'], ['rd1.b', 'rd2.a', 'q2.base'],
            ['q1.emitter', 'q2.emitter', 're.a'],
            ['q2.collector', 'rc2.b', 'rs.a'], ['rs.b', 'u.inn'], ['rv.b', 'u.inp'],
            ['u.vout', 'rlamp.a'], ['rlamp.b', 'lamp.anode'],
            ['bat.neg', 'rl.b', 'rd2.b', 're.b', 'u.gnd', 'lamp.cathode'],
        ],
        open: ['u.gain1', 'u.gain8', 'u.bypass'],
    },

    // Automatic headlight dipping. A transistor flip-flop: Q2 (green,
    // dipped beam) conducts at switch-on (1 µF on Q1's base). HIGH BEAM
    // grounds Q2's base: Q1 takes over and the blue high-beam LED lights.
    // A phototransistor from Q1's base to ground watches the road: the
    // headlights of an oncoming car (its light slider up) pull Q1's base
    // low, Q2 takes over again — dipped. The base drive through 27 kΩ is
    // about 0.23 mA, so the phototransistor (1 mA at full light) needs a
    // fifth of full light to reset it; dusk does not.
    'lab-auto-dip-beam': {
        vcc: 9, supply: SUP,
        parts: { bat: BAT9, q1: NPN, q2: NPN, rc1: R(470), high: LED('blue'), rc2: R(1000), dip: LED('green'),
            x1: R(22000), x2: R(27000), cb: C(1e-6), set: BTN, pt: ['phototransistor', { iMax: 0.001, light: 0 }] },
        nets: [
            ['bat.pos', 'rc1.a', 'rc2.a'], ['rc1.b', 'high.anode'], ['rc2.b', 'dip.anode'],
            ['high.cathode', 'q1.collector', 'x1.a'], ['dip.cathode', 'q2.collector', 'x2.a'],
            ['x1.b', 'q2.base', 'set.a'], ['x2.b', 'q1.base', 'pt.collector', 'cb.a'],
            ['bat.neg', 'q1.emitter', 'q2.emitter', 'set.b', 'pt.emitter', 'cb.b'],
        ],
    },

    // A current mirror as a thermometer. Q1 (diode-connected, 82 kΩ from
    // +9 V) sets about 0.1 mA; Q2 shares its base voltage, so at equal
    // temperatures it carries the same. Each transistor sits in its own
    // surroundings (a Temperature slider each). A warmer Q2 — or a colder
    // Q1 — needs less base-emitter voltage for the same current (−2 mV/K), so
    // Q2 conducts more and its collector, fed through 4.7 kΩ and the 22 kΩ
    // trimmer, falls. Below about 1 V it no longer drives the kill NPN on
    // the LM386's + input, and the alarm tone sounds. Both transistors
    // warmed alike: nothing changes — the mirror cancels drift.
    'lab-mirror-thermo-alarm': {
        vcc: 9, supply: SUP,
        parts: { bat: BAT9, r1: R(82000), q1: NPN_EM({ surroundC: 25, thermalTau: 1 }), q2: NPN_EM({ surroundC: 25, thermalTau: 1 }),
            r2: R(4700), trim: POT(22000, 0.5), rb: R(100000), qk: NPN,
            u: LM386, rh: R(47000), cf: C(1e-9), rv: R(100000), rt: R(10000), ct: C(100e-9),
            co: EL(47e-6), rs: R(47), spk: ['speaker', { ohms: 8 }] },
        nets: [
            ['bat.pos', 'r1.a', 'r2.a', 'rv.a', 'u.vs'],
            ['r1.b', 'q1.collector', 'q1.base', 'q2.base'], ['r2.b', 'trim.a'], ['trim.wiper', 'trim.b', 'q2.collector', 'rb.a'],
            ['rb.b', 'qk.base'], ['u.inp', 'rh.b', 'cf.b', 'rv.b', 'qk.collector'],
            ['u.vout', 'rh.a', 'cf.a', 'rt.a', 'co.pos'], ['u.inn', 'rt.b', 'ct.a'],
            ['co.neg', 'rs.a'], ['rs.b', 'spk.a'],
            ['bat.neg', 'q1.emitter', 'q2.emitter', 'qk.emitter', 'u.gnd', 'ct.b', 'spk.b'],
        ],
        open: ['u.gain1', 'u.gain8', 'u.bypass'],
    },

    // Freezer watchdog. The same mirror with a diode under each emitter:
    // the reference diode under Q1 sits on the bench, the sensor diode under
    // Q2 in the freezer (Temperature slider, −10 °C as built). A colder
    // sensor diode drops more, so Q2 carries less than Q1, and its collector
    // load (68 k plus half the 22 k trimmer) leaves the collector high enough
    // to keep the kill NPN on and the tone off. When the freezer warms past a
    // few degrees the sensor diode's drop shrinks, Q2's current grows, its
    // collector falls and the alarm sounds. (Plain diodes: their drop follows
    // their own temperature.)
    'lab-freezer-diode-alarm': {
        vcc: 9, supply: SUP,
        parts: { bat: BAT9, r1: R(47000), q1: NPN_EM(), q2: NPN_EM(), dr: ['diode', {}], dsense: ['diode', { surroundC: -10, thermalTau: 1 }],
            r2: R(68000), trim: POT(22000, 0.5), rb: R(100000), qk: NPN,
            u: LM386, rh: R(47000), cf: C(1e-9), rv: R(100000), rt: R(10000), ct: C(100e-9),
            co: EL(47e-6), rs: R(47), spk: ['speaker', { ohms: 8 }] },
        nets: [
            ['bat.pos', 'r1.a', 'r2.a', 'rv.a', 'u.vs'],
            ['r1.b', 'q1.collector', 'q1.base', 'q2.base'], ['q1.emitter', 'dr.anode'], ['q2.emitter', 'dsense.anode'],
            ['r2.b', 'trim.a'], ['trim.wiper', 'trim.b', 'q2.collector', 'rb.a'],
            ['rb.b', 'qk.base'], ['u.inp', 'rh.b', 'cf.b', 'rv.b', 'qk.collector'],
            ['u.vout', 'rh.a', 'cf.a', 'rt.a', 'co.pos'], ['u.inn', 'rt.b', 'ct.a'],
            ['co.neg', 'rs.a'], ['rs.b', 'spk.a'],
            ['bat.neg', 'dr.cathode', 'dsense.cathode', 'qk.emitter', 'u.gnd', 'ct.b', 'spk.b'],
        ],
        open: ['u.gain1', 'u.gain8', 'u.bypass'],
    },

    // The LM386 as a memory and as a monoflop. Its − input sits at 3 V
    // (100 kΩ from +9 V against its own 50 kΩ). The slide switch closes the
    // loop from the output to the + input through 47 kΩ (left: a latch — the
    // + input then sits at 4.2 V with the output high, 0.5 V with it low) or
    // through 4.7 µF (right: a monoflop — the step the output makes leaks
    // away through the input's 50 kΩ, and a quarter of a second later the
    // output falls back). A Darlington touch sensor sets it: a fingertip
    // (2.2 MΩ) turns the pair on and its emitter lifts the + input through
    // 1 kΩ. RESET pulls the + input to ground. A diode keeps the + input
    // from being kicked far below ground when the monoflop falls back.
    'lab-amp-touch-latch': {
        vcc: 9, supply: SUP,
        parts: { bat: BAT9, touch: BTN, skin: R(2200000), qa: NPN, qb: NPN, rset: R(1000),
            u: LM386, rv: R(100000), mode: ['slide_switch', { position: 0 }], rf: R(47000), cfb: EL(4.7e-6), dc: D,
            reset: BTN, rl: R(1000), led: LED('red') },
        nets: [
            ['bat.pos', 'touch.a', 'qa.collector', 'qb.collector', 'u.vs', 'rv.a'],
            ['touch.b', 'skin.a'], ['skin.b', 'qa.base'], ['qa.emitter', 'qb.base'], ['qb.emitter', 'rset.a'],
            ['rv.b', 'u.inn'],
            ['u.vout', 'rf.a', 'cfb.pos', 'rl.a'], ['rf.b', 'mode.a'], ['cfb.neg', 'mode.b'],
            ['mode.com', 'rset.b', 'u.inp', 'dc.cathode', 'reset.a'],
            ['rl.b', 'led.anode'],
            ['bat.neg', 'u.gnd', 'dc.anode', 'reset.b', 'led.cathode'],
        ],
        open: ['u.gain1', 'u.gain8', 'u.bypass'],
    },
    // Clap on, clap off. A loudspeaker is the microphone; an LM386 at gain
    // 200 (10 µF across pins 1–8, the sensitivity pot in series with it)
    // lifts a clap's few millivolts. 1 µF and two germanium diodes pump the
    // burst into 1 µF, which turns on a pulse NPN for as long as the clap
    // lasts: the trigger line of a diode-steered toggle flip-flop falls
    // ONCE per clap, however many cycles the clap has. Each clap toggles
    // the flip-flop. The relay driver hangs from Q2's collector: while Q2
    // conducts (green, as at switch-on) the driver is off; one clap turns Q1
    // on (red), Q2's collector rises, the relay pulls in and its contact
    // lights the lamp; the next clap puts it out.
    'lab-clap-toggle-relay': {
        vcc: 9, supply: SUP,
        parts: { bat: BAT9, mic: ['speaker', { ohms: 8, soundDb: 0, soundWave: 'noise' }],
            u: LM386, cg: EL(10e-6), sens: POT(10000, 1), cp: C(1e-6), dp1: ['diode', { part: '1N34A' }], dp2: ['diode', { part: '1N34A' }],
            ch: C(220e-9), rdis: R(100000), rbp: R(4700), qp: NPN, rtr: R(10000),
            cs1: C(47e-9), rs1: R(470000), d1: D, cs2: C(47e-9), rs2: R(470000), d2: D,
            q1: NPN, q2: NPN, rc1: R(1000), red: LED('red'), rc2: R(1000), green: LED('green'),
            x1: R(22000), cx1: C(1e-9), x2: R(27000), cx2: C(1e-9),
            rk: R(22000), qr: NPN, k: ['relay', { coilR: 200 }], df: D,
            lamp: ['light_bulb', { ohms: 90, vRated: 9 }] },
        nets: [
            ['bat.pos', 'u.vs', 'rtr.a', 'rc1.a', 'rc2.a', 'k.coil_a', 'df.cathode', 'k.com'],
            ['mic.a', 'u.inp'], ['u.gain1', 'cg.pos'], ['cg.neg', 'sens.a'], ['sens.wiper', 'u.gain8'],
            ['u.vout', 'cp.a'], ['cp.b', 'dp1.cathode', 'dp2.anode'], ['dp2.cathode', 'ch.a', 'rdis.a', 'rbp.a'], ['rbp.b', 'qp.base'],
            ['qp.collector', 'rtr.b', 'cs1.a', 'cs2.a'], ['cs1.b', 'rs1.b', 'd1.cathode'], ['cs2.b', 'rs2.b', 'd2.cathode'],
            ['rc1.b', 'red.anode'], ['rc2.b', 'green.anode'],
            ['red.cathode', 'q1.collector', 'x1.a', 'cx1.a', 'rs1.a'], ['green.cathode', 'q2.collector', 'x2.a', 'cx2.a', 'rs2.a', 'rk.a'],
            ['x1.b', 'cx1.b', 'q2.base', 'd2.anode'], ['x2.b', 'cx2.b', 'q1.base', 'd1.anode'],
            ['rk.b', 'qr.base'], ['qr.collector', 'k.coil_b', 'df.anode'], ['k.no', 'lamp.a'],
            ['bat.neg', 'mic.b', 'u.gnd', 'u.inn', 'dp1.anode', 'ch.b', 'rdis.b', 'qp.emitter', 'q1.emitter', 'q2.emitter',
                'qr.emitter', 'lamp.b'],
        ],
        open: ['u.bypass', 'sens.b', 'k.nc'],
    },

    // Hearing-range tester. The LM386 relaxation oscillator with 22 nF and a
    // timing resistor of 1.2 kΩ plus a 25 kΩ rheostat: the knob sweeps the
    // tone from about 1 kHz up to about 15 kHz, past where most adults stop
    // hearing it.
    'lab-amp-audiometer': {
        vcc: 9, supply: SUP,
        parts: { bat: BAT9, u: LM386, rh: R(47000), cf: C(1e-9), rv: R(100000), rmin: R(1200), pitch: POT(25000, 0.5), ct: C(22e-9),
            co: EL(47e-6), rs: R(47), spk: ['speaker', { ohms: 8 }] },
        nets: [
            ['bat.pos', 'u.vs', 'rv.a'],
            ['u.vout', 'rh.a', 'cf.a', 'rmin.a', 'co.pos'], ['u.inp', 'rh.b', 'cf.b', 'rv.b'],
            ['rmin.b', 'pitch.a'], ['pitch.wiper', 'pitch.b', 'u.inn', 'ct.a'],
            ['co.neg', 'rs.a'], ['rs.b', 'spk.a'],
            ['bat.neg', 'u.gnd', 'ct.b', 'spk.b'],
        ],
        open: ['u.gain1', 'u.gain8', 'u.bypass'],
    },

    // A differential pair watches a charging capacitor. Q1's base is the
    // capacitor (47 µF charging through 47 kΩ from +9 V; the button empties
    // it), Q2's base the reference, half the supply from two 10 kΩ. They
    // share 1.5 kΩ; each collector has 2.2 kΩ to +9 V. Between the two
    // collectors: 1 kΩ and two LEDs back to back. Capacitor below half: Q2
    // takes the current, its collector is lower and the red LED (anode on
    // Q1's side) lights. At half both collectors sit level: both dark.
    // Above: green.
    'lab-diff-pair-charging': {
        vcc: 9, supply: SUP,
        parts: { bat: BAT9, rch: R(47000), cx: EL(47e-6), empty: BTN, rdis: R(100),
            rr1: R(10000), rr2: R(10000), q1: NPN_EM(), q2: NPN_EM(), re: R(820), rc1: R(1000), rc2: R(1000),
            rled: R(220), below: LED('red'), above: LED('green') },
        nets: [
            ['bat.pos', 'rch.a', 'rr1.a', 'rc1.a', 'rc2.a'],
            ['rch.b', 'cx.pos', 'empty.a', 'q1.base'], ['empty.b', 'rdis.a'],
            ['rr1.b', 'rr2.a', 'q2.base'], ['q1.emitter', 'q2.emitter', 're.a'],
            ['q1.collector', 'rc1.b', 'below.anode', 'above.cathode'], ['below.cathode', 'above.anode', 'rled.a'],
            ['rled.b', 'q2.collector', 'rc2.b'],
            ['bat.neg', 'cx.neg', 'rdis.b', 'rr2.b', 're.b'],
        ],
    },

    // A differential pair as the input of the LM386: a very sensitive
    // comparator, and with feedback a blinker. Q1's base is the reference
    // (two 10 kΩ, half the supply); Q2's base is, through the slide switch,
    // either a pot across the supply (left) or a 47 µF capacitor that the
    // amplifier's own output charges through 47 kΩ (right). The collectors
    // (4.7 kΩ each) go to the amplifier's inputs: + from Q2, − from Q1, so
    // the output is high while the input is below the reference. 150 kΩ from
    // the output to the reference shifts it by about ±0.1 V with the output
    // — a little hysteresis. Right: the output charges the capacitor until
    // it passes the raised reference, flips low, discharges it past the
    // lowered one, flips high: the red and green LEDs blink in turn.
    'lab-diff-pair-amp': {
        vcc: 9, supply: SUP,
        parts: { bat: BAT9, rr1: R(10000), rr2: R(10000), rhy: R(150000), pot: POT(10000, 0.4),
            sel: ['slide_switch', { position: 0 }], rx: R(47000), cx: EL(47e-6),
            q1: NPN_EM(), q2: NPN_EM(), re: R(4700), rc1: R(4700), rc2: R(4700),
            u: LM386, r1: R(1000), red: LED('red'), r2: R(1000), green: LED('green') },
        nets: [
            ['bat.pos', 'rr1.a', 'pot.a', 'rc1.a', 'rc2.a', 'u.vs', 'r2.a'],
            ['rr1.b', 'rr2.a', 'rhy.b', 'q1.base'], ['pot.wiper', 'sel.a'], ['rx.b', 'cx.pos', 'sel.b'], ['sel.com', 'q2.base'],
            ['q1.emitter', 'q2.emitter', 're.a'],
            ['q1.collector', 'rc1.b', 'u.inn'], ['q2.collector', 'rc2.b', 'u.inp'],
            ['u.vout', 'rhy.a', 'rx.a', 'r1.a', 'green.cathode'], ['r1.b', 'red.anode'], ['r2.b', 'green.anode'],
            ['bat.neg', 'rr2.b', 'pot.b', 'cx.neg', 're.b', 'u.gnd', 'red.cathode'],
        ],
        open: ['u.gain1', 'u.gain8', 'u.bypass'],
    },

    // Struck note. The key charges 220 µF (through 10 Ω) that is the LM386
    // oscillator's whole supply. While the key is down the tone sounds at
    // full strength; let go and the capacitor alone feeds the amplifier: its
    // voltage sinks, the swing (0.9 V from each rail) and with it the
    // loudness shrink, and below about 4 V the amplifier stops. The pitch
    // hardly moves, because the thresholds are fractions of the supply.
    'lab-amp-struck-note': {
        vcc: 9, supply: SUP,
        parts: { bat: BAT9, key: BTN, rch: R(10), cs: EL(100e-6),
            u: LM386, rh: R(47000), cf: C(1e-9), rv: R(100000), rt: R(10000), ct: C(220e-9),
            co: EL(47e-6), rs: R(47), spk: ['speaker', { ohms: 8 }] },
        nets: [
            ['bat.pos', 'key.a'], ['key.b', 'rch.a'], ['rch.b', 'cs.pos', 'u.vs', 'rv.a'],
            ['u.vout', 'rh.a', 'cf.a', 'rt.a', 'co.pos'], ['u.inp', 'rh.b', 'cf.b', 'rv.b'], ['u.inn', 'rt.b', 'ct.a'],
            ['co.neg', 'rs.a'], ['rs.b', 'spk.a'],
            ['bat.neg', 'cs.neg', 'u.gnd', 'ct.b', 'spk.b'],
        ],
        open: ['u.gain1', 'u.gain8', 'u.bypass'],
    },
    // Phono-style preamplifier with equalising feedback. The function
    // generator stands in for the pickup (1 mV). Two common-emitter stages
    // (4.7 kΩ / 470 Ω, a gain of about 10 each) feed the LM386 (gain 20 with
    // pins 1 and 8 open). With the EQ switch closed, 2.2 kΩ and 22 nF in
    // series from the output (pin 5) to pin 1 parallel the chip's own 15 kΩ
    // feedback resistor wherever the capacitor conducts: the treble's gain
    // drops to about a quarter, while the bass keeps most of it.
    'lab-eq-preamp': {
        vcc: 9, supply: SUP,
        parts: { bat: BAT9, fg: ['function_gen', { wave: 'sine', freq: 100, amplitude: 0.001 }],
            c1: C(470e-9), ra1: R(100000), rb1: R(15000), q1: NPN, rc1: R(4700), re1: R(470),
            c2: C(470e-9), ra2: R(100000), rb2: R(15000), q2: NPN, rc2: R(4700), re2: R(470),
            c3: C(100e-9), u: LM386, req: R(2200), ceq: C(22e-9), eq: ['switch', { closed: true }],
            co: EL(220e-6), spk: ['speaker', { ohms: 8 }] },
        nets: [
            ['bat.pos', 'ra1.a', 'rc1.a', 'ra2.a', 'rc2.a', 'u.vs'],
            ['fg.out', 'c1.a'], ['c1.b', 'ra1.b', 'rb1.a', 'q1.base'], ['q1.emitter', 're1.a'],
            ['q1.collector', 'rc1.b', 'c2.a'], ['c2.b', 'ra2.b', 'rb2.a', 'q2.base'], ['q2.emitter', 're2.a'],
            ['q2.collector', 'rc2.b', 'c3.a'], ['c3.b', 'u.inp'],
            ['u.vout', 'req.a', 'co.pos'], ['req.b', 'ceq.a'], ['ceq.b', 'eq.a'], ['eq.b', 'u.gain1'],
            ['co.neg', 'spk.a'],
            ['bat.neg', 'fg.gnd', 'rb1.b', 're1.b', 'rb2.b', 're2.b', 'u.gnd', 'u.inn', 'spk.b'],
        ],
        open: ['u.gain8', 'u.bypass'],
    },

    // Baby monitor. A loudspeaker in the nursery is the microphone; two
    // self-biased common-emitter stages (10 kΩ, 1 MΩ from collector to
    // base; the second with 1 kΩ in its emitter) and the LM386 (gain 20)
    // lift a baby's voice (60 dB SPL at the speaker), and an
    // earphone (250 Ω) on long leads plays it in the next room. Carry the
    // earphone back to the loudspeaker and the sound it makes is picked up
    // again, louder than it started: below about ten centimetres the loop
    // howls.
    'lab-amp-baby-monitor': {
        vcc: 9, supply: SUP,
        parts: { bat: BAT9, mic: ['speaker', { ohms: 8, soundDb: 60, soundWave: 'voice', soundHz: 300, hears: '@ep', distanceCm: 100 }],
            cin: C(220e-9), q1: NPN, rc1: R(10000), rf1: R(1000000), c12: C(220e-9), q2: NPN, rc2: R(10000), re2: R(1000), rf2: R(1000000),
            c3: EL(1e-6), u: LM386, co: EL(100e-6), ep: ['earphone', { type: 'magnetic', ohms: 250, henrys: 0.02 }] },
        nets: [
            ['bat.pos', 'rc1.a', 'rc2.a', 'u.vs'],
            ['mic.a', 'cin.a'], ['cin.b', 'q1.base', 'rf1.b'], ['q1.collector', 'rc1.b', 'rf1.a', 'c12.a'],
            ['c12.b', 'q2.base', 'rf2.b'], ['q2.collector', 'rc2.b', 'rf2.a', 'c3.pos'], ['c3.neg', 'u.inp'],
            ['u.vout', 'co.pos'], ['co.neg', 'ep.a'],
            ['q2.emitter', 're2.a'],
            ['bat.neg', 'mic.b', 'q1.emitter', 're2.b', 'u.gnd', 'u.inn', 'ep.b'],
        ],
        open: ['u.gain1', 'u.gain8', 'u.bypass'],
    },

    // Infrared light barrier. An IR LED (330 Ω, about 23 mA) shines across
    // 10 cm of air at a phototransistor whose emitter current through 22 kΩ
    // is the receiver's signal. The light path's knob is the hand in the
    // beam (0 clear, 1 fully blocked). Slide switch left: the signal itself
    // drives the kill NPN on the LM386 oscillator's + input — beam intact,
    // silence; beam broken, alarm. Right: an inverter NPN comes between —
    // the tone sounds while the beam is intact and stops when it is broken.
    'lab-ir-barrier-alarm': {
        vcc: 9, supply: SUP,
        parts: { bat: BAT9, rtx: R(330), irled: ['ir_transmitter', {}], pt: ['phototransistor', {}], rl: R(22000),
            beam: ['light_path', { from: '@irled', to: '@pt', medium: 'air', distanceCm: 10, knob: 'blocked', knobMin: 0, knobMax: 1 }],
            ri: R(47000), qi: NPN, rci: R(22000), sel: ['slide_switch', { position: 0 }], rbk: R(47000), qk: NPN,
            u: LM386, rh: R(47000), cf: C(1e-9), rv: R(100000), rt: R(10000), ct: C(100e-9),
            co: EL(47e-6), rs: R(47), spk: ['speaker', { ohms: 8 }] },
        nets: [
            ['bat.pos', 'rtx.a', 'pt.collector', 'rci.a', 'u.vs', 'rv.a'],
            ['rtx.b', 'irled.anode'], ['pt.emitter', 'rl.a', 'ri.a', 'sel.a'], ['ri.b', 'qi.base'], ['qi.collector', 'rci.b', 'sel.b'],
            ['sel.com', 'rbk.a'], ['rbk.b', 'qk.base'],
            ['u.inp', 'rh.b', 'cf.b', 'rv.b', 'qk.collector'],
            ['u.vout', 'rh.a', 'cf.a', 'rt.a', 'co.pos'], ['u.inn', 'rt.b', 'ct.a'],
            ['co.neg', 'rs.a'], ['rs.b', 'spk.a'],
            ['bat.neg', 'irled.cathode', 'rl.b', 'qi.emitter', 'qk.emitter', 'u.gnd', 'ct.b', 'spk.b'],
        ],
        open: ['u.gain1', 'u.gain8', 'u.bypass'],
    },

    // Infrared remote switch. The handset: SEND flashes an IR LED (100 Ω,
    // about 75 mA while pressed, as a remote's LED is pulsed hard). The
    // receiver, 10 cm away: a phototransistor from +9 V feeds 4.7 kΩ into
    // the + input of an LM386 wired as a monoflop (− input at 3 V from
    // 100 kΩ against its own 50 kΩ; 2.2 µF from the output back to the +
    // input; 100 nF from the + input to ground makes it wake up low; a diode
    // stops the + input going far below ground). The light
    // lifts the + input over the − input, the output jumps high, the
    // capacitor holds it there for a quarter of a second after the light
    // has gone, and it falls back; that falling edge, through 1 kΩ and
    // 47 nF, toggles a diode-steered flip-flop. One press, one toggle:
    // the red LED (the "lamp") goes on, the next press puts it out.
    'lab-ir-flash-toggle': {
        vcc: 9, supply: SUP,
        parts: { bat: BAT9, send: BTN, rtx: R(100), irled: ['ir_transmitter', {}], pt: ['phototransistor', {}], rtrig: R(4700),
            link: ['light_path', { from: '@irled', to: '@pt', medium: 'air', distanceCm: 10, knob: 'distanceCm', knobMin: 5, knobMax: 60 }],
            u: LM386, rv: R(100000), cfb: EL(2.2e-6), cg: C(100e-9), dc: D,
            rtr: R(1000), ctr: C(47e-9), cs1: C(10e-9), rs1: R(47000), d1: D, cs2: C(10e-9), rs2: R(47000), d2: D,
            q1: NPN, q2: NPN, rc1: R(1000), red: LED('red'), rc2: R(1000), green: LED('green'),
            x1: R(22000), cx1: C(1e-9), x2: R(27000), cx2: C(1e-9) },
        nets: [
            ['bat.pos', 'send.a', 'pt.collector', 'u.vs', 'rv.a', 'rc1.a', 'rc2.a'],
            ['send.b', 'rtx.a'], ['rtx.b', 'irled.anode'], ['pt.emitter', 'rtrig.a'],
            ['rtrig.b', 'u.inp', 'cfb.neg', 'cg.a', 'dc.cathode'], ['rv.b', 'u.inn'], ['u.vout', 'cfb.pos', 'rtr.a'],
            ['rtr.b', 'ctr.a', 'cs1.a', 'cs2.a'], ['cs1.b', 'rs1.b', 'd1.cathode'], ['cs2.b', 'rs2.b', 'd2.cathode'],
            ['rc1.b', 'red.anode'], ['rc2.b', 'green.anode'],
            ['red.cathode', 'q1.collector', 'x1.a', 'cx1.a', 'rs1.a'], ['green.cathode', 'q2.collector', 'x2.a', 'cx2.a', 'rs2.a'],
            ['x1.b', 'cx1.b', 'q2.base', 'd2.anode'], ['x2.b', 'cx2.b', 'q1.base', 'd1.anode'],
            ['bat.neg', 'irled.cathode', 'cg.b', 'dc.anode', 'u.gnd', 'ctr.b', 'q1.emitter', 'q2.emitter'],
        ],
        open: ['u.gain1', 'u.gain8', 'u.bypass'],
    },

    // A tone carried on infrared. Transmitter: the LM386 oscillator (100 nF,
    // about 600 Hz), held off by its kill NPN until the Morse KEY grounds
    // that transistor's base; its output flashes an IR LED through 220 Ω.
    // Receiver, across the light path (knob: 5 to 60 cm): a phototransistor
    // with 10 kΩ to +9 V, 100 nF into a self-biased common-emitter NPN
    // (4.7 kΩ, 470 kΩ), and an earphone through 10 µF.
    'lab-ir-tone-link': {
        vcc: 9, supply: SUP,
        parts: { bat: BAT9, rk: R(47000), key: BTN, qk: NPN,
            u: LM386, rh: R(47000), cf: C(1e-9), rv: R(100000), rt: R(10000), ct: C(100e-9),
            rtx: R(220), irled: ['ir_transmitter', {}],
            link: ['light_path', { from: '@irled', to: '@pt', medium: 'air', distanceCm: 30, knob: 'distanceCm', knobMin: 5, knobMax: 60 }],
            pt: ['phototransistor', {}], rl: R(10000), cc: C(100e-9), q1: NPN, rc: R(4700), rf: R(470000), co: EL(10e-6),
            ear: ['earphone', { type: 'magnetic', ohms: 2000, henrys: 0.1 }] },
        nets: [
            ['bat.pos', 'rk.a', 'u.vs', 'rv.a', 'rl.a', 'rc.a'],
            ['rk.b', 'qk.base', 'key.a'], ['u.inp', 'rh.b', 'cf.b', 'rv.b', 'qk.collector'],
            ['u.vout', 'rh.a', 'cf.a', 'rt.a', 'rtx.a'], ['u.inn', 'rt.b', 'ct.a'], ['rtx.b', 'irled.anode'],
            ['rl.b', 'pt.collector', 'cc.a'], ['cc.b', 'q1.base', 'rf.b'], ['q1.collector', 'rc.b', 'rf.a', 'co.pos'], ['co.neg', 'ear.a'],
            ['bat.neg', 'key.b', 'qk.emitter', 'u.gnd', 'ct.b', 'irled.cathode', 'pt.emitter', 'q1.emitter', 'ear.b'],
        ],
        open: ['u.gain1', 'u.gain8', 'u.bypass'],
    },

    // Pulsed infrared and a wireless dimmer. The LM386 oscillator's timing
    // capacitor (470 nF) charges through one diode and one side of the
    // DUTY pot, and discharges through the other diode and the other side:
    // the wiper sets how long the output stays high, the period stays about
    // the same. While the output is high the IR LED flashes (220 Ω). The
    // receiver, 3 cm away, is a phototransistor emitter follower (10 kΩ);
    // each flash charges 10 µF through a diode and 1 kΩ, 10 kΩ drains it
    // between flashes, and an emitter follower turns that held voltage into
    // the green LED's current. Short flashes, little average power and a
    // dim LED; long flashes, a bright one.
    'lab-ir-pulse-dimmer': {
        vcc: 9, supply: SUP,
        parts: { bat: BAT9, u: LM386, rh: R(47000), cf: C(1e-9), rv: R(100000),
            duty: POT(10000, 0.2), ra: R(1000), da: D, db: D, rb: R(1000), ct: C(470e-9),
            rtx: R(220), irled: ['ir_transmitter', {}],
            link: ['light_path', { from: '@irled', to: '@pt', medium: 'air', distanceCm: 3 }],
            pt: ['phototransistor', {}], rl: R(10000), dh: D, rhold: R(1000), ch: EL(10e-6), rdis: R(10000),
            qf: NPN, rled: R(470), led: LED('green') },
        nets: [
            ['bat.pos', 'u.vs', 'rv.a', 'pt.collector', 'qf.collector'],
            ['u.vout', 'rh.a', 'cf.a', 'duty.wiper', 'rtx.a'], ['u.inp', 'rh.b', 'cf.b', 'rv.b'],
            ['duty.b', 'ra.a'], ['ra.b', 'da.anode'], ['da.cathode', 'u.inn', 'ct.a', 'db.anode'], ['db.cathode', 'rb.a'], ['rb.b', 'duty.a'],
            ['rtx.b', 'irled.anode'],
            ['pt.emitter', 'rl.a', 'dh.anode'], ['dh.cathode', 'rhold.a'], ['rhold.b', 'ch.pos', 'rdis.a', 'qf.base'],
            ['qf.emitter', 'rled.a'], ['rled.b', 'led.anode'],
            ['bat.neg', 'u.gnd', 'ct.b', 'irled.cathode', 'rl.b', 'ch.neg', 'rdis.b', 'led.cathode'],
        ],
        open: ['u.gain1', 'u.gain8', 'u.bypass'],
    },

    // Music on an infrared beam. The function generator stands in for a
    // music player (440 Hz, 50 mV). The LM386 (gain 20) adds it to its
    // half-supply output, and 150 Ω from the output feeds the IR LED: about
    // 21 mA at rest, more and less with the music — its brightness follows
    // the waveform. Receiver: a phototransistor with 10 kΩ to +9 V, 100 nF
    // into a common-emitter stage (10 kΩ, 2.2 kΩ in the emitter, biased by
    // 1 MΩ from its collector: a gain of about 4.5), an emitter follower,
    // and the earphone through 1 µF.
    'lab-ir-music-link': {
        vcc: 9, supply: SUP,
        parts: { bat: BAT9, fg: ['function_gen', { wave: 'sine', freq: 440, amplitude: 0.05 }], cin: EL(10e-6),
            u: LM386, rtx: R(150), irled: ['ir_transmitter', {}],
            link: ['light_path', { from: '@irled', to: '@pt', medium: 'air', distanceCm: 20, knob: 'distanceCm', knobMin: 5, knobMax: 100 }],
            pt: ['phototransistor', {}], rl: R(10000), c1: C(100e-9), q1: NPN, rc1: R(10000), re1: R(2200), rf1: R(1000000),
            q2: NPN, re2: R(4700), co: EL(1e-6),
            ear: ['earphone', { type: 'magnetic', ohms: 2000, henrys: 0.1 }] },
        nets: [
            ['bat.pos', 'u.vs', 'rl.a', 'rc1.a', 'q2.collector'],
            ['fg.out', 'cin.neg'], ['cin.pos', 'u.inp'], ['u.vout', 'rtx.a'], ['rtx.b', 'irled.anode'],
            ['rl.b', 'pt.collector', 'c1.a'], ['c1.b', 'q1.base', 'rf1.b'], ['q1.collector', 'rc1.b', 'rf1.a', 'q2.base'],
            ['q2.emitter', 're2.a', 'co.pos'], ['co.neg', 'ear.a'],
            ['q1.emitter', 're1.a'],
            ['bat.neg', 'fg.gnd', 'u.gnd', 'u.inn', 'irled.cathode', 'pt.emitter', 're1.b', 're2.b', 'ear.b'],
        ],
        open: ['u.gain1', 'u.gain8', 'u.bypass'],
    },

    // An astable whose second transistor is a phototransistor and whose
    // second cross-coupling is light. Q1 (green LED in its collector) is
    // the ordinary half: 100 kΩ from +9 V to its base, 10 µF from the
    // phototransistor's collector (47 kΩ to +9 V) to that base. The other
    // half is the phototransistor; what would be its base current is the light of an
    // IR LED 2 cm away (with a red LED in series so you can see it), fed
    // through 4.7 kΩ from +9 V and coupled to Q1's collector through 47 µF.
    // Q1 turning on drags the LED node far below ground: dark, the
    // phototransistor lets go, its collector rises. When 4.7 kΩ has
    // recharged the 47 µF the LED lights again, the phototransistor pulls
    // its collector down, the 10 µF kicks Q1 off, and Q1 waits for 100 kΩ
    // to recharge its base. Green and red take turns.
    'lab-optical-astable': {
        vcc: 9, supply: SUP,
        parts: { bat: BAT9, rc1: R(1000), green: LED('green'), q1: NPN, rb: R(100000), c1: EL(10e-6),
            rl: R(4700), c2: EL(47e-6), irled: ['ir_transmitter', {}], red: LED('red'),
            rp: R(47000), pt: ['phototransistor', {}],
            link: ['light_path', { from: '@irled', to: '@pt', medium: 'air', distanceCm: 2, knob: 'distanceCm', knobMin: 1, knobMax: 30 }] },
        nets: [
            ['bat.pos', 'rc1.a', 'rb.a', 'rl.a', 'rp.a'],
            ['rc1.b', 'green.anode'], ['green.cathode', 'q1.collector', 'c2.pos'],
            ['rl.b', 'c2.neg', 'irled.anode'], ['irled.cathode', 'red.anode'],
            ['rb.b', 'q1.base', 'c1.neg'], ['c1.pos', 'pt.collector', 'rp.b'],
            ['bat.neg', 'q1.emitter', 'red.cathode', 'pt.emitter'],
        ],
    },
};

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
