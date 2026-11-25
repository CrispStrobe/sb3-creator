/**
 * Netlists for the r6a set of lab-* benches: discrete NPN circuits only
 * (resistors, capacitors, electrolytics, diodes, LEDs, buttons, switches,
 * pots, a magnetic earphone), written by
 * `node scripts/gen-lab-circuits-4.mjs --set=r6a`.
 *
 * Same shape as lab-benches-4.mjs: pure data, so
 * test/lab-circuits-r6a.test.mjs names parts by role. Ids follow benchIds
 * (breadboard first, then the parts in the order listed).
 *
 * The tone benches share one oscillator: two NPNs cross-coupled through two
 * capacitors (an astable), each with a 2.2 kΩ collector resistor. Each half
 * stays off for about 0.69·R·C, R the resistor that recharges the capacitor
 * on its base: the benches change pitch by changing those resistors
 * (buttons, a probe, a bias capacitor) or the capacitors. A third NPN, fed
 * from Q2's collector through 10 kΩ, switches the magnetic earphone (2 kΩ,
 * 0.1 H), with a 1N4148 across the earphone for the coil's kick. The
 * earphone is kept out of the timing loop on purpose: as Q2's own collector
 * load, the coil's current dying away through the diode drags Q2's collector
 * down while Q2 is off, that pull reaches Q1's base through the coupling
 * capacitor, and Q1 drops out of conduction early (measured: two button
 * settings 0.26 ms apart in theory gave the same 1.3 ms period).
 */
import { benchIds } from './lab-benches-4.mjs';
export { benchIds };

const SUP = { pos: 'bat.pos', neg: 'bat.neg' };
const R = (ohms) => ['resistor', { ohms }];
const C = (farads) => ['capacitor', { farads }];
const EL = (farads) => ['polarized_cap', { farads }];
const LED = (color) => ['led', { color }];
const NPN = ['npn', { beta: 100 }];
const BAT9 = ['vsource', { volts: 9, variant: '9v' }];
const EAR = ['earphone', { type: 'magnetic', ohms: 2000, henrys: 0.1 }];
const BTN = ['button', {}];
const SW = (closed) => ['switch', { closed }];
const SLIDE = (position) => ['slide_switch', { position }];
const D4148 = ['diode', { part: '1N4148' }];
const POT = (ohms, position) => ['potentiometer', { ohms, position }];

export const BENCHES = {
    // Doorbell with two buttons, each feeding Q1's base through its own
    // timing resistor: LOW 100 kΩ, HIGH 33 kΩ. With no button pressed Q1's
    // base has no feed, Q1 stays off, Q2 sits switched on and the earphone
    // carries a steady current: silence.
    // Doorbell with two buttons, each feeding Q1's base through its own
    // timing resistor: LOW 100 kΩ, HIGH 33 kΩ. With no button pressed Q1's
    // base has no feed, Q1 stays off, Q2 stays on, the driver Q3 stays off
    // and the earphone is silent.
    'lab-npn-two-tone-bell': {
        vcc: 9, supply: SUP,
        parts: { bat: BAT9, q1: NPN, q2: NPN, rc1: R(2200), rc2: R(2200),
            c1: C(22e-9), c2: C(22e-9), rb2: R(47000),
            low: BTN, rlow: R(100000), high: BTN, rhigh: R(33000),
            rq: R(10000), q3: NPN, ep: EAR, df: D4148 },
        nets: [
            ['bat.pos', 'rc1.a', 'rc2.a', 'rb2.a', 'low.a', 'high.a', 'ep.a', 'df.cathode'],
            ['rc1.b', 'q1.collector', 'c1.a'], ['c1.b', 'q2.base', 'rb2.b'],
            ['rc2.b', 'q2.collector', 'c2.a', 'rq.a'], ['c2.b', 'q1.base', 'rlow.b', 'rhigh.b'],
            ['low.b', 'rlow.a'], ['high.b', 'rhigh.a'],
            ['rq.b', 'q3.base'], ['ep.b', 'df.anode', 'q3.collector'],
            ['bat.neg', 'q1.emitter', 'q2.emitter', 'q3.emitter'],
        ],
    },

    // Four notes from two buttons. Q1's base is fed through a chain
    // 27 kΩ + 39 kΩ + 22 kΩ from +9 V. Button A shorts the 39 kΩ, button B
    // the 22 kΩ: none, B, A and both leave 88, 66, 49 and 27 kΩ, four
    // pitches. It always sounds (a drone, as on a bagpipe); the buttons only
    // change the note.
    'lab-npn-four-tone-keys': {
        vcc: 9, supply: SUP,
        parts: { bat: BAT9, q1: NPN, q2: NPN, rc1: R(2200), rc2: R(2200),
            c1: C(22e-9), c2: C(22e-9), rb2: R(33000),
            r0: R(27000), ra: R(39000), rb: R(22000), ka: BTN, kb: BTN,
            rq: R(10000), q3: NPN, ep: EAR, df: D4148 },
        nets: [
            ['bat.pos', 'rc1.a', 'rc2.a', 'rb2.a', 'rb.a', 'kb.a', 'ep.a', 'df.cathode'],
            ['rc1.b', 'q1.collector', 'c1.a'], ['c1.b', 'q2.base', 'rb2.b'],
            ['rc2.b', 'q2.collector', 'c2.a', 'rq.a'], ['c2.b', 'q1.base', 'r0.b'],
            ['rb.b', 'kb.b', 'ra.a', 'ka.a'], ['ra.b', 'ka.b', 'r0.a'],
            ['rq.b', 'q3.base'], ['ep.b', 'df.anode', 'q3.collector'],
            ['bat.neg', 'q1.emitter', 'q2.emitter', 'q3.emitter'],
        ],
    },

    // A two-pitch siren: the oscillator runs all the time on a 100 kΩ feed
    // into Q1's base; the SIREN button puts a second resistor in parallel
    // (the slide switch picks 47 kΩ or the smaller, shriller 15 kΩ). Here
    // Q3 is an emitter follower with the earphone in its emitter: the
    // earphone gets a copy of the voltage on Q3's base. The SOFT switch
    // hangs 47 nF from that base to ground: with the 10 kΩ in front of it,
    // the square wave from Q2's collector arrives as rounded ramps, the
    // earphone current follows them and the tone sounds softer.
    'lab-npn-police-siren': {
        vcc: 9, supply: SUP,
        parts: { bat: BAT9, q1: NPN, q2: NPN, rc1: R(2200), rc2: R(2200),
            c1: C(22e-9), c2: C(22e-9), rb2: R(47000), rf: R(100000),
            siren: BTN, pick: SLIDE(0), rp1: R(47000), rp2: R(15000),
            rq: R(10000), q3: NPN, ep: EAR, df: D4148, soft: SW(false), cs: C(47e-9) },
        nets: [
            ['bat.pos', 'rc1.a', 'rc2.a', 'rb2.a', 'rf.a', 'siren.a', 'q3.collector'],
            ['rc1.b', 'q1.collector', 'c1.a'], ['c1.b', 'q2.base', 'rb2.b'],
            ['rc2.b', 'q2.collector', 'c2.a', 'rq.a'], ['c2.b', 'q1.base', 'rf.b', 'rp1.b', 'rp2.b'],
            ['siren.b', 'pick.com'], ['pick.a', 'rp1.a'], ['pick.b', 'rp2.a'],
            ['rq.b', 'q3.base', 'soft.a'], ['soft.b', 'cs.a'], ['q3.emitter', 'ep.a', 'df.cathode'],
            ['bat.neg', 'q1.emitter', 'q2.emitter', 'ep.b', 'df.anode', 'cs.b'],
        ],
    },

    // A swelling siren. Q1's base resistor (47 kΩ) is fed not from +9 V but
    // from a bias capacitor (10 µF; with the SLOW slide switch 47 µF more in
    // parallel). Holding the button charges it through 2.2 kΩ: the higher
    // its voltage, the faster Q1's base recharges and the higher the pitch.
    // Let go and the capacitor empties into Q1's base: the pitch slides down
    // until the oscillator stops. Q2's base resistor stays on +9 V: with
    // both resistors on the empty capacitor the engine found the astable
    // running anyway at about 4 kHz, each half held on only by the other
    // collector recharging its coupling capacitor (2.2 kΩ · 22 nF); a base
    // held from +9 V keeps Q2 firmly on and the idle circuit silent.
    'lab-npn-swell-siren': {
        vcc: 9, supply: SUP,
        parts: { bat: BAT9, q1: NPN, q2: NPN, rc1: R(2200), rc2: R(2200),
            c1: C(22e-9), c2: C(22e-9), rb1: R(47000), rb2: R(47000),
            push: BTN, rch: R(2200), cb: EL(10e-6), slow: SLIDE(0), cbig: EL(47e-6),
            rq: R(10000), q3: NPN, ep: EAR, df: D4148 },
        nets: [
            ['bat.pos', 'rc1.a', 'rc2.a', 'rb2.a', 'push.a', 'ep.a', 'df.cathode'],
            ['rc1.b', 'q1.collector', 'c1.a'], ['c1.b', 'q2.base', 'rb2.b'],
            ['rc2.b', 'q2.collector', 'c2.a', 'rq.a'], ['c2.b', 'q1.base', 'rb1.b'],
            ['push.b', 'rch.a'], ['rch.b', 'cb.pos', 'rb1.a', 'slow.com'],
            ['slow.b', 'cbig.pos'],
            ['rq.b', 'q3.base'], ['ep.b', 'df.anode', 'q3.collector'],
            ['bat.neg', 'q1.emitter', 'q2.emitter', 'q3.emitter', 'cb.neg', 'cbig.neg'],
        ],
        open: ['slow.a'],
    },

    // A probe oscillator. Q1's base is fed through a 22 kΩ guard resistor,
    // the PROBES switch (probe tips touching something, or not) and the
    // MATERIAL rheostat (1 MΩ as a variable resistor: metal at 0, fruit, wet
    // paper or damp skin in the middle, dry skin at the top). The less the
    // material resists, the faster Q1's base recharges and the higher the
    // pitch. A yellow LED sits in series with Q2's collector resistor: it
    // is lit while Q2 conducts, which is while Q1 is held off, so the more
    // the material resists, the larger Q1's share of off-time and the
    // brighter the LED (and the lower the pitch). The HIGH slide switch swaps
    // Q1's timing capacitor from 10 nF to 1 nF: a shrill whistle near 10 kHz, nearer the top of
    // hearing. As authored the probes are apart: silence.
    'lab-npn-probe-tone': {
        vcc: 9, supply: SUP,
        parts: { bat: BAT9, q1: NPN, q2: NPN, rc1: R(10000), rc2: R(2200),
            c1: C(2.2e-9), rb2: R(47000), high: SLIDE(0), c2lo: C(10e-9), c2hi: C(1e-9),
            guard: R(22000), probes: SW(false), mat: POT(1e6, 0.047),
            rq: R(10000), q3: NPN, ep: EAR, df: D4148, led: LED('yellow') },
        nets: [
            ['bat.pos', 'rc1.a', 'rc2.a', 'rb2.a', 'guard.a', 'ep.a', 'df.cathode'],
            ['rc1.b', 'q1.collector', 'c1.a'], ['c1.b', 'q2.base', 'rb2.b'],
            ['rc2.b', 'led.anode'], ['led.cathode', 'q2.collector', 'high.com', 'rq.a'],
            ['high.a', 'c2lo.a'], ['high.b', 'c2hi.a'],
            ['c2lo.b', 'c2hi.b', 'q1.base', 'mat.wiper'],
            ['guard.b', 'probes.a'], ['probes.b', 'mat.b'],
            ['rq.b', 'q3.base'], ['ep.b', 'df.anode', 'q3.collector'],
            ['bat.neg', 'q1.emitter', 'q2.emitter', 'q3.emitter'],
        ],
        open: ['mat.a'],
    },

    // The tone oscillator keyed by a button, with a germanium diode in the
    // coupling path from Q2's collector to Q1's base. The PLAIN switch
    // bridges the diode (an ordinary tone); open it and the diode is in the
    // path: the capacitor can still pull Q1's base down through it, but it
    // cannot be pushed back up, so it has to recover through Q1's base
    // resistor and the diode's leakage instead: a different, lower note.
    'lab-npn-diode-horn': {
        vcc: 9, supply: SUP,
        parts: { bat: BAT9, key: BTN, q1: NPN, q2: NPN, rc1: R(2200), rc2: R(2200),
            c1: C(100e-9), c2: C(100e-9), rb1: R(47000), rb2: R(47000),
            dg: ['diode', { part: '1N34A' }], plain: SW(true), rl: R(47000),
            rq: R(10000), q3: NPN, ep: EAR, df: D4148 },
        nets: [
            ['bat.pos', 'key.a'],
            ['key.b', 'rc1.a', 'rc2.a', 'rb1.a', 'rb2.a', 'ep.a', 'df.cathode'],
            ['rc1.b', 'q1.collector', 'c1.a'], ['c1.b', 'q2.base', 'rb2.b'],
            ['rc2.b', 'q2.collector', 'c2.a', 'rq.a'],
            ['c2.b', 'dg.cathode', 'plain.a', 'rl.a'], ['dg.anode', 'plain.b', 'q1.base', 'rb1.b'],
            ['rq.b', 'q3.base'], ['ep.b', 'df.anode', 'q3.collector'],
            ['bat.neg', 'q1.emitter', 'q2.emitter', 'q3.emitter', 'rl.b'],
        ],
    },

    // A plain DC through the earphone: the key, a red LED as the indicator
    // and the earphone in series on 9 V. Two slide switches (flip both)
    // reverse the earphone's leads. It clicks once when the key closes and
    // once when it opens; while the current flows steadily it is silent.
    'lab-earphone-click': {
        vcc: 9, supply: SUP,
        parts: { bat: BAT9, key: BTN, led: LED('red'), sa: SLIDE(0), sb: SLIDE(0), ep: EAR },
        nets: [
            ['bat.pos', 'key.a'], ['key.b', 'led.anode'],
            ['led.cathode', 'sa.a', 'sb.b'], ['sa.com', 'ep.a'], ['sb.com', 'ep.b'],
            ['bat.neg', 'sa.b', 'sb.a'],
        ],
    },

    // Heat alarm with the transistor itself as the sensor. Q1 sits on its
    // leads in its own surroundings (the Temperature slider: ice, room,
    // fingers, hot air). Its base is held near the edge of conduction by
    // 100 kΩ from +9 V against 4.7 kΩ + the SET trimmer (2.2 kΩ rheostat) to
    // ground. Q1's collector is Q2's base node, fed through 47 kΩ. Warm Q1:
    // its VBE falls by about 2 mV per degree, its collector current grows
    // tenfold every 30 degrees or so, it steals Q2's base current and the
    // green LED dims; cool it and the LED comes back.
    'lab-npn-heat-alarm': {
        vcc: 9, supply: SUP,
        parts: { bat: BAT9, q1: ['npn', { model: 'shockley', is: 1e-14, beta: 100, br: 1, n: 1, surroundC: 25, thermalTau: 1.5 }], q2: NPN,
            rtop: R(100000), rbot: R(6200), set: POT(1000, 0.25),
            rc1: R(47000), rled: R(470), led: LED('green') },
        nets: [
            ['bat.pos', 'rtop.a', 'rc1.a', 'rled.a'],
            ['rtop.b', 'q1.base', 'rbot.a'], ['rbot.b', 'set.a'],
            ['rc1.b', 'q1.collector', 'q2.base'], ['rled.b', 'led.anode'], ['led.cathode', 'q2.collector'],
            ['bat.neg', 'q1.emitter', 'q2.emitter', 'set.wiper', 'set.b'],
        ],
    },

    // A two-LED astable (red on Q1, green on Q2; 47 kΩ and 10 µF per half)
    // with four switches that take parts of it out: EN1 and EN2 in the
    // emitters (open = that half is dead), HOLD in series with one coupling
    // capacitor (open = no feedback, both transistors simply conduct) and
    // DARK across the red LED (closed = red bypassed while the circuit keeps
    // running). Five states: both blinking, one blinking, both on, one on,
    // both off.
    'lab-npn-astable-states': {
        vcc: 9, supply: SUP,
        parts: { bat: BAT9, q1: NPN, q2: NPN, rl1: R(470), red: LED('red'), rl2: R(470), green: LED('green'),
            rb1: R(47000), rb2: R(47000), c1: EL(10e-6), c2: EL(10e-6),
            en1: SW(true), en2: SW(true), hold: SW(true), dark: SW(false) },
        nets: [
            ['bat.pos', 'rl1.a', 'rl2.a', 'rb1.a', 'rb2.a'],
            ['rl1.b', 'red.anode', 'dark.a'], ['red.cathode', 'dark.b', 'q1.collector', 'hold.a'],
            ['hold.b', 'c1.pos'], ['c1.neg', 'q2.base', 'rb2.b'],
            ['rl2.b', 'green.anode'], ['green.cathode', 'q2.collector', 'c2.pos'], ['c2.neg', 'q1.base', 'rb1.b'],
            ['q1.emitter', 'en1.a'], ['q2.emitter', 'en2.a'],
            ['bat.neg', 'en1.b', 'en2.b'],
        ],
    },

    // Fade in, fade out. UP charges the electrolytic through 22 kΩ, DOWN
    // empties it through 22 kΩ. Q1, an emitter follower, puts the capacitor's
    // voltage (less one VBE) across the red LED and 470 Ω: red fades in as
    // the capacitor charges. Q2, fed from the same capacitor through 47 kΩ,
    // is a shunt across the green LED (fed from +9 V through 1 kΩ): the more
    // it conducts, the less is left for green, so green fades out while red
    // fades in. The FAST slide switch picks 47 µF instead of 220 µF.
    'lab-npn-fade': {
        vcc: 9, supply: SUP,
        parts: { bat: BAT9, up: BTN, rup: R(10000), down: BTN, rdn: R(10000),
            fast: SLIDE(0), cslow: EL(470e-6), cfast: EL(100e-6),
            q1: NPN, rr: R(1000), red: LED('red'), q2: NPN, rb2: R(100000), rg: R(2200), green: LED('green') },
        nets: [
            ['bat.pos', 'up.a', 'q1.collector', 'rg.a'],
            ['up.b', 'rup.a'], ['rup.b', 'rdn.a', 'fast.com', 'q1.base', 'rb2.a'], ['rdn.b', 'down.a'],
            ['fast.a', 'cslow.pos'], ['fast.b', 'cfast.pos'],
            ['q1.emitter', 'rr.a'], ['rr.b', 'red.anode'],
            ['rb2.b', 'q2.base'], ['rg.b', 'green.anode', 'q2.collector'],
            ['bat.neg', 'down.b', 'cslow.neg', 'cfast.neg', 'red.cathode', 'green.cathode', 'q2.emitter'],
        ],
    },

    // Two transistor shunts side by side, each a 470 Ω feed into a node
    // with a green LED to ground and a red LED + NPN to ground. A conducting
    // NPN gives the red path (1.9 V + a saturated transistor) the lower
    // voltage, so the current moves from green to red.
    //   Left: the transistor's base gets current only while ON is pressed:
    //   green normally, red while pressed.
    //   Right: the transistor's base is fed all the time through 10 kΩ; OFF
    //   shorts the base to ground: red normally, green while pressed.
    'lab-npn-shunt-pair': {
        vcc: 9, supply: SUP,
        parts: { bat: BAT9,
            on: BTN, rbl: R(10000), rpl: R(100000), ql: NPN, rfl: R(470), dl: D4148, gl: LED('green'), redl: LED('red'),
            off: BTN, rbr: R(10000), qr: NPN, rfr: R(470), dr: D4148, gr: LED('green'), redr: LED('red') },
        nets: [
            ['bat.pos', 'on.a', 'rfl.a', 'rbr.a', 'rfr.a'],
            ['on.b', 'rbl.a'], ['rbl.b', 'rpl.a', 'ql.base'],
            ['rfl.b', 'dl.anode', 'redl.anode'], ['dl.cathode', 'gl.anode'], ['redl.cathode', 'ql.collector'],
            ['rbr.b', 'qr.base', 'off.a'],
            ['rfr.b', 'dr.anode', 'redr.anode'], ['dr.cathode', 'gr.anode'], ['redr.cathode', 'qr.collector'],
            ['bat.neg', 'rpl.b', 'ql.emitter', 'gl.cathode', 'off.b', 'qr.emitter', 'gr.cathode'],
        ],
    },

    // An AND gate from two NPNs in series: the red LED (1 kΩ) can reach
    // ground only through both collector–emitter paths. Each button feeds
    // its transistor's base through 10 kΩ (100 kΩ holds the base low
    // otherwise): the LED lights only while A and B are both pressed.
    'lab-npn-and-gate': {
        vcc: 9, supply: SUP,
        parts: { bat: BAT9, a: BTN, ra: R(10000), pa: R(100000), b: BTN, rb: R(10000), pb: R(100000),
            qa: NPN, qb: NPN, rl: R(1000), led: LED('red') },
        nets: [
            ['bat.pos', 'a.a', 'b.a', 'rl.a'],
            ['a.b', 'ra.a'], ['ra.b', 'pa.a', 'qa.base'],
            ['b.b', 'rb.a'], ['rb.b', 'pb.a', 'qb.base'],
            ['rl.b', 'led.anode'], ['led.cathode', 'qa.collector'], ['qa.emitter', 'qb.collector'],
            ['bat.neg', 'pa.b', 'pb.b', 'qb.emitter'],
        ],
    },
};
