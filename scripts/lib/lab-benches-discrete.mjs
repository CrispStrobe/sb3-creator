/**
 * Netlists for the `discrete` set of lab-* benches (transistor stages in a
 * row, an adjustable two-transistor relaxation oscillator, and a discrete
 * differential pair in front of an op-amp), written by
 * `node scripts/gen-lab-circuits-4.mjs --set=discrete`.
 *
 * Pure data, like lab-benches-5.mjs, so test/lab-circuits-discrete.test.mjs
 * can name parts by role. Engine default npn/pnp, real electrolytics, the
 * LM358 macromodel.
 */
export { benchIds } from './lab-benches-4.mjs';

const R = (ohms) => ['resistor', { ohms }];
const LED = (color) => ['led', { color }];
const NPN = ['npn', {}];
const PNP = ['pnp', {}];
const ELKO = (farads) => ['polarized_cap', { farads }];
const POT = (ohms, position) => ['potentiometer', { ohms, position }];
const BAT9 = ['vsource', { volts: 9, variant: '9v' }];
const SUP = { pos: 'bat.pos', neg: 'bat.neg' };

export const BENCHES = {
    'lab-two-followers': {
        vcc: 9, supply: SUP,
        parts: { bat: BAT9, pot: POT(10000, 0.8), rs: R(47000), amb: ['ammeter', {}],
            q1: NPN, re1: R(100000), q2: NPN, re2: R(10000),
            sel: ['slide_switch', { position: 1 }], rl: R(330), led: LED('red'),
            vin: ['voltmeter', {}], v1: ['voltmeter', {}], v2: ['voltmeter', {}] },
        nets: [
            ['bat.pos', 'pot.a', 'q1.collector', 'q2.collector'],
            ['pot.wiper', 'rs.a', 'vin.a'], ['rs.b', 'amb.a'], ['amb.b', 'q1.base'],
            ['q1.emitter', 're1.a', 'q2.base', 'sel.a', 'v1.a'],
            ['q2.emitter', 're2.a', 'sel.b', 'v2.a'],
            ['sel.com', 'rl.a'], ['rl.b', 'led.anode'],
            ['bat.neg', 'pot.b', 're1.b', 're2.b', 'led.cathode', 'vin.b', 'v1.b', 'v2.b'],
        ],
    },

    'lab-inverting-stages': {
        vcc: 9, supply: SUP,
        parts: { bat: BAT9, pot: POT(10000, 0.5), rb1: R(100000), q1: NPN, rc1: R(1000),
            rl1: R(470), l1: LED('yellow'),
            rb2: R(47000), q2: NPN, rc2: R(1000), rl2: R(470), l2: LED('green') },
        nets: [
            ['bat.pos', 'pot.a', 'rc1.a', 'rc2.a'],
            ['pot.wiper', 'rb1.a'], ['rb1.b', 'q1.base'],
            ['rc1.b', 'q1.collector', 'rl1.a', 'rb2.a'], ['rl1.b', 'l1.anode'],
            ['rb2.b', 'q2.base'],
            ['rc2.b', 'q2.collector', 'rl2.a'], ['rl2.b', 'l2.anode'],
            ['bat.neg', 'pot.b', 'q1.emitter', 'q2.emitter', 'l1.cathode', 'l2.cathode'],
        ],
    },

    'lab-battery-monitor': {
        vcc: 9, supply: SUP,
        parts: { bat: ['vsource', { volts: 9 }], rt: R(100000), ct: ELKO(2.2e-6), qp: PNP, qn: NPN,
            rd1: R(1000), set: POT(2200, 0.5), rd2: R(6800), rbe: R(100000),
            led: LED('red'), rs: R(47), re: R(1000) },
        nets: [
            ['bat.pos', 'rt.a', 'rd1.a'], ['rt.b', 'ct.pos', 'qp.emitter'],
            ['rd1.b', 'set.a'], ['set.wiper', 'qp.base', 'qn.collector'], ['set.b', 'rd2.a'],
            ['qp.collector', 'qn.base', 'rbe.a'], ['qn.emitter', 'rbe.b', 'led.anode', 're.a'],
            ['led.cathode', 'rs.a'],
            ['bat.neg', 'ct.neg', 'rd2.b', 'rs.b', 're.b'],
        ],
    },

    'lab-relax-tone': {
        vcc: 9, supply: SUP,
        parts: { bat: BAT9, rt: R(22000), pitch: POT(22000, 0.5), ct: ['capacitor', { farads: 47e-9 }],
            qp: PNP, qn: NPN, rd1: R(1000), rd2: R(2200), rbe: R(100000), rs: R(220), spk: ['piezo', {}] },
        nets: [
            ['bat.pos', 'rt.a', 'rd1.a'], ['rt.b', 'pitch.a'],
            ['pitch.wiper', 'pitch.b', 'ct.a', 'qp.emitter'],
            ['rd1.b', 'rd2.a', 'qp.base', 'qn.collector'],
            ['qp.collector', 'qn.base', 'rbe.a'], ['qn.emitter', 'rbe.b', 'rs.a', 'spk.a'],
            ['bat.neg', 'ct.b', 'rd2.b', 'rs.b', 'spk.b'],
        ],
    },

    'lab-diff-comparator': {
        vcc: 9, supply: SUP,
        parts: { bat: BAT9, rr1: R(10000), rr2: R(10000),
            lim1: R(4700), fine: POT(1000, 0.5), lim2: R(4700), vd: ['voltmeter', {}],
            q1: NPN, q2: NPN, rc1: R(4700), rc2: R(4700), rt: R(4700),
            u: ['lm358', {}], rr: R(1000), red: LED('red'), rg: R(1000), green: LED('green') },
        nets: [
            ['bat.pos', 'rr1.a', 'lim1.a', 'rc1.a', 'rc2.a', 'u.vcc', 'rr.a'],
            ['rr1.b', 'rr2.a', 'q1.base', 'vd.b'],
            ['lim1.b', 'fine.a'], ['fine.wiper', 'q2.base', 'vd.a'], ['fine.b', 'lim2.a'],
            ['rc1.b', 'q1.collector', 'u.1_pos'], ['rc2.b', 'q2.collector', 'u.1_neg'],
            ['q1.emitter', 'q2.emitter', 'rt.a'],
            ['rr.b', 'red.anode'], ['red.cathode', 'u.1_out', 'rg.a'], ['rg.b', 'green.anode'],
            ['u.2_neg', 'u.2_out'],
            ['bat.neg', 'rr2.b', 'lim2.b', 'rt.b', 'u.gnd', 'green.cathode', 'u.2_pos'],
        ],
    },

    'lab-diff-blinker': {
        vcc: 9, supply: SUP,
        parts: { bat: BAT9, rs1: R(10000), rs2: R(10000),
            q1: NPN, q2: NPN, re1: R(47000), re2: R(47000), rt: R(4700), rc1: R(47000), rc2: R(47000),
            u: ['lm358', {}], cm: ELKO(4.7e-6), sw: ['slide_switch', { position: 0 }],
            r1: R(10000), c1: ELKO(10e-6), r2: R(10000), c2: ELKO(10e-6), r3: R(10000), c3: ELKO(10e-6),
            rl: R(1000), led: LED('green') },
        nets: [
            ['bat.pos', 'rs1.a', 'rc1.a', 'rc2.a', 'u.vcc'],
            ['rs1.b', 'rs2.a', 'q2.base'],
            ['q1.emitter', 're1.a'], ['q2.emitter', 're2.a'], ['re1.b', 're2.b', 'rt.a'],
            ['rc1.b', 'q1.collector', 'u.1_pos'], ['rc2.b', 'q2.collector', 'u.1_neg', 'cm.neg', 'sw.a'],
            ['cm.pos', 'sw.com'],
            ['u.1_out', 'sw.b', 'r1.a', 'rl.a'], ['rl.b', 'led.anode'],
            ['r1.b', 'c1.pos', 'r2.a'], ['r2.b', 'c2.pos', 'r3.a'], ['r3.b', 'c3.pos', 'q1.base'],
            ['u.2_neg', 'u.2_out'],
            ['bat.neg', 'rs2.b', 'rt.b', 'u.gnd', 'led.cathode', 'u.2_pos', 'c1.neg', 'c2.neg', 'c3.neg'],
        ],
    },
};
