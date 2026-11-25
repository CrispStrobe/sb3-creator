/**
 * Netlists for the r10a lab benches, written by
 * `node scripts/gen-lab-circuits-4.mjs --set=r10a`.
 *
 * Discrete benches: NPN and PNP transistors, diodes, LEDs, a phototransistor,
 * passive parts and transducers, and nothing else. No op-amp, no timer chip,
 * no logic chip, no power-amplifier IC. Two of them have no transistor at all
 * (a capacitor charging and discharging through two LEDs, an LED lit through
 * a glass of water).
 *
 * Same shape as lab-benches-4.mjs: pure data, so test/lab-circuits-r10a.test.mjs
 * names parts by role. Ids follow benchIds (breadboard first, then the parts
 * in the order listed). A param written '@name' (a light path's from / to) is
 * resolved to that part's engine id at the end of this file.
 *
 * Temperature-sensing transistors use the Shockley junction model
 * (model: 'shockley'): the default piecewise junction is far steeper than a
 * real one, and VBE falls about 2 mV per kelvin only in the Shockley model.
 * Their surroundings (surroundC, the Temperature slider) relax into the
 * junction with a 1 s time constant so scenarios stay short.
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
const NPN_S = ['npn', { model: 'shockley', is: 1e-14, beta: 150, br: 1, n: 1 }];
const NPN_T = (extra = {}) => ['npn', { model: 'shockley', is: 1e-14, beta: 150, br: 1, n: 1, surroundC: 25, thermalTau: 1, ...extra }];
const BAT9 = ['vsource', { volts: 9, variant: '9v' }];
const POT = (ohms, position) => ['potentiometer', { ohms, position }];
const D = ['diode', { part: '1N4148' }];
const GE = ['diode', { part: '1N34A' }];
const BTN = ['button', {}];
const SW = (closed = false) => ['switch', { closed }];
const SLIDE = (position = 0) => ['slide_switch', { position }];
const COIL = ['ferrite_coil', {}];
const TUNE = (position) => ['tuning_cap', { minFarads: 10e-12, maxFarads: 500e-12, position }];

export const BENCHES = {
    // A capacitor's current flows both ways. The slide switch sends the
    // 470 µF electrolytic to +9 V (left, CHARGE) or to ground (right,
    // DISCHARGE) through 470 Ω and two LEDs wired anti-parallel: the red one
    // conducts the charging current, the green one the discharging current.
    // A magnetic earphone across the 470 Ω hears the current start: a click
    // at each throw. Built at CHARGE with the capacitor empty: switch-on
    // is the first charge.
    'lab-cap-two-way-leds': {
        vcc: 9, supply: SUP,
        parts: { bat: BAT9, sel: SLIDE(0), r: R(470), ep: ['earphone', { type: 'magnetic', ohms: 2000, henrys: 0.1 }],
            red: LED('red'), green: LED('green'), c: EL(470e-6) },
        nets: [
            ['bat.pos', 'sel.a'], ['sel.com', 'r.a', 'ep.a'], ['r.b', 'ep.b', 'red.anode', 'green.cathode'],
            ['red.cathode', 'green.anode', 'c.pos'],
            ['bat.neg', 'sel.b', 'c.neg'],
        ],
    },

    // Two bare wires dipped in a glass of water, in series with a red LED and
    // 470 Ω across 9 V. The slide switch is the glass: left, demineralised
    // water (500 kΩ between the wires); right, the same water with a pinch of
    // salt dissolved (300 Ω). The water is an electrolysis cell: an
    // electrolyte resistance plus the electrode interfaces, which pass current
    // only above about 1.7 V (and then make gas).
    'lab-salt-water-probe': {
        vcc: 9, supply: SUP,
        parts: { bat: BAT9, r: R(470), led: LED('red'), salt: SLIDE(0),
            pure: ['electrolysis_cell', { ohms: 500000, farads: 2e-6, onsetV: 1.7 }],
            brine: ['electrolysis_cell', { ohms: 300, farads: 2e-6, onsetV: 1.7 }] },
        nets: [
            ['bat.pos', 'r.a'], ['r.b', 'led.anode'], ['led.cathode', 'salt.com'],
            ['salt.a', 'pure.a'], ['salt.b', 'brine.a'],
            ['bat.neg', 'pure.b', 'brine.b'],
        ],
    },

    // An LED as a voltage reference. The red LED sits in the transistor's
    // emitter, kept lit by 2.2 kΩ from +9 V, so the emitter stands at its
    // forward voltage (about 1.8 V). The 10 kΩ pot across the battery feeds
    // the base through 4.7 kΩ: the green LED in the collector lights only
    // once the wiper is a base-emitter drop above the reference, about
    // 2.4 V: just over a quarter of the travel.
    'lab-led-reference-switch': {
        vcc: 9, supply: SUP,
        parts: { bat: BAT9, pot: POT(10000, 0.1), rb: R(4700), q: NPN, rref: R(2200), ref: LED('red'),
            rl: R(1000), led: LED('green') },
        nets: [
            ['bat.pos', 'pot.a', 'rref.a', 'rl.a'],
            ['pot.wiper', 'rb.a'], ['rb.b', 'q.base'], ['rref.b', 'q.emitter', 'ref.anode'],
            ['rl.b', 'led.anode'], ['led.cathode', 'q.collector'],
            ['bat.neg', 'pot.b', 'ref.cathode'],
        ],
    },

    // Delayed switch-on. Closing ON charges the 100 µF through 100 kΩ (47 kΩ
    // across it sets where it ends, about 2.9 V). The capacitor feeds a
    // Darlington pair through 1 MΩ, so the pair starts to conduct at about
    // 1.1 V and is fully on only some 0.6 V higher: the LED stays dark for
    // over a second and then fades up. Opening ON leaves the capacitor to
    // drain through the 47 kΩ: the LED holds for a second and fades out over
    // the next two. (Both transistors use the Shockley junction model; the
    // default piecewise junction switches so steeply that there is no fade.)
    'lab-darlington-delay-on': {
        vcc: 9, supply: SUP,
        parts: { bat: BAT9, on: SW(false), rch: R(100000), c: EL(100e-6), rdis: R(47000), rb: R(1000000),
            q1: NPN_S, q2: NPN_S, rl: R(470), led: LED('yellow') },
        nets: [
            ['bat.pos', 'on.a', 'rl.a', 'q1.collector'],
            ['on.b', 'rch.a'], ['rch.b', 'c.pos', 'rdis.a', 'rb.a'], ['rb.b', 'q1.base'], ['q1.emitter', 'q2.base'],
            ['rl.b', 'led.anode'], ['led.cathode', 'q2.collector'],
            ['bat.neg', 'c.neg', 'rdis.b', 'q2.emitter'],
        ],
    },

    // A transistor as a heat sensor that switches ON. Its base is held at the
    // edge of conduction by 10 kΩ against 680 Ω plus the SET rheostat; the
    // red LED is in its collector. Warm the transistor (the Temperature
    // slider: hot air from a hair dryer) and its base-emitter voltage falls
    // about 2 mV per degree at the same base voltage: the collector current
    // grows many times over and the LED comes on. Cool it and it goes out.
    'lab-npn-warm-on': {
        vcc: 9, supply: SUP,
        parts: { bat: BAT9, q: NPN_T(), rtop: R(10000), rbot: R(680), set: POT(500, 0.9), rl: R(1000), led: LED('red') },
        nets: [
            ['bat.pos', 'rtop.a', 'rl.a'],
            ['rtop.b', 'q.base', 'rbot.a'], ['rbot.b', 'set.a'],
            ['rl.b', 'led.anode'], ['led.cathode', 'q.collector'],
            ['bat.neg', 'q.emitter', 'set.wiper', 'set.b'],
        ],
    },

    // A matched transistor pair sharing one emitter resistor (470 Ω), both
    // bases on the same 3 V divider, one LED in each collector: they share
    // the tail current, about 5 mA, equally. Each transistor has its own
    // surroundings (its own Temperature slider). Warm one: its base-emitter
    // voltage falls, it takes the larger share and its LED brightens while
    // the other dims. Warm both alike: nothing changes; the pair cancels a
    // common temperature drift.
    'lab-pair-heat-balance': {
        vcc: 9, supply: SUP,
        parts: { bat: BAT9, rt: R(4700), rbt: R(2200), q1: NPN_T(), q2: NPN_T(), re: R(470),
            r1: R(470), red: LED('red'), r2: R(470), green: LED('green') },
        nets: [
            ['bat.pos', 'rt.a', 'r1.a', 'r2.a'],
            ['rt.b', 'rbt.a', 'q1.base', 'q2.base'],
            ['r1.b', 'red.anode'], ['red.cathode', 'q1.collector'],
            ['r2.b', 'green.anode'], ['green.cathode', 'q2.collector'],
            ['q1.emitter', 'q2.emitter', 're.a'],
            ['bat.neg', 'rbt.b', 're.b'],
        ],
    },

    // A flip-flop toggled by a torch. Two NPNs cross-coupled through 22 kΩ
    // (red LED on Q1, green on Q2). The phototransistor drives a switching
    // NPN whose collector is the trigger line: light falls on it, the line
    // drops, and the drop reaches both bases through 10 nF and a steering
    // diode each. Each diode's other end follows its own transistor's
    // collector through 47 kΩ, so only the conducting transistor's diode is
    // ready to pass the drop: that transistor is switched off and the
    // flip-flop changes over. Light off: the line rises and the diodes block.
    'lab-torch-toggle': {
        vcc: 9, supply: SUP,
        parts: { bat: BAT9, q1: NPN, q2: NPN, rc1: R(1000), red: LED('red'), rc2: R(1000), green: LED('green'),
            x1: R(22000), x2: R(22000), pt: ['phototransistor', { light: 0 }], rpe: R(10000), rps: R(10000), qs: NPN, rt: R(4700),
            c1: C(10e-9), s1: R(47000), d1: D, c2: C(10e-9), s2: R(47000), d2: D, cq: C(10e-9) },
        nets: [
            ['bat.pos', 'rc1.a', 'rc2.a', 'pt.collector', 'rt.a'],
            ['rc1.b', 'red.anode'], ['red.cathode', 'q1.collector', 'x1.a', 's1.a'],
            ['rc2.b', 'green.anode'], ['green.cathode', 'q2.collector', 'x2.a', 's2.a'],
            ['x1.b', 'q2.base', 'd2.anode'], ['x2.b', 'q1.base', 'd1.anode', 'cq.a'],
            ['pt.emitter', 'rpe.a', 'rps.a'], ['rps.b', 'qs.base'],
            ['rt.b', 'qs.collector', 'c1.a', 'c2.a'],
            ['c1.b', 's1.b', 'd1.cathode'], ['c2.b', 's2.b', 'd2.cathode'],
            ['bat.neg', 'q1.emitter', 'q2.emitter', 'rpe.b', 'qs.emitter', 'cq.b'],
        ],
    },

    // Discrete monoflop. Q2 conducts at rest (100 kΩ into its base, green
    // LED); Q1 is off (red LED). A trigger turns Q1 on: its collector drops,
    // the 10 µF carries the drop to Q2's base and Q2 turns off, which holds
    // Q1 on through 22 kΩ. The capacitor recharges through 100 kΩ until Q2
    // conducts again: about 0.7 s of red.
    //   TRIGGER slide switch, left: the button feeds Q1's base directly through
    //   10 kΩ: red stays on for as long as the button is held. Right: the button
    //   reaches the base through 100 nF (100 kΩ empties it): only the moment
    //   of pressing counts, and the pulse has the same length however long
    //   the button is held.
    //   DIODE switch (closed = bypassed): open, a diode sits in series with
    //   Q2's base, so Q2 needs one diode drop more before it conducts again
    //   and the pulse lasts longer.
    'lab-monoflop-diode-edge': {
        vcc: 9, supply: SUP,
        parts: { bat: BAT9, q1: NPN, q2: NPN, rc1: R(1000), red: LED('red'), rc2: R(1000), green: LED('green'),
            ct: EL(10e-6), rt: R(100000), dq: D, bypass: SW(true), rf: R(22000), rbg: R(47000),
            go: BTN, mode: SLIDE(0), rdir: R(10000), cedge: C(100e-9), redge: R(100000) },
        nets: [
            ['bat.pos', 'rc1.a', 'rc2.a', 'rt.a', 'go.a'],
            ['rc1.b', 'red.anode'], ['red.cathode', 'q1.collector', 'ct.pos'],
            ['ct.neg', 'rt.b', 'dq.anode', 'bypass.a'], ['dq.cathode', 'bypass.b', 'q2.base'],
            ['rc2.b', 'green.anode'], ['green.cathode', 'q2.collector', 'rf.a'],
            ['rf.b', 'rbg.a', 'q1.base', 'rdir.b', 'cedge.b'],
            ['go.b', 'mode.com'], ['mode.a', 'rdir.a'], ['mode.b', 'cedge.a', 'redge.a'],
            ['bat.neg', 'q1.emitter', 'q2.emitter', 'rbg.b', 'redge.b'],
        ],
    },

    // Knock detector. A crystal earphone lies on the table as a vibration
    // pickup: each knock reaches it as a short dull thud (120 Hz, dying away
    // in about 20 ms; four knocks a second). The Sound slider is how hard you
    // knock. The crystal is a 10 nF capacitor electrically, a very high
    // source impedance at 120 Hz, so Q1 takes it first as an emitter
    // follower (base on two 1 MΩ, 10 kΩ emitter load). Q2 amplifies (10 kΩ
    // collector load, 1 MΩ from collector to base sets its bias). Two diodes
    // and 1 µF pump the amplified burst into 2.2 µF (47 kΩ lets it go again
    // in about a tenth of a second); that holding voltage drives Q3 through
    // 10 kΩ, and the LED in Q3's collector flashes at each hard knock.
    'lab-knock-flicker': {
        vcc: 9, supply: SUP,
        parts: { bat: BAT9,
            pick: ['earphone', { type: 'crystal', soundDb: 0, soundWave: 'ring', soundHz: 120, strikeHz: 4, decayS: 0.02, ringOnS: 1, ringOffS: 0 }],
            cin: C(100e-9), rb1: R(1000000), rb2: R(1000000), q1: NPN, re: R(10000), ck: EL(10e-6),
            q2: NPN, rb: R(1000000), rc: R(10000), cc: EL(1e-6), dg: D, dp: D, ch: EL(2.2e-6), rh: R(47000),
            rq: R(10000), q3: NPN, rl: R(470), led: LED('red') },
        nets: [
            ['bat.pos', 'rb1.a', 'q1.collector', 'rc.a', 'rl.a'],
            ['pick.a', 'cin.a'], ['cin.b', 'rb1.b', 'rb2.a', 'q1.base'], ['q1.emitter', 're.a', 'ck.pos'],
            ['ck.neg', 'q2.base', 'rb.b'], ['rb.a', 'rc.b', 'q2.collector', 'cc.pos'],
            ['cc.neg', 'dg.cathode', 'dp.anode'], ['dp.cathode', 'ch.pos', 'rh.a', 'rq.a'], ['rq.b', 'q3.base'],
            ['rl.b', 'led.anode'], ['led.cathode', 'q3.collector'],
            ['bat.neg', 'pick.b', 'rb2.b', 're.b', 'dg.anode', 'ch.neg', 'rh.b', 'q2.emitter', 'q3.emitter'],
        ],
    },

    // Metronome from a home-made unijunction. A PNP + NPN latch fires when
    // the timing capacitor passes about 88 % of the supply (the PNP base is
    // held at 82 % by 2.2 kΩ / 10 kΩ, plus its base-emitter drop) and dumps
    // the capacitor through the LED and the loudspeaker: one click and one
    // flash. The capacitor refills through 27 kΩ plus the 220 kΩ RATE
    // rheostat. With 4.7 µF (TONE slide switch left) that is a click every
    // quarter second to every 2.3 s, a metronome; with 47 nF (right) the
    // clicks run a hundred times faster and become a buzz of about 40 to
    // 340 Hz. 220 kΩ from the NPN's base to its emitter is a compromise: low
    // enough that the latch lets go again after each discharge even with the
    // knob up, high enough that the trickle through the full 247 kΩ can
    // still fire it with the knob down.
    'lab-relax-metronome': {
        vcc: 9, supply: SUP,
        parts: { bat: BAT9, rmin: R(27000), rate: POT(220000, 0.5), tone: SLIDE(0), cs: EL(4.7e-6), cf: C(47e-9),
            qp: PNP, qn: NPN, rd1: R(2200), rd2: R(10000), rbe: R(220000), led: LED('red'), re: R(1000), spk: ['speaker', { ohms: 8 }] },
        nets: [
            ['bat.pos', 'rmin.a', 'rd1.a'], ['rmin.b', 'rate.a'],
            ['rate.wiper', 'rate.b', 'tone.com', 'qp.emitter'], ['tone.a', 'cs.pos'], ['tone.b', 'cf.a'],
            ['rd1.b', 'rd2.a', 'qp.base', 'qn.collector'],
            ['qp.collector', 'qn.base', 'rbe.a'], ['qn.emitter', 'rbe.b', 'led.anode', 're.a'],
            ['led.cathode', 'spk.a'],
            ['bat.neg', 'cs.neg', 'cf.b', 'rd2.b', 'spk.b', 're.b'],
        ],
    },

    // Complementary monoflop, about 1 to 40 s. At rest the NPN and the PNP are both
    // off. START lifts the NPN's base: the NPN pulls the PNP's base down, the
    // PNP's collector jumps to +9 V and drives the NPN's base on through the
    // timing capacitor and 100 kΩ. That base current falls as the capacitor
    // charges; when it can no longer hold the pair on, both turn off. With
    // 4.7 µF (LONG open) under a second; LONG adds 220 µF, over half a
    // minute. 47 kΩ across the timing node empties the capacitor again
    // afterwards, so the next press runs as long as the first.
    // A third transistor shows the state: the red LED on the PNP's collector
    // is ACTIVE; the green LED, fed through 1 kΩ, is READY, and the third
    // transistor, driven from the PNP's collector, shorts it while the timer
    // runs.
    'lab-comp-monoflop': {
        vcc: 9, supply: SUP,
        parts: { bat: BAT9, start: BTN, rs: R(10000), qn: NPN, rbn: R(47000), rcn: R(10000), qp: PNP, rbe: R(47000),
            rt: R(100000), ct: EL(4.7e-6), long: SW(false), cl: EL(220e-6), rdis: R(47000),
            ra: R(1000), active: LED('red'), r3: R(22000), q3: NPN, rr: R(1000), ready: LED('green') },
        nets: [
            ['bat.pos', 'start.a', 'qp.emitter', 'rbe.a', 'rr.a'],
            ['start.b', 'rs.a'], ['rs.b', 'qn.base', 'rbn.a', 'rt.a'],
            ['qn.collector', 'rcn.a'], ['rcn.b', 'qp.base', 'rbe.b'],
            ['qp.collector', 'ct.pos', 'long.a', 'ra.a', 'r3.a', 'rdis.a'], ['long.b', 'cl.pos'],
            ['ct.neg', 'cl.neg', 'rt.b'],
            ['ra.b', 'active.anode'], ['r3.b', 'q3.base'],
            ['rr.b', 'ready.anode', 'q3.collector'],
            ['bat.neg', 'qn.emitter', 'rbn.b', 'rdis.b', 'active.cathode', 'ready.cathode', 'q3.emitter'],
        ],
    },

    // AND and OR from transistors. Buttons A and B each feed two NPN bases
    // through 10 kΩ (47 kΩ pull-downs). Two NPNs in series under 2.2 kΩ make
    // a NAND: its output is low only when both conduct. Two NPNs in parallel
    // under 2.2 kΩ make a NOR: low when either conducts. Each output drives a
    // PNP inverter through 22 kΩ: the PNP conducts while the gate output is
    // low, so the green LED under the NAND's PNP is AND, the yellow one under
    // the NOR's PNP is OR.
    'lab-transistor-and-or': {
        vcc: 9, supply: SUP,
        parts: { bat: BAT9, a: BTN, b: BTN, rpa: R(47000), rpb: R(47000),
            r1: R(10000), r2: R(10000), qa: NPN, qb: NPN, rnand: R(2200),
            r3: R(10000), r4: R(10000), qc: NPN, qd: NPN, rnor: R(2200),
            rp1: R(22000), p1: PNP, rl1: R(1000), and: LED('green'),
            rp2: R(22000), p2: PNP, rl2: R(1000), or: LED('yellow') },
        nets: [
            ['bat.pos', 'a.a', 'b.a', 'rnand.a', 'rnor.a', 'p1.emitter', 'p2.emitter'],
            ['a.b', 'rpa.a', 'r1.a', 'r3.a'], ['b.b', 'rpb.a', 'r2.a', 'r4.a'],
            ['r1.b', 'qa.base'], ['r2.b', 'qb.base'], ['qa.emitter', 'qb.collector'],
            ['rnand.b', 'qa.collector', 'rp1.a'], ['rp1.b', 'p1.base'], ['p1.collector', 'rl1.a'], ['rl1.b', 'and.anode'],
            ['r3.b', 'qc.base'], ['r4.b', 'qd.base'],
            ['rnor.b', 'qc.collector', 'qd.collector', 'rp2.a'], ['rp2.b', 'p2.base'], ['p2.collector', 'rl2.a'], ['rl2.b', 'or.anode'],
            ['bat.neg', 'rpa.b', 'rpb.b', 'qb.emitter', 'qc.emitter', 'qd.emitter', 'and.cathode', 'or.cathode'],
        ],
    },

    // A receiver with an RF amplifier ahead of the detector. The coupling
    // winding feeds Q1's base (470 kΩ bias, held at RF by 100 nF; emitter
    // 1 kΩ ‖ 10 µF); the amplified carrier stands across a 2.5 mH choke in
    // its collector and leaves through 1 nF. The DETECTOR slide switch
    // passes it to one of two detectors feeding the same magnetic earphone
    // (10 nF carrier bypass): left, a germanium diode; right, a second NPN
    // as an emitter follower with no bias, whose base-emitter junction
    // rectifies and whose emitter drives the earphone.
    'lab-rf-preamp-radio': {
        vcc: 9, supply: SUP,
        parts: { bat: BAT9, gnd: ['gnd', {}], ant: ['antenna', { heightM: 1 }], earth: ['earth', {}], l: COIL, tc: TUNE(0.5),
            rb: R(470000), cb: C(100e-9), q1: NPN, re: R(1000), ce: EL(10e-6), ch: ['inductor', { henrys: 2.5e-3 }],
            ck: C(1e-9), det: SLIDE(0), rk1: R(47000), d: GE, rk2: R(47000), q2: NPN,
            ep: ['earphone', { type: 'magnetic', ohms: 2000, henrys: 0.1 }], cep: C(10e-9) },
        nets: [
            ['ant.a', 'l.tap'], ['l.b', 'tc.a'], ['l.c1', 'q1.base'], ['l.c2', 'rb.b', 'cb.a'],
            ['bat.pos', 'rb.a', 'ch.a', 'q2.collector'],
            ['q1.emitter', 're.a', 'ce.pos'], ['q1.collector', 'ch.b', 'ck.a'],
            ['ck.b', 'det.com'], ['det.a', 'rk1.a', 'd.anode'], ['det.b', 'rk2.a', 'q2.base'],
            ['d.cathode', 'q2.emitter', 'ep.a', 'cep.a'],
            ['bat.neg', 'gnd.gnd', 'earth.earth', 'l.a', 'tc.b', 'cb.b', 're.b', 'ce.neg', 'rk1.b', 'rk2.b', 'ep.b', 'cep.b'],
        ],
    },

    // Infrared across a gap, received two ways. The IR LED (330 Ω) faces a
    // phototransistor across air; the light path's knob is the distance
    // (1 to 30 cm). RECEIVER slide switch, left: the phototransistor alone
    // carries its current straight through the red LED (220 Ω): it lights
    // only at a few centimetres. Right: the phototransistor feeds the base of
    // a second NPN (a photo-Darlington) with the green LED in its collector:
    // far more sensitive, so it reaches much further, but now room light on
    // the phototransistor (its light slider) is enough to light it too.
    'lab-ir-photo-darlington': {
        vcc: 9, supply: SUP,
        parts: { bat: BAT9, rtx: R(330), irled: ['ir_transmitter', {}], pt: ['phototransistor', { light: 0 }], rx: SLIDE(0),
            rr: R(220), red: LED('red'), q: NPN, rg: R(470), green: LED('green'),
            link: ['light_path', { from: '@irled', to: '@pt', medium: 'air', distanceCm: 2, knob: 'distanceCm', knobMin: 1, knobMax: 30 }] },
        nets: [
            ['bat.pos', 'rtx.a', 'pt.collector', 'rg.a'],
            ['rtx.b', 'irled.anode'], ['pt.emitter', 'rx.com'], ['rx.a', 'rr.a'], ['rr.b', 'red.anode'],
            ['rx.b', 'q.base'], ['rg.b', 'green.anode'], ['green.cathode', 'q.collector'],
            ['bat.neg', 'irled.cathode', 'red.cathode', 'q.emitter'],
        ],
    },

    // Bending a light guide, read on a meter. A red LED (1 kΩ) feeds 1 m of
    // plastic fibre; at the far end a phototransistor drives an NPN emitter
    // follower: the phototransistor's current through 2.2 kΩ sets the
    // follower's base, and the follower drives the moving-coil meter (1 mA
    // movement on its 5 V range, 5 kΩ). The light path's knob is the bend
    // radius of one loop: a tight loop lets light out of the core and the
    // needle falls.
    'lab-fibre-bend-meter': {
        vcc: 9, supply: SUP,
        parts: { bat: BAT9, rled: R(1000), led: LED('red'), pt: ['phototransistor', { light: 0 }], rbe: R(2200), q: NPN,
            meter: ['analog_meter', { fullScale: 5, ifs: 0.001 }],
            guide: ['light_path', { from: '@led', to: '@pt', medium: 'fibre', lengthM: 1, bendRadiusCm: 5, bends: 1, jointGapMm: 0,
                jointOffsetMm: 0, jointAngleDeg: 0, outGapMm: 1, shield: 1, knob: 'bendRadiusCm', knobMin: 0.4, knobMax: 5 }] },
        nets: [
            ['bat.pos', 'rled.a', 'pt.collector', 'q.collector'], ['rled.b', 'led.anode'],
            ['pt.emitter', 'rbe.a', 'q.base'], ['q.emitter', 'meter.a'],
            ['bat.neg', 'led.cathode', 'rbe.b', 'meter.b'],
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
