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
    // conduction from a stiff divider (220 kΩ / 15 kΩ, held by 10 nF): the
    // RF its base junction rectifies raises the mean collector current
    // through a 1 mA meter. (A current-source bias, a lone 2.2 MΩ, holds the
    // mean base current, and with it the mean collector current: the RF then
    // shows only as audio ripple, never on a needle.) 10 nF bypasses the
    // carrier.
    'lab-direction-finder': {
        vcc: 9, supply: SUP,
        parts: { bat: BAT9, gnd: ['gnd', {}],
            l: ['ferrite_coil', { couplingRatio: 0.25, rodHeightM: 0.05, angleDeg: 0, stations: [
                { id: 'north', name: 'North 700 kHz', hz: 700e3, fieldVPerM: 0.3, depth: 0.3, bearingDeg: 0, audio: { type: 'tone', hz: 400 } },
                { id: 'east', name: 'East 1000 kHz', hz: 1000e3, fieldVPerM: 0.3, depth: 0.3, bearingDeg: 70, audio: { type: 'tone', hz: 800 } },
            ] }], tc: TUNE(0.4),
            rb: R(220000), rg: R(15000), cb: C(10e-9), q: NPN, m: ['analog_meter', { mode: 'current', fullScale: 0.001 }], cc: C(10e-9) },
        nets: [
            ['l.b', 'tc.a'], ['l.c1', 'q.base'], ['l.c2', 'rb.b', 'rg.a', 'cb.a'],
            ['bat.pos', 'rb.a', 'm.a'], ['m.b', 'q.collector', 'cc.a'],
            ['bat.neg', 'gnd.gnd', 'l.a', 'tc.b', 'cb.b', 'rg.b', 'q.emitter', 'cc.b'],
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
            l: ['vhf_coil', { henrys: 0.15e-6, q: 80 }], vd: ['varicap', { part: 'BB910' }], cv: C(1e-9), rt: R(100000), rv: POT(100000, 0.46),
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

    // AM test transmitter and a receiver a distance away. Transmitter: a
    // Meissner oscillator on one ferrite rod — tank (main winding + tuning
    // capacitor) in the collector, the coupling winding in the base circuit
    // (bias 22 kΩ / 22 kΩ, held by 10 nF: room for the modulator below),
    // emitter bypassed to ground for RF by 1 nF, 1 kΩ down to the modulator. Its emitter
    // current is drawn by a second transistor (emitter 470 Ω) whose base the
    // audio generator drives (1 kHz around 1.2 V through 10 kΩ): the
    // oscillator's current, and so its amplitude, follows the audio.
    // Receiver: a crystal set on a second rod whose `linkTo` names the
    // transmitter's rod, `distanceM` 1 (near field ∝ 1/d³), same tuning.
    'lab-am-transmitter': {
        vcc: 9, supply: SUP,
        parts: { bat: BAT9, gnd: ['gnd', {}],
            lt: ['ferrite_coil', { rodHeightM: 0, couplingRatio: 0.02 }], tct: TUNE(0.3), q1: NPN,
            r1: R(22000), r2: R(22000), cb: C(10e-9), re: R(1000), ce: C(1e-9),
            q2: NPN, re2: R(470), rin: R(10000), fg: ['function_gen', { wave: 'sine', freq: 1000, amplitude: 0.1, offset: 1.2 }],
            lr: ['ferrite_coil', { rodHeightM: 0, linkTo: 'ferrite_coil_4', distanceM: 0.5 }], tcr: TUNE(0.309),
            d: GE, cd: C(2.2e-9), rd: R(47000), ep: ['earphone', { type: 'crystal' }] },
        nets: [
            ['bat.pos', 'lt.a', 'tct.a', 'r1.a'], ['q1.collector', 'lt.b', 'tct.b'],
            ['r1.b', 'r2.a', 'cb.a', 'lt.c2'], ['q1.base', 'lt.c1'],
            ['q1.emitter', 're.a', 'ce.a'], ['re.b', 'q2.collector'],
            ['q2.emitter', 're2.a'], ['q2.base', 'rin.b'], ['rin.a', 'fg.out'],
            ['lr.b', 'tcr.a', 'd.anode'], ['d.cathode', 'cd.a', 'rd.a', 'ep.a'],
            ['bat.neg', 'gnd.gnd', 'r2.b', 'cb.b', 'ce.b', 're2.b', 'fg.gnd', 'lr.a', 'tcr.b', 'cd.b', 'rd.b', 'ep.b'],
        ],
        open: ['lt.tap', 'lr.tap', 'lr.c1', 'lr.c2'],
    },

    // A high-gain amplifier with a bare wire on its input picks up a strong
    // broadcaster: the wire (30 cm, about 10 pF to its surroundings, no
    // earth) straight on the LM386's +IN, gain 200 (10 µF across pins 1–8),
    // the loudspeaker through 220 µF. The LM386's input is the base of a PNP
    // follower; the station's swing there is rectified by that junction and
    // its programme comes out amplified. A strong local station (0.1 V/m at
    // 1 MHz, 80 % AM, a 400 Hz tone).
    'lab-broadcast-pickup': {
        vcc: 9, supply: SUP,
        parts: { bat: BAT9, gnd: ['gnd', {}],
            ant: ['antenna', { heightM: 0.3, farads: 10e-12, stations: [
                { id: 'local', name: 'Local transmitter 1 MHz', hz: 1e6, fieldVPerM: 0.1, depth: 0.8, audio: { type: 'tone', hz: 400 } },
            ] }],
            u: ['lm386', {}], cg: C(10e-6), cb: C(10e-6), co: C(220e-6), spk: ['speaker', { ohms: 8 }], cs: C(100e-6) },
        nets: [
            ['ant.a', 'u.inp'], ['u.gain1', 'cg.a'], ['cg.b', 'u.gain8'], ['u.bypass', 'cb.a'],
            ['bat.pos', 'u.vs', 'cs.a'], ['u.vout', 'co.a'], ['co.b', 'spk.a'],
            ['bat.neg', 'gnd.gnd', 'u.gnd', 'u.inn', 'cb.b', 'spk.b', 'cs.b'],
        ],
    },

    // MOSFET regenerative receiver: lab-regen-receiver with an n-channel
    // MOSFET in place of the transistor. The gate draws no current, so there
    // is no grid-leak detection: the gate sits at the pot's voltage (through
    // 1 MΩ, coupled to the tank top by 100 pF) and the square-law channel
    // detects instead, its mean drain current rising with the RF swing on
    // the gate. The tickler (4 % of the main turns) in the drain lead feeds
    // the tank; the pot sets the gate voltage and with it the gain and how
    // much it regenerates. Source 1 kΩ bypassed by 100 nF; earphone in the
    // drain, 10 nF to ground.
    'lab-mosfet-regen': {
        vcc: 9, supply: SUP,
        parts: { bat: BAT9, gnd: ['gnd', {}],
            ant: ['antenna', { heightM: 1, stations: [
                { id: 'local', name: 'Local 612 kHz', hz: 612e3, fieldVPerM: 0.005, depth: 0.5, audio: { type: 'tone', hz: 400 } },
            ] }], earth: ['earth', {}],
            l: ['ferrite_coil', { couplingRatio: 0.02 }], tc: TUNE(0.5),
            cg: C(100e-12), rg: R(1000000), rv: POT(100000, 0.8), q: ['nmos', { vth: 2, k: 0.002 }], rs: R(1000), cs: C(100e-9),
            ep: EP, cc: C(10e-9) },
        nets: [
            ['ant.a', 'l.tap'], ['l.b', 'tc.a', 'cg.a'], ['cg.b', 'rg.b', 'q.gate'], ['rg.a', 'rv.wiper'],
            ['q.source', 'rs.a', 'cs.a'], ['q.drain', 'l.c1'], ['l.c2', 'ep.a', 'cc.a'],
            ['bat.pos', 'rv.b', 'ep.b'],
            ['bat.neg', 'gnd.gnd', 'earth.earth', 'l.a', 'tc.b', 'rv.a', 'rs.b', 'cs.b', 'cc.b'],
        ],
    },

    // Short-wave reception and mixing: the regenerative receiver on a
    // short-wave coil (5 µH: the tuning capacitor reaches about 3–10 MHz).
    // The antenna couples in through only 20 pF: at 6 MHz the long wire's
    // 200 pF through the tap loads the tank to Q ≈ 20 and no tickler gets it
    // past the threshold. A Morse beacon at 6.0585 MHz (a bare carrier keyed
    // on and off) and an AM station at 5.9 MHz. Tuned near the beacon,
    // below the threshold its carrier is silent; past it the receiver's own
    // oscillation and the beacon's carrier meet in the base junction, and
    // their difference frequency is a tone. The base is fed through a
    // 100 kΩ grid leak: with 1 MΩ the base's bias recovers so slowly after
    // each build-up that the oscillation squegs (bursts at ~10 kHz, a loud
    // buzz of its own) instead of running steadily. The tuning capacitor is
    // set to a hair past a quarter so the oscillation runs ~2 kHz from the
    // beacon.
    'lab-shortwave-regen': {
        vcc: 9, supply: SUP,
        parts: { bat: BAT9, gnd: ['gnd', {}],
            ant: ['antenna', { heightM: 2, farads: 20e-12, stations: [
                { id: 'cw', name: 'CW beacon 6.0585 MHz', hz: 6.0585e6, fieldVPerM: 0.005, mod: 'cw', audio: { type: 'morse', text: 'E', wpm: 20 } },
                { id: 'am', name: 'AM 5.9 MHz', hz: 5.9e6, fieldVPerM: 0.005, depth: 0.5, audio: { type: 'tone', hz: 500 } },
            ] }], earth: ['earth', {}],
            l: ['ferrite_coil', { henrys: 5e-6, couplingRatio: 0.08, q: 100 }], tc: TUNE(0.2506),
            cb: C(100e-12), rb: R(100000), rv: POT(100000, 0.95), q: NPN, re: R(1000), ce: C(100e-9),
            ep: EP, cc: C(10e-9) },
        nets: [
            ['ant.a', 'l.tap'], ['l.b', 'tc.a', 'cb.a'], ['cb.b', 'rb.b', 'q.base'], ['rb.a', 'rv.wiper'],
            ['q.emitter', 're.a', 'ce.a'], ['q.collector', 'l.c1'], ['l.c2', 'ep.a', 'cc.a'],
            ['bat.pos', 'rv.b', 'ep.b'],
            ['bat.neg', 'gnd.gnd', 'earth.earth', 'l.a', 'tc.b', 'rv.a', 're.b', 'ce.b', 'cc.b'],
        ],
    },

    // Super-regenerative VHF receiver, separately quenched. A BF199 Colpitts
    // in common base (base divider 10 kΩ / 10 kΩ held at RF by 100 pF; 3.3 pF
    // collector→emitter, 10 pF emitter→ground; emitter returns through 1 kΩ
    // to 2.2 kΩ ‖ 1 nF): the tank — air-core coil ‖ varicap tuned by the pot
    // through 100 kΩ — in the collector, fed from 9 V. A 25 kHz quench
    // generator (2 V peak) swings the base through 1 kΩ, so the stage is pushed past
    // its oscillation threshold and back 25 000 times a second; each burst
    // grows from whatever the tank holds — the station or noise. The average
    // emitter current follows; 10 kΩ / 10 nF keeps the audio and drops the
    // quench, and 100 nF passes it to a one-transistor amplifier and the
    // earphone.
    'lab-superregen-fm': {
        vcc: 9, supply: SUP,
        parts: { bat: BAT9, gnd: ['gnd', {}],
            ant: ['antenna', { heightM: 0.5, ohms: 75, farads: 2e-12, stations: [
                { id: 'fm', name: 'FM 98.0 MHz', hz: 98e6, mod: 'fm', deviationHz: 75e3, fieldVPerM: 0.05, audio: { type: 'tone', hz: 1000 } },
            ] }],
            l: ['vhf_coil', { henrys: 0.15e-6, q: 80 }], vd: ['varicap', { part: 'BB910' }], cv: C(1e-9),
            rt: R(100000), rv: POT(100000, 0.72), q: VHF, r1: R(10000), r2: R(10000), cbb: C(100e-12), cf: C(3.3e-12), ce: C(10e-12),
            rf: R(1000), rq: R(2200), cq: C(1e-9), rqg: R(1000), fq: ['function_gen', { wave: 'sine', freq: 25000, amplitude: 2, offset: 0 }],
            ra: R(10000), ca: C(10e-9), ck: C(100e-9), rb: R(1000000), qa: NPN, ep: EP, cc: C(10e-9) },
        nets: [
            ['ant.a', 'q.collector', 'l.a', 'vd.cathode', 'cf.a'], ['vd.anode', 'cv.a', 'rt.a'], ['rt.b', 'rv.wiper'],
            ['q.base', 'r1.b', 'r2.a', 'cbb.a', 'rqg.b'], ['rqg.a', 'fq.out'], ['q.emitter', 'cf.b', 'ce.a', 'rf.a'], ['rf.b', 'rq.a', 'cq.a', 'ra.a'],
            ['ra.b', 'ca.a', 'ck.a'], ['ck.b', 'rb.b', 'qa.base'], ['qa.collector', 'ep.a', 'cc.a'],
            ['bat.pos', 'l.b', 'r1.a', 'rv.b', 'rb.a', 'ep.b'],
            ['bat.neg', 'gnd.gnd', 'cv.b', 'rv.a', 'r2.b', 'cbb.b', 'ce.b', 'rq.b', 'cq.b', 'ca.b', 'qa.emitter', 'cc.b', 'fq.gnd'],
        ],
    },
};
