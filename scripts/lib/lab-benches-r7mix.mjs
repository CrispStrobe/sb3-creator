/**
 * Netlists for the double-balanced mixer IC benches (`sa612`: a Gilbert cell
 * whose outputs carry the product of its two inputs, with its own oscillator
 * transistor on pins osc_b / osc_e). Written by
 * `node scripts/gen-lab-circuits-4.mjs --set=r7mix`.
 *
 * Same shape as lab-benches-rf.mjs: pure data, so test/lab-circuits-r7mix.test.mjs
 * names parts by role. Ids follow benchIds (breadboard first, then the parts
 * in the order listed). '@name' params are resolved to engine ids at the end.
 *
 * The chip (bw-board src/mixer-ic.js): inputs 1.5 kΩ each to an internal bias
 * at 0.23 of the supply, outputs 1.5 kΩ each to the supply, the core's tail
 * current (1 mA) steered between them by tanh(gm·v_rf/I)·tanh(v_lo/2Vt), the
 * LO being the oscillator base against its own bias (0.27 of the supply). At
 * RF the engine carries it as a three-port of the envelope bands: an RF signal
 * and an LO that share a band beat straight to audio.
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
const DI = ['diode', {}];
const BAT6 = ['vsource', { volts: 6 }];
const MIX = ['sa612', {}];
const POT = (ohms, position) => ['potentiometer', { ohms, position }];
const TUNE = (position) => ['tuning_cap', { minFarads: 10e-12, maxFarads: 500e-12, position }];

/**
 * An LED that lights while the mixer output `out` sinks most of the tail
 * current: a PNP whose emitter sits a diode below the supply, its base on the
 * output through 2.2 kΩ (it turns on once the 1.5 kΩ load drops ~1.3 V,
 * i.e. above ~0.85 mA of the 1 mA tail), the LED and 330 Ω in its collector.
 */
const lamp = (p, color) => ({
    parts: { [`d${p}`]: DI, [`q${p}`]: PNP, [`rq${p}`]: R(2200), [`l${p}`]: LED(color), [`rl${p}`]: R(330) },
    nets: [[`d${p}.cathode`, `q${p}.emitter`], [`q${p}.base`, `rq${p}.a`], [`q${p}.collector`, `l${p}.anode`], [`l${p}.cathode`, `rl${p}.a`]],
    pos: [`d${p}.anode`], out: `rq${p}.b`, neg: [`rl${p}.b`],
});

const LA = lamp('a', 'red');
const LB = lamp('b', 'green');


export const BENCHES = {
    // Electronic points: the mixer at DC. An LM386 relaxation oscillator
    // (its output kicks +IN through 2.2 µF, the kick decays through 22 kΩ:
    // a few hertz) drives input A through 4.7 kΩ against input B held at
    // half the supply through 4.7 kΩ. The LO pin is pulled low by 10 kΩ; the
    // STEER button pulls it high through 4.7 kΩ. The product of the two signs
    // decides which output takes the tail current, and a PNP lamp on each
    // output shows it: the blinking jumps from one LED to the other when the
    // button is pressed.
    'lab-mixer-points': {
        vcc: 6, supply: SUP,
        parts: { bat: BAT6, u: ['lm386', {}], cf: EL(2.2e-6), rb: R(22000),
            m: MIX, ra: R(4700), rbb: R(4700), rd1: R(10000), rd2: R(10000), rl: R(10000), steer: ['button', {}], rh: R(4700),
            ...LA.parts, ...LB.parts },
        nets: [
            ['bat.pos', 'u.vs', 'm.vcc', 'rd1.a', 'steer.a', ...LA.pos, ...LB.pos],
            ['u.vout', 'cf.pos', 'ra.a'], ['cf.neg', 'u.inp', 'rb.a'], ['ra.b', 'm.in_a'], ['rbb.b', 'm.in_b'], ['rbb.a', 'rd1.b', 'rd2.a'],
            ['steer.b', 'rh.a'], ['rh.b', 'm.osc_b', 'rl.a'],
            ['m.out_a', LA.out], ['m.out_b', LB.out], ...LA.nets, ...LB.nets,
            ['bat.neg', 'u.gnd', 'u.inn', 'rb.b', 'rd2.b', 'rl.b', 'm.gnd', ...LA.neg, ...LB.neg],
        ],
        open: ['u.gain1', 'u.gain8', 'u.bypass', 'm.osc_e'],
    },

    // Beat reception: a wire antenna straight into input A through 100 pF
    // (input B bypassed), the chip's own oscillator transistor in a tapped-
    // coil oscillator (the ferrite rod's main winding with the tuning
    // capacitor across it, its top to the oscillator base through 10 nF, the
    // tap feeding the emitter back through 10 nF). Wherever the oscillator
    // lands within a few kHz of a broadcast station, their difference is a
    // whistle at output A, heard in a crystal earphone through 10 nF.
    'lab-mixer-beat-rx': {
        vcc: 6, supply: SUP,
        parts: { bat: BAT6, ant: ['antenna', {}], earth: ['earth', {}], ca: C(100e-12),
            m: MIX, cb: C(100e-9), l: ['ferrite_coil', { rodHeightM: 0 }], tc: TUNE(0.45), ck: C(10e-9), ct: C(10e-9),
            co: C(10e-9), ep: ['earphone', { type: 'crystal' }], cs: EL(100e-6) },
        nets: [
            ['bat.pos', 'm.vcc', 'cs.pos'], ['ant.a', 'ca.a'], ['ca.b', 'm.in_a'], ['m.in_b', 'cb.a'],
            ['m.osc_b', 'ck.a'], ['ck.b', 'l.b', 'tc.a'], ['l.tap', 'ct.a'], ['ct.b', 'm.osc_e'],
            ['m.out_a', 'co.a'], ['co.b', 'ep.a'],
            ['bat.neg', 'earth.earth', 'm.gnd', 'cb.b', 'l.a', 'tc.b', 'ep.b', 'cs.neg'],
        ],
        open: ['l.c1', 'l.c2', 'm.out_b'],
    },

    // Synchronous detector: the station in a ferrite-rod tank (antenna on the
    // tap, tuning capacitor across the main winding); the coupling winding
    // across the mixer's inputs, and the tank's top — the same station,
    // much larger — through 47 pF and the SYNC switch onto the oscillator
    // base, which is the LO pin. The station's carrier then switches the
    // mixer with its own phase: every half-wave of the input is passed with
    // the right sign, and output A carries the programme. 100 nF into the
    // LM386 (10 kΩ to ground at its input), its output through 220 µF to the
    // loudspeaker.
    'lab-sync-detector': {
        vcc: 6, supply: SUP,
        parts: { bat: BAT6, ant: ['antenna', { stations: [
                { id: 'am', name: 'AM 612 kHz', hz: 612e3, fieldVPerM: 0.02, depth: 0.5, audio: { type: 'tone', hz: 1000 } }] }],
            earth: ['earth', {}], l: ['ferrite_coil', { rodHeightM: 0, couplingRatio: 0.1 }], tc: TUNE(0.5317),
            sync: ['switch', {}], ck: C(47e-12), m: MIX,
            co: C(10e-9), ca: C(100e-9), ri: R(10000), u: ['lm386', {}], cs: EL(100e-6), cspk: EL(220e-6), spk: ['speaker', { ohms: 8 }] },
        nets: [
            ['ant.a', 'l.tap'], ['l.b', 'tc.a', 'sync.a'], ['sync.b', 'ck.a'], ['ck.b', 'm.osc_b'],
            ['l.c1', 'm.in_a'], ['l.c2', 'm.in_b'],
            ['bat.pos', 'm.vcc', 'u.vs', 'cs.pos'],
            ['m.out_a', 'co.a', 'ca.a'], ['ca.b', 'u.inp', 'ri.a'], ['u.vout', 'cspk.pos'], ['cspk.neg', 'spk.a'],
            ['bat.neg', 'earth.earth', 'l.a', 'tc.b', 'm.gnd', 'co.b', 'ri.b', 'u.gnd', 'u.inn', 'cs.neg', 'spk.b'],
        ],
        open: ['m.osc_e', 'm.out_b', 'u.gain1', 'u.gain8', 'u.bypass'],
    },

    // Direct conversion, and how steady an oscillator is. A Meissner
    // transmitter (rod LT, tank 10 pF + 490 pF × 0.3 → about 800 kHz; the
    // coupling winding in the base lead, 47 k / 10 k divider held by 10 nF,
    // 1 kΩ ‖ 1 nF in the emitter) runs from its own supply through the
    // SUPPLY slide switch: 9 V (left) or 6 V (right). A wire from its
    // collector running past the receiver (2.2 pF) brings it to the mixer's
    // input A (input B bypassed). The mixer's own oscillator runs on a
    // third rod with its own tuning capacitor (tapped coil: top to the
    // oscillator base through 10 nF, tap to the emitter through 10 nF). The
    // two oscillators' difference comes out of output A, through 100 nF
    // into the LM386 (10 kΩ to ground at +IN) and the loudspeaker. Turning
    // either tuning knob moves the pitch through zero beat; changing the
    // transmitter's supply moves it too (the transistor's capacitances change
    // with its current).
    'lab-mixer-direct-conversion': {
        vcc: 6, supply: SUP,
        parts: { bat: BAT6, btx: ['vsource', { volts: 9 }], btx2: BAT6, vsel: ['slide_switch', { position: 0 }],
            lt: ['ferrite_coil', { rodHeightM: 0, couplingRatio: 0.05 }], tct: TUNE(0.3), q: NPN,
            r1: R(47000), r2: R(10000), cb: C(10e-9), re: R(1000), ce: C(1e-9),
            cx: C(2.2e-12), cin: C(100e-9),
            m: MIX, l2: ['ferrite_coil', { rodHeightM: 0 }], tc2: TUNE(0.3), ck: C(10e-9), ct: C(10e-9),
            co: C(22e-9), ca: C(100e-9), ri: R(10000), u: ['lm386', {}], cs: EL(100e-6), cspk: EL(220e-6), spk: ['speaker', { ohms: 8 }] },
        nets: [
            ['btx.pos', 'vsel.a'], ['btx2.pos', 'vsel.b'], ['vsel.com', 'lt.a', 'tct.a', 'r1.a'],
            ['q.collector', 'lt.b', 'tct.b', 'cx.a'], ['r1.b', 'r2.a', 'cb.a', 'lt.c2'], ['q.base', 'lt.c1'], ['q.emitter', 're.a', 'ce.a'],
            ['cx.b', 'm.in_a'], ['m.in_b', 'cin.a'],
            ['bat.pos', 'm.vcc', 'u.vs', 'cs.pos'],
            ['m.osc_b', 'ck.a'], ['ck.b', 'l2.b', 'tc2.a'], ['l2.tap', 'ct.a'], ['ct.b', 'm.osc_e'],
            ['m.out_a', 'co.a', 'ca.a'], ['ca.b', 'u.inp', 'ri.a'], ['u.vout', 'cspk.pos'], ['cspk.neg', 'spk.a'],
            ['bat.neg', 'btx.neg', 'btx2.neg', 'r2.b', 'cb.b', 're.b', 'ce.b', 'cin.b', 'm.gnd', 'l2.a', 'tc2.b', 'co.b', 'ri.b',
                'u.gnd', 'u.inn', 'cs.neg', 'spk.b'],
        ],
        open: ['lt.tap', 'l2.c1', 'l2.c2', 'm.out_b', 'u.gain1', 'u.gain8', 'u.bypass'],
    },

    // The beat as a stroboscope: mains hum from a wire near a cable (the
    // field probe, 5 pF at the closest) through 100 nF into a transistor
    // amplifier (1 MΩ collector-to-base, 10 kΩ load) and a second, squaring
    // stage (220 kΩ, 4.7 kΩ): a 50 Hz square wave, through 10 kΩ into input
    // A (input B on a half-supply divider through 4.7 kΩ). An LM386
    // relaxation oscillator (150 nF, 15 kΩ plus the RATE pot of 20 kΩ:
    // about 45–78 Hz) switches the LO pin through 4.7 kΩ. The two square
    // waves' product, smoothed by 22 µF across each output's load, swings at
    // their difference frequency; a voltmeter between the two outputs
    // swings from one side to the other a few times a second when
    // the oscillator runs a few hertz from the mains, slower and slower
    // towards zero beat.
    'lab-mixer-strobe': {
        vcc: 6, supply: SUP,
        parts: { bat: BAT6, pr: ['field_probe', { source: 'mains', position: 0.5, maxFarads: 5e-12 }], c1: C(100e-9),
            q1: NPN, rb1: R(1000000), rc1: R(10000), c2: C(1e-6), q2: NPN, rb2: R(220000), rc2: R(4700), rk: R(10000),
            m: MIX, rbb: R(4700), rd1: R(10000), rd2: R(10000),
            u: ['lm386', {}], cf: C(150e-9), rb: R(15000), rate: POT(20000, 0), rl: R(4700),
            coa: EL(22e-6), cob: EL(22e-6), vm: ['voltmeter', {}] },
        nets: [
            ['bat.pos', 'u.vs', 'm.vcc', 'rc1.a', 'rc2.a', 'rd1.a', 'coa.pos', 'cob.pos'],
            ['pr.a', 'c1.a'], ['c1.b', 'q1.base', 'rb1.b'], ['q1.collector', 'rb1.a', 'rc1.b', 'c2.a'], ['c2.b', 'q2.base', 'rb2.b'],
            ['q2.collector', 'rb2.a', 'rc2.b', 'rk.a'], ['rk.b', 'm.in_a'], ['rbb.b', 'm.in_b'], ['rbb.a', 'rd1.b', 'rd2.a'],
            ['u.vout', 'cf.a', 'rl.a'], ['cf.b', 'u.inp', 'rb.a'], ['rb.b', 'rate.a'], ['rl.b', 'm.osc_b'],
            ['m.out_a', 'coa.neg', 'vm.b'], ['m.out_b', 'cob.neg', 'vm.a'],
            ['bat.neg', 'u.gnd', 'u.inn', 'rate.wiper', 'rd2.b', 'm.gnd', 'q1.emitter', 'q2.emitter'],
        ],
        open: ['u.gain1', 'u.gain8', 'u.bypass', 'm.osc_e', 'rate.b'],
    },

    // Metal detector against the mixer receiver. A Colpitts search
    // oscillator around a hand-wound coil (30 turns, 10 cm across, ≈ 137 µH;
    // 22 nF collector-to-emitter, 220 nF emitter-to-ground, 4.7 kΩ emitter
    // resistor, base held by 22 k / 10 k and 100 nF) near 96 kHz. A wire
    // running past it (4.7 pF from the collector) brings it to the mixer's
    // input A (input B bypassed). The mixer's own oscillator
    // runs on a second rod (272 µH with 10 nF and the tuning capacitor:
    // about 94–96 kHz) as a tapped-coil oscillator. Their difference, from
    // output A, is the tone in a crystal earphone (22 nF across it). Metal
    // near the search coil lowers its inductance: the search oscillator
    // rises and the tone moves.
    'lab-mixer-metal-detector': {
        vcc: 6, supply: SUP,
        parts: { bat: BAT6,
            ls: ['air_coil', { turns: 30, radiusM: 0.05, lengthM: 0.02, wireMm: 0.5 }], c1s: C(22e-9), c2s: C(220e-9),
            qs: NPN, res: R(4700), ras: R(22000), rbs: R(10000), cbs: C(100e-9),
            cx: C(4.7e-12), cin: C(100e-9),
            m: MIX, l2: ['ferrite_coil', { rodHeightM: 0, henrys: 272e-6 }], cf2: C(10e-9), tc2: TUNE(0.5), ck: C(10e-9), ct: C(10e-9),
            co: C(22e-9), ep: ['earphone', { type: 'crystal' }] },
        nets: [
            ['bat.pos', 'ls.a', 'ras.a', 'm.vcc'],
            ['ls.b', 'qs.collector', 'c1s.a', 'cx.a'], ['c1s.b', 'c2s.a', 'qs.emitter', 'res.a'], ['ras.b', 'rbs.a', 'cbs.a', 'qs.base'],
            ['cx.b', 'm.in_a'], ['m.in_b', 'cin.a'],
            ['m.osc_b', 'ck.a'], ['ck.b', 'l2.b', 'cf2.a', 'tc2.a'], ['l2.tap', 'ct.a'], ['ct.b', 'm.osc_e'],
            ['m.out_a', 'co.a', 'ep.a'],
            ['bat.neg', 'c2s.b', 'res.b', 'rbs.b', 'cbs.b', 'cin.b', 'm.gnd', 'l2.a', 'cf2.b', 'tc2.b', 'co.b', 'ep.b'],
        ],
        open: ['l2.c1', 'l2.c2', 'm.out_b'],
    },

    // The mixer as an RF differential amplifier in a straight receiver. The
    // station in a ferrite-rod tank (antenna on the tap); the coupling
    // winding onto gate 1 of a depletion dual-gate MOSFET, its other end on
    // a 47 k / 33 k divider (about 2.5 V, held by 100 nF). 470 Ω from the
    // source to a stiff ~1.9 V reference (330 Ω / 150 Ω across the supply,
    // 100 µF) and 470 Ω from the supply to the drain: source
    // and drain carry the station in antiphase, and through 100 nF each they drive the mixer's inputs B
    // and A. Gate 2 on the GAIN pot (10 kΩ across the supply, 100 nF to
    // ground): the RF gain control. The source never falls below the ~1.9 V
    // reference, so gate 2 turned towards 0 V lies more than the pinch-off
    // voltage (−1.2 V) below the channel and shuts it: the gain falls to
    // nothing. The mixer's oscillator is blocked — its
    // base pulled to the supply through 4.7 kΩ — so its switching quad stays
    // in one state and the chip simply amplifies. The OUTPUT slide switch
    // takes output A (left) or B (right) — the same RF upside down — through
    // 10 nF to a germanium detector (2.2 nF ‖ 47 kΩ), then 100 nF into the
    // LM386 and the loudspeaker.
    'lab-mixer-diff-amp': {
        vcc: 6, supply: SUP,
        parts: { bat: BAT6, ant: ['antenna', { stations: [
                { id: 'am', name: 'AM 612 kHz', hz: 612e3, fieldVPerM: 0.005, depth: 0.5, audio: { type: 'tone', hz: 1000 } }] }],
            earth: ['earth', {}], l: ['ferrite_coil', { rodHeightM: 0, couplingRatio: 0.2 }], tc: TUNE(0.5317),
            fet: ['dual_gate_mosfet', {}], rs: R(470), rd: R(470), rg1: R(47000), rg2: R(33000), cg1: C(100e-9),
            rr1: R(330), rr2: R(150), cref: EL(100e-6),
            gain: POT(10000, 0.5), cg2: C(100e-9), csa: C(100e-9), cda: C(100e-9),
            m: MIX, rlo: R(4700), osel: ['slide_switch', { position: 0 }], ck: C(10e-9), d: ['diode', { part: '1N34A' }], cd: C(2.2e-9), rdd: R(47000),
            ca: C(100e-9), ri: R(10000), u: ['lm386', {}], cs: EL(100e-6), cspk: EL(220e-6), spk: ['speaker', { ohms: 8 }] },
        nets: [
            ['ant.a', 'l.tap'], ['l.b', 'tc.a'], ['l.c1', 'fet.gate1'], ['l.c2', 'rg1.b', 'rg2.a', 'cg1.a'],
            ['fet.source', 'rs.a', 'csa.a'], ['rs.b', 'rr1.b', 'rr2.a', 'cref.pos'],
            ['fet.drain', 'rd.b', 'cda.a'], ['csa.b', 'm.in_b'], ['cda.b', 'm.in_a'],
            ['gain.wiper', 'fet.gate2', 'cg2.a'],
            ['bat.pos', 'rd.a', 'rg1.a', 'rr1.a', 'gain.b', 'm.vcc', 'rlo.a', 'u.vs', 'cs.pos'], ['rlo.b', 'm.osc_b'],
            ['m.out_a', 'osel.a'], ['m.out_b', 'osel.b'], ['osel.com', 'ck.a'], ['ck.b', 'd.anode'], ['d.cathode', 'cd.a', 'rdd.a', 'ca.a'], ['ca.b', 'u.inp', 'ri.a'],
            ['u.vout', 'cspk.pos'], ['cspk.neg', 'spk.a'],
            ['bat.neg', 'earth.earth', 'l.a', 'tc.b', 'rg2.b', 'cg1.b', 'rr2.b', 'cref.neg', 'gain.a', 'cg2.b', 'm.gnd', 'cd.b', 'rdd.b', 'ri.b', 'u.gnd', 'u.inn', 'cs.neg', 'spk.b'],
        ],
        open: ['m.osc_e', 'u.gain1', 'u.gain8', 'u.bypass'],
    },

};

// Resolve '@name' params to engine ids.
for (const spec of Object.values(BENCHES)) {
    const ids = benchIds(spec);
    for (const [, params] of Object.values(spec.parts))
        for (const [k, v] of Object.entries(params || {}))
            if (typeof v === 'string' && v.startsWith('@')) params[k] = ids[v.slice(1)];
}
