/**
 * Netlists for the lab-* benches on the engine's room fields and junction
 * noise (bw-board src/fields.js): a bare-wire `field_probe` near mains wiring,
 * a charged ruler or a finger, and a transistor whose base-emitter junction is
 * driven into reverse breakdown (`bvEbo`) as a noise source. Written by
 * `node scripts/gen-lab-circuits-4.mjs --set=fields`.
 *
 * Same shape as lab-benches-4.mjs: pure data, so
 * test/lab-circuits-fields.test.mjs names parts by role. Ids follow benchIds
 * (breadboard first, then the parts in the order listed).
 *
 * A field probe's knob is how close its source is (0 far, 1 closest); a knob
 * change is a hand moving over 0.2 s. The noise benches narrow the simulated
 * noise band to 1 kHz (`noiseBandwidthHz`): every kilohertz of noise costs
 * transient steps, and the earphone reports the sound as noise (the app plays
 * it as hiss) whatever the band.
 */
import { benchIds } from './lab-benches-4.mjs';
export { benchIds };

const SUP = { pos: 'bat.pos', neg: 'bat.neg' };
const R = (ohms) => ['resistor', { ohms }];
const C = (farads) => ['capacitor', { farads }];
const EL = (farads) => ['polarized_cap', { farads }];
const LED = (color) => ['led', { vf: 2, color }];
const NPN = ['npn', { beta: 200 }];
const PNP = ['pnp', { beta: 200 }];
const BAT9 = ['vsource', { volts: 9, variant: '9v' }];
const NOISE_Q = ['npn', { beta: 200, bvEbo: 7.5, noiseBandwidthHz: 1000 }];
const EAR = ['earphone', { type: 'magnetic', ohms: 2000, henrys: 0.1 }];

export const BENCHES = {
    // Noise source: 47 kΩ from 9 V into the emitter of a transistor whose base
    // is grounded and collector open; the B-E junction breaks down at 7.5 V
    // and carries ~30 µA of avalanche current. 100 nF takes its hiss to a
    // common-emitter stage (470 kΩ collector feedback, 4.7 kΩ), 1 µF to a
    // second one (470 Ω in its emitter, so it does not clip) whose collector
    // load is the magnetic earphone.
    'lab-noise-hiss': {
        vcc: 9, supply: SUP,
        parts: { bat: BAT9, r1: R(47000), qn: NOISE_Q, c1: C(100e-9), q2: NPN, rb2: R(470000), rc2: R(4700),
            c2: C(1e-6), q3: NPN, rb3: R(470000), re3: R(470), ep: EAR },
        nets: [
            ['bat.pos', 'r1.a', 'rc2.a', 'ep.a'], ['r1.b', 'qn.emitter', 'c1.a'], ['c1.b', 'q2.base', 'rb2.b'],
            ['q2.collector', 'rb2.a', 'rc2.b', 'c2.a'], ['c2.b', 'q3.base', 'rb3.b'], ['q3.collector', 'rb3.a', 'ep.b'],
            ['q3.emitter', 're3.a'], ['bat.neg', 'qn.base', 'q2.emitter', 're3.b'],
        ],
        open: ['qn.collector'],
    },

    // Steam train: the same hiss, but the noise junction is fed from one
    // collector of a two-transistor astable (2.2 kΩ, 100 kΩ, 2.2 µF: about
    // 3 Hz). While that transistor is off its collector is near 9 V and the
    // junction breaks down; while it conducts the junction is dead: chuff,
    // chuff. 10 nF into the amplifier keeps the slow gate edges out.
    'lab-steam-train': {
        vcc: 9, supply: SUP,
        parts: { bat: BAT9, ra: R(2200), rb: R(2200), rba: R(100000), rbb: R(100000), ca: EL(2.2e-6), cb: EL(2.2e-6),
            qa: NPN, qb: NPN, r1: R(47000), qn: NOISE_Q, c1: C(10e-9), q2: NPN, rb2: R(470000), rc2: R(4700),
            c2: C(100e-9), q3: NPN, rb3: R(470000), re3: R(470), ep: EAR },
        nets: [
            ['bat.pos', 'ra.a', 'rb.a', 'rba.a', 'rbb.a', 'rc2.a', 'ep.a'],
            ['qa.collector', 'ra.b', 'ca.pos'], ['ca.neg', 'qb.base', 'rbb.b'],
            ['qb.collector', 'rb.b', 'cb.pos', 'r1.a'], ['cb.neg', 'qa.base', 'rba.b'],
            ['r1.b', 'qn.emitter', 'c1.a'], ['c1.b', 'q2.base', 'rb2.b'],
            ['q2.collector', 'rb2.a', 'rc2.b', 'c2.a'], ['c2.b', 'q3.base', 'rb3.b'], ['q3.collector', 'rb3.a', 'ep.b'],
            ['q3.emitter', 're3.a'], ['bat.neg', 'qa.emitter', 'qb.emitter', 'qn.base', 'q2.emitter', 're3.b'],
        ],
        open: ['qn.collector'],
    },

    // Brush drum: the hiss runs all the time, but the output stage's supply
    // is a 10 µF capacitor that the button tops up through 100 Ω. Released,
    // the capacitor drains through the earphone and the output transistor
    // within a few tenths of a second, and the hiss fades with it: "tsch".
    'lab-noise-drum': {
        vcc: 9, supply: SUP,
        parts: { bat: BAT9, r1: R(47000), qn: NOISE_Q, c1: C(100e-9), q2: NPN, rb2: R(470000), rc2: R(4700),
            c2: C(1e-6), q3: NPN, rb3: R(470000), re3: R(470), ep: EAR, hit: ['button', {}], rs: R(100), ce: EL(10e-6) },
        nets: [
            ['bat.pos', 'r1.a', 'rc2.a', 'hit.a'], ['hit.b', 'rs.a'], ['rs.b', 'ce.pos', 'ep.a'],
            ['r1.b', 'qn.emitter', 'c1.a'], ['c1.b', 'q2.base', 'rb2.b'],
            ['q2.collector', 'rb2.a', 'rc2.b', 'c2.a'], ['c2.b', 'q3.base', 'rb3.b'], ['q3.collector', 'rb3.a', 'ep.b'],
            ['q3.emitter', 're3.a'], ['bat.neg', 'qn.base', 'q2.emitter', 're3.b', 'ce.neg'],
        ],
        open: ['qn.collector'],
    },

    // Hum finder: a bare wire (5 pF to the cable at the closest) on the
    // LM386's +IN. Pins 1–8: 10 µF through a slide switch, straight to pin 8
    // (left: gain 200) or through 1.2 kΩ (right: less gain, less hum). Pin 7
    // bypassed, 220 µF into the loudspeaker, 100 µF across the supply.
    'lab-hum-finder': {
        vcc: 9, supply: SUP,
        parts: { bat: BAT9, pr: ['field_probe', { source: 'mains', position: 0.5, maxFarads: 5e-12 }],
            u: ['lm386', {}], cg: EL(10e-6), sw: ['slide_switch', { position: 0 }], rg: R(1200),
            cb: EL(10e-6), co: EL(220e-6), spk: ['speaker', { ohms: 8 }], cs: EL(100e-6) },
        nets: [
            ['pr.a', 'u.inp'], ['u.gain1', 'cg.pos'], ['cg.neg', 'sw.com'], ['sw.a', 'u.gain8', 'rg.b'], ['sw.b', 'rg.a'],
            ['u.bypass', 'cb.pos'], ['bat.pos', 'u.vs', 'cs.pos'], ['u.vout', 'co.pos'], ['co.neg', 'spk.a'],
            ['bat.neg', 'u.gnd', 'u.inn', 'cb.neg', 'spk.b', 'cs.neg'],
        ],
    },

    // Body hum: a touch plate (the finger touches through ~1 MΩ of skin;
    // the knob is the touch) into a two-stage AC amplifier, earphone in the
    // second collector. The body is a few volts of 50 Hz against the room.
    'lab-body-hum': {
        vcc: 9, supply: SUP,
        parts: { bat: BAT9, pr: ['field_probe', { source: 'body', contact: 'skin', position: 0, skinOhms: 1e6 }],
            c1: C(100e-9), q2: NPN, rb2: R(1000000), rc2: R(4700), c2: C(1e-6), q3: NPN, rb3: R(470000), ep: EAR },
        nets: [
            ['pr.a', 'c1.a'], ['c1.b', 'q2.base', 'rb2.b'], ['bat.pos', 'rc2.a', 'ep.a'],
            ['q2.collector', 'rb2.a', 'rc2.b', 'c2.a'], ['c2.b', 'q3.base', 'rb3.b'], ['q3.collector', 'rb3.a', 'ep.b'],
            ['bat.neg', 'q2.emitter', 'q3.emitter'],
        ],
    },

    // Static detector: a bare wire on the base of a Darlington; a rubbed
    // ruler (10 kV, 0.1 pF at the closest) moved toward it pushes nanoamps
    // into the base while it moves, and the LED glows for that long.
    'lab-static-detector': {
        vcc: 9, supply: SUP,
        parts: { bat: BAT9, pr: ['field_probe', { source: 'charge', position: 0, rodVolts: 10000, maxFarads: 1e-13 }],
            q1: NPN, q2: NPN, rl: R(1000), led: LED('red') },
        nets: [
            ['pr.a', 'q1.base'], ['q1.emitter', 'q2.base'], ['bat.pos', 'rl.a'], ['rl.b', 'led.anode'],
            ['led.cathode', 'q1.collector', 'q2.collector'], ['bat.neg', 'q2.emitter'],
        ],
    },

    // MOSFET field sensor: a longer wire (20 pF of its own) on an n-MOSFET
    // gate; nothing drains the gate, so the charge a ruler (2 kV) induces
    // stays while the ruler stays. LED and 1 kΩ in the drain.
    'lab-mosfet-field': {
        vcc: 9, supply: SUP,
        parts: { bat: BAT9, pr: ['field_probe', { source: 'charge', position: 0, rodVolts: 2000, maxFarads: 1e-13, strayFarads: 20e-12 }],
            m: ['nmos', { vth: 2 }], rl: R(1000), led: LED('green') },
        nets: [
            ['pr.a', 'm.gate'], ['bat.pos', 'rl.a'], ['rl.b', 'led.anode'], ['led.cathode', 'm.drain'], ['bat.neg', 'm.source'],
        ],
    },

    // Electroscope: a small-signal MOSFET (k 2 mA/V²) whose gate a button
    // presets to 2.9 V from a 100 kΩ / 47 kΩ divider (about 1.5 mA: the LED
    // glows at half brightness), then left floating. A positively charged
    // ruler (1 kV) raises the gate and the LED brightens; a negatively
    // charged one (rodVolts −1000) lowers it and the LED dims.
    'lab-electroscope': {
        vcc: 9, supply: SUP,
        parts: { bat: BAT9, pr: ['field_probe', { source: 'charge', position: 0, rodVolts: 1000, maxFarads: 1e-13, strayFarads: 20e-12 }],
            set: ['button', {}], rt: R(100000), rbt: R(47000), m: ['nmos', { vth: 2, k: 0.002 }], rl: R(1000), led: LED('yellow') },
        nets: [
            ['bat.pos', 'rt.a', 'rl.a'], ['rt.b', 'rbt.a', 'set.a'], ['set.b', 'pr.a', 'm.gate'],
            ['rl.b', 'led.anode'], ['led.cathode', 'm.drain'], ['bat.neg', 'rbt.b', 'm.source'],
        ],
    },

    // Touch through paper: a plate under paper (20 pF to the finger) on an
    // NPN base (1 MΩ to ground: the hum the plate's own stray capacitance brings stays below one base-emitter drop); its collector drives a PNP whose collector
    // lights the LED. The circuit runs from a mains adaptor (1 nF from its
    // common to the mains): pressing on the paper closes the loop to earth.
    'lab-touch-paper': {
        vcc: 9, supply: SUP,
        parts: { bat: BAT9, pr: ['field_probe', { source: 'body', contact: 'paper', position: 0, paperFarads: 20e-12, adaptorFarads: 1e-9 }],
            rl1: R(1000000), q1: NPN, rbp: R(100000), q2: PNP, rl: R(1000), led: LED('red') },
        nets: [
            ['pr.a', 'q1.base', 'rl1.a'], ['q1.collector', 'q2.base', 'rbp.b'], ['bat.pos', 'q2.emitter', 'rbp.a'],
            ['q2.collector', 'led.anode'], ['led.cathode', 'rl.a'], ['bat.neg', 'rl1.b', 'q1.emitter', 'rl.b'],
        ],
    },
    // Motor-boating: three common-emitter stages on one supply rail. The
    // output stage (100 Ω and the loudspeaker in its collector, ~35 mA) is
    // the big load. Slide switch `weak` (left: the battery straight onto the
    // rail; right: through 47 Ω, a run-down battery). Slide switch `dec`
    // feeds the first two stages either straight from the rail (left) or
    // through 1 kΩ with 470 µF to ground (right: decoupled). A rail that
    // gives way under the output current carries the output back into the
    // first stage through its collector resistor, the second stage inverts
    // it once more, and the loop runs away on its own.
    'lab-motorboat': {
        vcc: 9, supply: SUP,
        parts: { bat: BAT9, weak: ['slide_switch', { position: 1 }], rs: R(47), dec: ['slide_switch', { position: 0 }],
            rd: R(1000), cd: EL(470e-6), q1: NPN, rb1: R(1000000), rc1: R(10000), c12: C(1e-6),
            q2: NPN, rb2: R(470000), rc2: R(4700), c23: EL(10e-6), q3: NPN, rb3: R(22000), ro: R(100), spk: ['speaker', { ohms: 8 }] },
        nets: [
            ['bat.pos', 'weak.com'], ['weak.a', 'rs.b', 'dec.a', 'rd.a', 'ro.a'], ['weak.b', 'rs.a'],
            ['dec.b', 'rd.b', 'cd.pos'], ['dec.com', 'rc1.a', 'rc2.a'],
            ['q1.collector', 'rc1.b', 'rb1.a', 'c12.a'], ['q1.base', 'rb1.b'],
            ['c12.b', 'q2.base', 'rb2.b'], ['q2.collector', 'rc2.b', 'rb2.a', 'c23.pos'],
            ['c23.neg', 'q3.base', 'rb3.b'], ['q3.collector', 'rb3.a', 'spk.b'], ['spk.a', 'ro.b'],
            ['bat.neg', 'q1.emitter', 'q2.emitter', 'q3.emitter', 'cd.neg'],
        ],
    },
};
