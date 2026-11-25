/**
 * Netlists for the `discrete` set of lab-* benches (transistor stages in a
 * row, an adjustable two-transistor relaxation oscillator, and a discrete
 * differential pair in front of an audio amplifier chip, and a tone-fed
 * transistor bridge), written by
 * `node scripts/gen-lab-circuits-4.mjs --set=discrete`.
 *
 * Pure data, like lab-benches-5.mjs, so test/lab-circuits-discrete.test.mjs
 * can name parts by role. Engine default npn/pnp, real electrolytics, the
 * LM386 macromodel (the audio power-amp IC these rows call for).
 */
import { benchIds } from './lab-benches-4.mjs';
export { benchIds };

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

    // The pair's collectors reach an LM386 audio power amplifier (the stand-in
    // for a TBA820-class amp IC) through 1 MΩ each, which with the chip's own
    // 50 kΩ input resistors keeps its inputs near ground, where they work.
    // Gain pins joined: x200 down to DC.
    'lab-diff-comparator': {
        vcc: 9, supply: SUP,
        parts: { bat: BAT9, rr1: R(10000), rr2: R(10000),
            lim1: R(4700), fine: POT(1000, 0.5), lim2: R(4700), vd: ['voltmeter', {}],
            q1: NPN, q2: NPN, rc1: R(4700), rc2: R(4700), rt: R(4700), rp: R(1000000), rn: R(1000000),
            u: ['lm386', {}], rr: R(1000), red: LED('red'), rg: R(1000), green: LED('green') },
        nets: [
            ['bat.pos', 'rr1.a', 'lim1.a', 'rc1.a', 'rc2.a', 'u.vs', 'rr.a'],
            ['rr1.b', 'rr2.a', 'q1.base', 'vd.b'],
            ['lim1.b', 'fine.a'], ['fine.wiper', 'q2.base', 'vd.a'], ['fine.b', 'lim2.a'],
            ['rc1.b', 'q1.collector', 'rp.a'], ['rc2.b', 'q2.collector', 'rn.a'],
            ['rp.b', 'u.inp'], ['rn.b', 'u.inn'], ['u.gain1', 'u.gain8'],
            ['q1.emitter', 'q2.emitter', 'rt.a'],
            ['rr.b', 'red.anode'], ['red.cathode', 'u.vout', 'rg.a'], ['rg.b', 'green.anode'],
            ['bat.neg', 'rr2.b', 'lim2.b', 'rt.b', 'u.gnd', 'green.cathode'],
        ],
        open: ['u.bypass'],
    },

    // Same pair and amp IC; the output returns to q1's base through three
    // RC sections. The Miller capacitor (switched in by `sw`) goes from the
    // amp's output to its inverting input.
    'lab-diff-blinker': {
        vcc: 9, supply: SUP,
        parts: { bat: BAT9, rs1: R(10000), rs2: R(10000),
            q1: NPN, q2: NPN, re1: R(1200), re2: R(1200), rt: R(4700), rc1: R(10000), rc2: R(10000),
            rp: R(680000), rn: R(680000), u: ['lm386', {}], cm: ELKO(3.3e-6), sw: ['slide_switch', { position: 0 }],
            r1: R(10000), c1: ELKO(10e-6), r2: R(10000), c2: ELKO(10e-6), r3: R(10000), c3: ELKO(10e-6),
            rl: R(1000), led: LED('green') },
        nets: [
            ['bat.pos', 'rs1.a', 'rc1.a', 'rc2.a', 'u.vs'],
            ['rs1.b', 'rs2.a', 'q2.base'],
            ['q1.emitter', 're1.a'], ['q2.emitter', 're2.a'], ['re1.b', 're2.b', 'rt.a'],
            ['rc1.b', 'q1.collector', 'rp.a'], ['rc2.b', 'q2.collector', 'rn.a'],
            ['rp.b', 'u.inp'], ['rn.b', 'u.inn', 'cm.neg', 'sw.a'], ['u.gain1', 'u.gain8'],
            ['cm.pos', 'sw.com'],
            ['u.vout', 'sw.b', 'r1.a', 'rl.a'], ['rl.b', 'led.anode'],
            ['r1.b', 'c1.pos', 'r2.a'], ['r2.b', 'c2.pos', 'r3.a'], ['r3.b', 'c3.pos', 'q1.base'],
            ['bat.neg', 'rs2.b', 'rt.b', 'u.gnd', 'led.cathode', 'c1.neg', 'c2.neg', 'c3.neg'],
        ],
        open: ['u.bypass'],
    },

    // Acoustic difference thermometer. An LM386 phase-shift oscillator (three
    // 10 nF / 10 k high-pass sections from the output to the inverting input)
    // makes a tone. Through 10 µF it feeds a bridge: the pot's wiper splits it
    // into two arms of 2.2 k, each ending in a diode-connected NPN to ground.
    // An earphone across the two junctions hears only their difference. Each
    // transistor sits next to a 220 Ω heater that a button switches on (thermal
    // model, time constants shortened so a run stays short).
    'lab-tone-thermometer': {
        vcc: 9, supply: SUP,
        parts: { bat: BAT9, u: ['lm386', {}], cg: ELKO(10e-6),
            c1: ['capacitor', { farads: 10e-9 }], r1: R(10000), c2: ['capacitor', { farads: 10e-9 }], r2: R(10000),
            c3: ['capacitor', { farads: 10e-9 }], r3: R(10000),
            cc: ELKO(10e-6), rbl: R(1000), trim: POT(10000, 0.5), ra: R(2200), rb: R(2200),
            q1: ['npn', { model: 'shockley', is: 1e-14, beta: 150, br: 1, n: 1, heatedBy: '@h1', thermalCoupling: 0.2, thermalTau: 0.003 }],
            q2: ['npn', { model: 'shockley', is: 1e-14, beta: 150, br: 1, n: 1, heatedBy: '@h2', thermalCoupling: 0.2, thermalTau: 0.003 }],
            ear: ['earphone', {}],
            w1: ['button', {}], h1: ['resistor', { ohms: 220, rth: 200, thermalTau: 0.003 }],
            w2: ['button', {}], h2: ['resistor', { ohms: 220, rth: 200, thermalTau: 0.003 }] },
        nets: [
            ['bat.pos', 'u.vs', 'w1.a', 'w2.a'],
            ['u.gain1', 'cg.pos'], ['u.gain8', 'cg.neg'],
            ['u.vout', 'c1.a', 'cc.pos'], ['c1.b', 'r1.a', 'c2.a'], ['c2.b', 'r2.a', 'c3.a'], ['c3.b', 'r3.a', 'u.inn'],
            ['cc.neg', 'rbl.a', 'trim.wiper'], ['trim.a', 'ra.a'], ['trim.b', 'rb.a'],
            ['ra.b', 'q1.base', 'q1.collector', 'ear.a'], ['rb.b', 'q2.base', 'q2.collector', 'ear.b'],
            ['w1.b', 'h1.a'], ['w2.b', 'h2.a'],
            ['bat.neg', 'u.gnd', 'u.inp', 'r1.b', 'r2.b', 'r3.b', 'rbl.b', 'q1.emitter', 'q2.emitter', 'h1.b', 'h2.b'],
        ],
        open: ['u.bypass'],
    },
};

// Resolve '@name' params (the thermal model's heatedBy) to engine ids.
for (const spec of Object.values(BENCHES)) {
    const ids = benchIds(spec);
    for (const [, params] of Object.values(spec.parts))
        for (const [k, v] of Object.entries(params || {}))
            if (typeof v === 'string' && v.startsWith('@')) params[k] = ids[v.slice(1)];
}
