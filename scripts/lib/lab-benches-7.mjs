/**
 * Netlists for the seventh set of lab-* benches: radio receivers on the
 * engine's radio front end (antenna, earth, tuning capacitor, ferrite-rod
 * coil, germanium detector diode) and the loudspeaker, written by
 * `node scripts/gen-lab-circuits-4.mjs --set=7`.
 *
 * Same shape as lab-benches-4.mjs: pure data, so test/lab-circuits-7.test.mjs
 * names parts by role. Ids follow benchIds (breadboard first, then the parts
 * in the order listed).
 *
 * The engine solves the carrier as phasors and detection as the cycle-averaged
 * junction law, so a receiver is cheap in audio time but each millisecond is
 * still a full transient step sequence: the scenario tests keep the simulated
 * time to tens of milliseconds. Without an `antenna` `stations` param a bench
 * hears the engine's default broadcast: 612 kHz (400 Hz tone), 810 kHz (600
 * and 900 Hz alternating every 0.2 s) and 1215 kHz (1 kHz tone).
 */
import { benchIds } from './lab-benches-4.mjs';
export { benchIds };

const SUP = { pos: 'bat.pos', neg: 'bat.neg' };
const R = (ohms) => ['resistor', { ohms }];
const C = (farads) => ['capacitor', { farads }];
const EL = (farads) => ['polarized_cap', { farads }];
const NPN = ['npn', { beta: 100 }];
const BAT9 = ['vsource', { volts: 9, variant: '9v' }];
const GE = ['diode', { part: '1N34A' }];
const COIL = ['ferrite_coil', {}];
const TUNE = (position) => ['tuning_cap', { minFarads: 10e-12, maxFarads: 500e-12, position }];

export const BENCHES = {
    // Crystal set: the antenna on the coil's tap, the coil's cold end and the
    // earth on ground, the tuning capacitor across the whole winding. The
    // germanium diode takes the tank's top into 47 kΩ ‖ 2.2 nF (the envelope
    // detector) and a crystal earphone. No battery: the station powers it.
    'lab-crystal-set': {
        parts: { gnd: ['gnd', {}], ant: ['antenna', {}], earth: ['earth', {}], l: COIL, tc: TUNE(0.5),
            d: GE, cd: C(2.2e-9), rd: R(47000), ep: ['earphone', { type: 'crystal' }] },
        nets: [
            ['ant.a', 'l.tap'], ['l.b', 'tc.a', 'd.anode'], ['d.cathode', 'cd.a', 'rd.a', 'ep.a'],
            ['gnd.gnd', 'earth.earth', 'l.a', 'tc.b', 'cd.b', 'rd.b', 'ep.b'],
        ],
        open: ['l.c1', 'l.c2'],
    },

    // One-transistor receiver: the coupling winding feeds the base; its other
    // end is biased from 9 V through 1 MΩ and held still by 100 nF. The
    // base-emitter junction detects, the collector amplifies the audio into a
    // magnetic earphone, 10 nF bypasses what is left of the carrier.
    'lab-one-transistor-radio': {
        vcc: 9, supply: SUP,
        parts: { bat: BAT9, gnd: ['gnd', {}], ant: ['antenna', {}], earth: ['earth', {}], l: COIL, tc: TUNE(0.5),
            rb: R(1000000), cb: C(100e-9), q: NPN, ep: ['earphone', { type: 'magnetic', ohms: 2000, henrys: 0.1 }], cc: C(10e-9) },
        nets: [
            ['ant.a', 'l.tap'], ['l.b', 'tc.a'], ['l.c1', 'q.base'], ['l.c2', 'rb.b', 'cb.a'],
            ['bat.pos', 'rb.a', 'ep.b'], ['q.collector', 'ep.a', 'cc.a'],
            ['bat.neg', 'gnd.gnd', 'earth.earth', 'l.a', 'tc.b', 'cb.b', 'q.emitter', 'cc.b'],
        ],
    },

    // Reflex receiver: one transistor, two jobs. The coupling winding feeds the
    // base (bias 470 kΩ, held at RF by 100 nF); the amplified carrier stands
    // across a 2.5 mH choke in the collector and reaches a germanium detector
    // through 1 nF (47 kΩ to ground at its anode). The detected audio
    // (47 kΩ ‖ 2.2 nF) goes back through 100 nF to the bottom of the coupling
    // winding, so the same transistor amplifies it a second time into the
    // earphone below the choke (10 nF carrier bypass). Emitter 1 kΩ ‖ 10 µF.
    'lab-reflex-radio': {
        vcc: 9, supply: SUP,
        parts: { bat: BAT9, gnd: ['gnd', {}], ant: ['antenna', { heightM: 1 }], earth: ['earth', {}], l: COIL, tc: TUNE(0.5),
            rb: R(470000), cb: C(100e-9), q: NPN, re: R(1000), ce: EL(10e-6), cer: C(100e-9),
            ch: ['inductor', { henrys: 2.5e-3 }], ep: ['earphone', { type: 'magnetic', ohms: 2000, henrys: 0.1 }], cep: C(10e-9),
            ck: C(1e-9), rk: R(47000), d: GE, rd: R(47000), cd: C(2.2e-9), ca: C(100e-9) },
        nets: [
            ['ant.a', 'l.tap'], ['l.b', 'tc.a'], ['l.c1', 'q.base'], ['l.c2', 'rb.b', 'cb.a', 'ca.b'],
            ['bat.pos', 'rb.a', 'ep.b'], ['q.emitter', 're.a', 'ce.pos', 'cer.a'],
            ['q.collector', 'ch.a', 'ck.a'], ['ch.b', 'ep.a', 'cep.a'],
            ['ck.b', 'rk.a', 'd.anode'], ['d.cathode', 'rd.a', 'cd.a', 'ca.a'],
            ['bat.neg', 'gnd.gnd', 'earth.earth', 'l.a', 'tc.b', 'cb.b', 're.b', 'ce.neg', 'cer.b', 'cep.b', 'rk.b', 'rd.b', 'cd.b'],
        ],
    },

    // The crystal set's detector into an LM386 (gain 20): 100 nF into +IN,
    // the output through 220 µF into an 8 Ω loudspeaker.
    'lab-radio-loudspeaker': {
        vcc: 9, supply: SUP,
        parts: { bat: BAT9, gnd: ['gnd', {}], ant: ['antenna', {}], earth: ['earth', {}], l: COIL, tc: TUNE(0.5),
            d: GE, cd: C(2.2e-9), rd: R(47000), ci: C(100e-9), u: ['lm386', {}],
            co: EL(220e-6), spk: ['speaker', { ohms: 8 }] },
        nets: [
            ['ant.a', 'l.tap'], ['l.b', 'tc.a', 'd.anode'], ['d.cathode', 'cd.a', 'rd.a', 'ci.a'], ['ci.b', 'u.inp'],
            ['bat.pos', 'u.vs'], ['u.vout', 'co.pos'], ['co.neg', 'spk.a'],
            ['bat.neg', 'gnd.gnd', 'earth.earth', 'l.a', 'tc.b', 'cd.b', 'rd.b', 'u.gnd', 'u.inn', 'spk.b'],
        ],
        open: ['l.c1', 'l.c2', 'u.gain1', 'u.gain8', 'u.bypass'],
    },

    // Two stations 9 kHz apart (the medium-wave channel spacing): the local
    // one with a 400 Hz tone, and a neighbour that is only a carrier (a
    // station between programmes). Both reach the detector and their carriers
    // beat: a 9 kHz whistle on top of the tone. A third station 90 kHz away
    // plays a 1 kHz tone. A slide switch moves the antenna from the coil's
    // tap (left) to its top (right): there it loads the tank harder, the
    // tuning gets broader and the other stations come through more.
    'lab-radio-whistle': {
        parts: { gnd: ['gnd', {}],
            ant: ['antenna', { stations: [
                { id: 'local', name: 'Local 612 kHz', hz: 612e3, fieldVPerM: 0.02, depth: 0.5, audio: { type: 'tone', hz: 400 } },
                { id: 'next', name: 'Neighbour 621 kHz', hz: 621e3, fieldVPerM: 0.01, depth: 0, audio: { type: 'none' } },
                { id: 'far', name: 'Far 702 kHz', hz: 702e3, fieldVPerM: 0.02, depth: 0.5, audio: { type: 'tone', hz: 1000 } },
            ] }],
            sw: ['slide_switch', { position: 0 }], earth: ['earth', {}], l: COIL, tc: TUNE(0.51),
            d: GE, cd: C(2.2e-9), rd: R(47000), ep: ['earphone', { type: 'crystal' }] },
        nets: [
            ['ant.a', 'sw.com'], ['sw.a', 'l.tap'], ['sw.b', 'l.b', 'tc.a', 'd.anode'], ['d.cathode', 'cd.a', 'rd.a', 'ep.a'],
            ['gnd.gnd', 'earth.earth', 'l.a', 'tc.b', 'cd.b', 'rd.b', 'ep.b'],
        ],
        open: ['l.c1', 'l.c2'],
    },
};
