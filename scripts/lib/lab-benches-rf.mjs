/**
 * Netlists for the round-4 radio benches: direction finding with the ferrite
 * rod as a turnable antenna, a station broadcasting a tune, a receiver
 * switched on by daylight, a regenerative receiver driven past its
 * oscillation threshold, and FM received on the slope of a varicap-tuned VHF
 * circuit. Written by `node scripts/gen-lab-circuits-4.mjs --set=rf`.
 *
 * Same shape as lab-benches-7.mjs: pure data, so test/lab-circuits-rf.test.mjs
 * names parts by role. Ids follow benchIds (breadboard first, then the parts
 * in the order listed).
 *
 * The engine carries every RF signal as a complex envelope around the
 * circuit's resonances, integrated in time (bw-board src/radio.js,
 * src/rf-bands.js); stations carry bearings and a ferrite rod picks them up
 * with |cos(angle − bearing)|.
 */
import { benchIds } from './lab-benches-4.mjs';
export { benchIds };

const SUP = { pos: 'bat.pos', neg: 'bat.neg' };
const R = (ohms) => ['resistor', { ohms }];
const C = (farads) => ['capacitor', { farads }];
const NPN = ['npn', { beta: 100 }];
const BAT9 = ['vsource', { volts: 9, variant: '9v' }];
const GE = ['diode', { part: '1N34A' }];
const VHF = ['npn', { part: 'BF199' }];

const POT = (ohms, position) => ['potentiometer', { ohms, position }];
const TUNE = (position) => ['tuning_cap', { minFarads: 10e-12, maxFarads: 500e-12, position }];
const EP = ['earphone', { type: 'magnetic', ohms: 2000, henrys: 0.1 }];

export const BENCHES = {
    // How AM carries music: a crystal set (germanium detector into 47 kΩ ‖
    // 2.2 nF and a crystal earphone; no battery, the station powers it). The
    // antenna's broadcast is a single station playing a short tune,
    // repeating.
    'lab-am-music': {
        parts: { gnd: ['gnd', {}],
            ant: ['antenna', { stations: [{ id: 'music', name: 'Music 612 kHz', hz: 612e3, fieldVPerM: 0.02, depth: 0.6,
                audio: { type: 'melody', notes: [[392, 0.12], [330, 0.12], [330, 0.12], [349, 0.12], [294, 0.12], [294, 0.12], [262, 0.24], [0, 0.12]] } }] }],
            earth: ['earth', {}], l: ['ferrite_coil', {}], tc: TUNE(0.5),
            d: GE, cd: C(2.2e-9), rd: R(47000), ep: ['earphone', { type: 'crystal' }] },
        nets: [
            ['ant.a', 'l.tap'], ['l.b', 'tc.a', 'd.anode'], ['d.cathode', 'cd.a', 'rd.a', 'ep.a'],
            ['gnd.gnd', 'earth.earth', 'l.a', 'tc.b', 'cd.b', 'rd.b', 'ep.b'],
        ],
        open: ['l.c1', 'l.c2'],
    },

    // The radio that switches on at dawn: the one-transistor receiver, its
    // emitter returned to ground through a switching transistor whose base
    // an LDR pulls up when light falls on it (dark: 1 MΩ, bright: 1 kΩ,
    // against 47 kΩ to ground).
    'lab-dawn-radio': {
        vcc: 9, supply: SUP,
        parts: { bat: BAT9, gnd: ['gnd', {}], ant: ['antenna', {}], earth: ['earth', {}], l: ['ferrite_coil', {}], tc: TUNE(0.5),
            rb: R(1000000), cb: C(100e-9), q: NPN, ep: EP, cc: C(10e-9),
            ldr: ['ldr', { rLight: 1000, rDark: 1000000 }], rs: R(47000), qs: NPN },
        nets: [
            ['ant.a', 'l.tap'], ['l.b', 'tc.a'], ['l.c1', 'q.base'], ['l.c2', 'rb.b', 'cb.a'],
            ['bat.pos', 'rb.a', 'ep.b', 'ldr.a'], ['q.collector', 'ep.a', 'cc.a'],
            ['q.emitter', 'qs.collector'], ['ldr.b', 'rs.a', 'qs.base'],
            ['bat.neg', 'gnd.gnd', 'earth.earth', 'l.a', 'tc.b', 'cb.b', 'cc.b', 'rs.b', 'qs.emitter'],
        ],
    },

    // Direction finding: no long wire; the ferrite rod is the antenna. Two
    // strong local stations from different directions (the rod's own
    // broadcast). The coupling winding feeds a transistor biased into light
    // conduction (2.2 MΩ, held by 10 nF); the RF its base junction rectifies
    // raises the collector current through a 1 mA meter. 10 nF bypasses the
    // carrier.
    'lab-direction-finder': {
        vcc: 9, supply: SUP,
        parts: { bat: BAT9, gnd: ['gnd', {}],
            l: ['ferrite_coil', { couplingRatio: 0.25, rodHeightM: 0.05, angleDeg: 0, stations: [
                { id: 'north', name: 'North 700 kHz', hz: 700e3, fieldVPerM: 0.3, depth: 0.3, bearingDeg: 0, audio: { type: 'tone', hz: 400 } },
                { id: 'east', name: 'East 1000 kHz', hz: 1000e3, fieldVPerM: 0.3, depth: 0.3, bearingDeg: 70, audio: { type: 'tone', hz: 800 } },
            ] }], tc: TUNE(0.4),
            rb: R(2200000), cb: C(10e-9), q: NPN, m: ['analog_meter', { mode: 'current', fullScale: 0.001 }], cc: C(10e-9) },
        nets: [
            ['l.b', 'tc.a'], ['l.c1', 'q.base'], ['l.c2', 'rb.b', 'cb.a'],
            ['bat.pos', 'rb.a', 'm.a'], ['m.b', 'q.collector', 'cc.a'],
            ['bat.neg', 'gnd.gnd', 'l.a', 'tc.b', 'cb.b', 'q.emitter', 'cc.b'],
        ],
        open: ['l.tap'],
    },

    // Regenerative receiver ("audion"). Tank: the main winding with the
    // tuning capacitor, antenna on the tap. 100 pF and 1 MΩ make the base a
    // grid-leak detector; the 1 MΩ comes from the regeneration pot, which
    // sets the collector current and so how much RF the small coupling
    // winding (in the collector lead, 4 % of the main turns) feeds back into
    // the tank. Emitter 1 kΩ bypassed by 100 nF; magnetic earphone below the
    // coupling winding with 10 nF to ground. One weak station.
    'lab-regen-receiver': {
        vcc: 9, supply: SUP,
        parts: { bat: BAT9, gnd: ['gnd', {}],
            ant: ['antenna', { heightM: 1, stations: [
                { id: 'local', name: 'Local 612 kHz', hz: 612e3, fieldVPerM: 0.005, depth: 0.5, audio: { type: 'tone', hz: 400 } },
            ] }], earth: ['earth', {}],
            l: ['ferrite_coil', { couplingRatio: 0.04 }], tc: TUNE(0.5),
            cb: C(100e-12), rb: R(1000000), rv: POT(100000, 0.9), q: NPN, re: R(1000), ce: C(100e-9),
            ep: EP, cc: C(10e-9) },
        nets: [
            ['ant.a', 'l.tap'], ['l.b', 'tc.a', 'cb.a'], ['cb.b', 'rb.b', 'q.base'], ['rb.a', 'rv.wiper'],
            ['q.emitter', 're.a', 'ce.a'], ['q.collector', 'l.c1'], ['l.c2', 'ep.a', 'cc.a'],
            ['bat.pos', 'rv.b', 'ep.b'],
            ['bat.neg', 'gnd.gnd', 'earth.earth', 'l.a', 'tc.b', 'rv.a', 're.b', 'ce.b', 'cc.b'],
        ],
    },

    // FM by slope detection. An FM station at 98 MHz (75 kHz deviation, a
    // 1 kHz tone) through a short antenna into a BF199 amplifier (base
    // divider 47 kΩ / 10 kΩ, emitter 470 Ω ‖ 1 nF). Its collector tank is an
    // air-core coil to 9 V with a varicap across it, tuned by the pot through
    // 100 kΩ (anode held at RF by 1 nF). A germanium detector through 10 pF
    // (47 kΩ DC return) into 10 kΩ ‖ 470 pF, then 1 µF into a one-transistor
    // audio amplifier and the earphone.
    'lab-fm-slope': {
        vcc: 9, supply: SUP,
        parts: { bat: BAT9, gnd: ['gnd', {}],
            ant: ['antenna', { heightM: 0.75, ohms: 75, farads: 3e-12, stations: [
                { id: 'fm', name: 'FM 98.0 MHz', hz: 98e6, mod: 'fm', deviationHz: 75e3, fieldVPerM: 0.05, audio: { type: 'tone', hz: 1000 } },
            ] }],
            q: VHF, r1: R(47000), r2: R(10000), re: R(470), ce: C(1e-9),
            l: ['air_coil', { henrys: 0.15e-6, q: 80 }], vd: ['varicap', { part: 'BB910' }], cv: C(1e-9), rt: R(100000), rv: POT(100000, 0.46),
            cd: C(10e-12), d: GE, rk: R(47000), rl: R(10000), cl: C(470e-12), ck: C(100e-9), rb: R(1000000), qa: NPN, ep: EP, cc: C(10e-9) },
        nets: [
            ['ant.a', 'q.base', 'r1.b', 'r2.a'], ['q.emitter', 're.a', 'ce.a'],
            ['q.collector', 'l.a', 'vd.cathode', 'cd.a'], ['vd.anode', 'cv.a', 'rt.a'], ['rt.b', 'rv.wiper'],
            ['cd.b', 'd.anode', 'rk.a'], ['d.cathode', 'rl.a', 'cl.a', 'ck.a'], ['ck.b', 'rb.b', 'qa.base'],
            ['qa.collector', 'ep.a', 'cc.a'],
            ['bat.pos', 'r1.a', 'l.b', 'rv.b', 'rb.a', 'ep.b'],
            ['bat.neg', 'gnd.gnd', 'r2.b', 're.b', 'ce.b', 'cv.b', 'rv.a', 'rk.b', 'rl.b', 'cl.b', 'qa.emitter', 'cc.b'],
        ],
    },
};
