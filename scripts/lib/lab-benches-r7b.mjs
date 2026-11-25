/**
 * Netlists for round-7 benches (set r7b): transistor amplifier stages in
 * their three configurations, bias drift with temperature, the Meissner
 * oscillator squegging and refusing to start with its winding reversed, a
 * radio remote switch, tuned-radio-frequency receivers with a MOSFET stage,
 * and discrete astables bent in pitch by an amplifier IC. Written by
 * `node scripts/gen-lab-circuits-4.mjs --set=r7b`.
 *
 * Same shape as lab-benches-rf.mjs: pure data, so test/lab-circuits-r7b.test.mjs
 * names parts by role. Ids follow benchIds (breadboard first, then the parts
 * in the order listed).
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
const POT = (ohms, position) => ['potentiometer', { ohms, position }];
const TUNE = (position) => ['tuning_cap', { minFarads: 10e-12, maxFarads: 500e-12, position }];

export const BENCHES = {

    // AM voice transmitter with a dual-gate MOSFET as the modulator. A
    // Meissner oscillator (tank in the collector of an NPN, coupling winding
    // to a 22 k / 22 k divider held by 1 nF, emitter 1 kOhm with 1 nF) makes
    // the carrier; 2.2 pF and 100 pF divide its collector swing onto gate 1 of
    // a depletion dual-gate MOSFET (gate 1 returned to ground by 100 kOhm,
    // source 220 Ohm with 100 nF). Gate 2 sits on a bias pot through 10
    // kOhm, and the LM386 (gain 200) puts the speaker-microphone's sound on
    // it through 100 nF: the MOSFET's gain, and so the carrier it drives into
    // a second tuned ferrite rod in its drain (damped by 2.2 kOhm so the
    // stage cannot oscillate on its own), follows the sound. A crystal
    // set on a third rod half a metre from that one listens.
    'lab-am-voice-dual-gate': {
        vcc: 9, supply: SUP,
        parts: { bat: BAT9, gnd: ['gnd', {}],
            lt: ['ferrite_coil', { rodHeightM: 0, couplingRatio: 0.02 }], tct: TUNE(0.3), q1: NPN,
            r1: R(22000), r2: R(22000), cb: C(1e-9), re: R(1000), ce: C(1e-9),
            ck: C(2.2e-12), cdv: C(100e-12), rg1: R(100000),
            m: ['dual_gate_mosfet', {}], rs: R(220), cs: C(100e-9),
            la: ['ferrite_coil', { rodHeightM: 0 }], tca: TUNE(0.3), rda: R(2200),
            rv: POT(100000, 0.1), rg2: R(10000), cm: C(100e-9),
            mic: ['speaker', { ohms: 8, soundDb: 100, soundWave: 'tone', soundHz: 500 }], u: ['lm386', {}], cg: EL(10e-6),
            lr: ['ferrite_coil', { rodHeightM: 0, linkTo: 'ferrite_coil_18', distanceM: 0.5 }], tcr: TUNE(0.3),
            d: GE, cd: C(2.2e-9), rd: R(47000), ep: ['earphone', { type: 'crystal' }] },
        nets: [
            ['bat.pos', 'lt.a', 'tct.a', 'r1.a', 'la.a', 'tca.a', 'rda.a', 'rv.a', 'u.vs'],
            ['q1.collector', 'lt.b', 'tct.b', 'ck.a'], ['r1.b', 'r2.a', 'cb.a', 'lt.c2'], ['q1.base', 'lt.c1'],
            ['q1.emitter', 're.a', 'ce.a'],
            ['ck.b', 'cdv.a', 'rg1.a', 'm.gate1'], ['m.source', 'rs.a', 'cs.a'], ['m.drain', 'la.b', 'tca.b', 'rda.b'],
            ['rv.wiper', 'rg2.a'], ['rg2.b', 'cm.a', 'm.gate2'], ['cm.b', 'u.vout'],
            ['mic.a', 'u.inp'], ['u.gain1', 'cg.pos'], ['u.gain8', 'cg.neg'],
            ['lr.b', 'tcr.a', 'd.anode'], ['d.cathode', 'cd.a', 'rd.a', 'ep.a'],
            ['bat.neg', 'gnd.gnd', 'r2.b', 'cb.b', 're.b', 'ce.b', 'cdv.b', 'rg1.b', 'rs.b', 'cs.b', 'rv.b',
                'mic.b', 'u.gnd', 'u.inn', 'lr.a', 'tcr.b', 'cd.b', 'rd.b', 'ep.b'],
        ],
        open: ['lt.tap', 'la.tap', 'la.c1', 'la.c2', 'lr.tap', 'lr.c1', 'lr.c2', 'u.bypass'],
    },

    // Radio remote switch. Transmitter: the Meissner oscillator (tank in the
    // collector, coupling winding to a 22 k / 22 k divider held by 10 nF,
    // emitter 1 kOhm with 1 nF); its base divider is fed only while the
    // button is held, so it oscillates only then.
    // Receiver half a metre away: a second ferrite rod with its tuning
    // capacitor; the coupling winding drives the gate of an n-MOSFET (bias
    // from a 100 kOhm / 47 kOhm divider held by 10 nF) whose 4.7 kOhm drain
    // load passes the RF through 1 nF to a germanium diode (100 kOhm return).
    // The detected DC (47 nF) goes straight into the LM386, whose output sits
    // at half the supply and rises 20 times the detector voltage; an LED with
    // a 3.3 V zener and 470 Ohm in series only lights above about 5 V.
    'lab-rf-remote': {
        vcc: 9, supply: SUP,
        parts: { bat: BAT9, gnd: ['gnd', {}], key: ['button', {}],
            lt: ['ferrite_coil', { rodHeightM: 0, couplingRatio: 0.02 }], tct: TUNE(0.3), q1: NPN,
            r1: R(22000), r2: R(22000), cb: C(10e-9), re: R(1000), ce: C(1e-9),
            lr: ['ferrite_coil', { rodHeightM: 0, linkTo: 'ferrite_coil_5', distanceM: 0.5 }], tcr: TUNE(0.309),
            rg1: R(100000), rg2: R(47000), cg: C(10e-9), m: ['nmos', { vth: 2, k: 0.002 }], rdr: R(4700),
            cc: C(1e-9), rr: R(100000), d: GE, cd: C(47e-9), u: ['lm386', {}],
            rl: R(470), led: ['led', { color: 'red' }], z: ['zener', { vz: 3.3, vf: 0.7 }] },
        nets: [
            ['bat.pos', 'key.a', 'lt.a', 'tct.a', 'rg1.a', 'rdr.a', 'u.vs'],
            ['key.b', 'r1.a'], ['q1.collector', 'lt.b', 'tct.b'],
            ['r1.b', 'r2.a', 'cb.a', 'lt.c2'], ['q1.base', 'lt.c1'], ['q1.emitter', 're.a', 'ce.a'],
            ['lr.b', 'tcr.a'], ['lr.c1', 'm.gate'], ['lr.c2', 'rg1.b', 'rg2.a', 'cg.a'],
            ['m.drain', 'rdr.b', 'cc.a'], ['cc.b', 'rr.a', 'd.anode'], ['d.cathode', 'cd.a', 'u.inp'],
            ['u.vout', 'rl.a'], ['rl.b', 'led.anode'], ['led.cathode', 'z.cathode'],
            ['bat.neg', 'gnd.gnd', 'r2.b', 'cb.b', 're.b', 'ce.b', 'lr.a', 'tcr.b', 'rg2.b', 'cg.b', 'm.source',
                'rr.b', 'cd.b', 'u.gnd', 'u.inn', 'z.anode'],
        ],
        open: ['lt.tap', 'lr.tap', 'u.gain1', 'u.gain8', 'u.bypass'],
    },

    // Tuned radio-frequency receiver: a MOSFET RF stage ahead of the diode.
    // A short antenna (50 pF) through a slide switch either straight onto
    // the top of the tank (tight coupling) or through 4.7 pF (loose).
    // The coupling winding drives an n-MOSFET's gate (bias divider 100 kOhm /
    // 47 kOhm held by 10 nF); its 4.7 kOhm drain load feeds a germanium
    // detector through 1 nF (100 kOhm return; 47 kOhm || 2.2 nF load), then a
    // one-transistor audio stage (1 MOhm collector-to-base, 4.7 kOhm) and
    // the LM386 into the speaker.
    'lab-trf-mosfet': {
        vcc: 9, supply: SUP,
        parts: { bat: BAT9, gnd: ['gnd', {}],
            ant: ['antenna', { heightM: 2, farads: 50e-12, stations: [
                { id: 'local', name: 'Local 700 kHz', hz: 700e3, fieldVPerM: 0.005, depth: 0.6, audio: { type: 'tone', hz: 400 } },
                { id: 'next', name: 'Neighbour 740 kHz', hz: 740e3, fieldVPerM: 0.005, depth: 0.6, audio: { type: 'tone', hz: 1000 } },
            ] }], earth: ['earth', {}], sw: ['slide_switch', { position: 0 }], ck: C(4.7e-12),
            l: ['ferrite_coil', {}], tc: TUNE(0.3),
            rg1: R(100000), rg2: R(47000), cg: C(10e-9), m: ['nmos', { vth: 2, k: 0.002 }], rdr: R(4700),
            cc: C(1e-9), rr: R(100000), d: GE, cd: C(2.2e-9), rd: R(47000),
            ca: C(100e-9), rf: R(1000000), q: NPN, rc: R(4700), co: C(100e-9), u: ['lm386', {}],
            cs: EL(220e-6), spk: ['speaker', { ohms: 8 }] },
        nets: [
            ['ant.a', 'sw.com'], ['sw.b', 'ck.a'], ['sw.a', 'ck.b', 'l.b', 'tc.a'],
            ['l.c1', 'm.gate'], ['l.c2', 'rg1.b', 'rg2.a', 'cg.a'],
            ['bat.pos', 'rg1.a', 'rdr.a', 'rc.a', 'u.vs'],
            ['m.drain', 'rdr.b', 'cc.a'], ['cc.b', 'rr.a', 'd.anode'], ['d.cathode', 'cd.a', 'rd.a', 'ca.a'],
            ['ca.b', 'q.base', 'rf.a'], ['q.collector', 'rf.b', 'rc.b', 'co.a'], ['co.b', 'u.inp'],
            ['u.vout', 'cs.pos'], ['cs.neg', 'spk.a'],
            ['bat.neg', 'gnd.gnd', 'earth.earth', 'l.a', 'tc.b', 'rg2.b', 'cg.b', 'm.source', 'rr.b', 'cd.b', 'rd.b',
                'q.emitter', 'u.gnd', 'u.inn', 'spk.b'],
        ],
        open: ['l.tap', 'u.gain1', 'u.gain8', 'u.bypass'],
    },

    // Detector receiver with a one-transistor audio stage before the LM386.
    // A short antenna (0.5 m) on the rod's tap, tank tuned to the local station, germanium
    // diode into 47 kOhm || 2.2 nF. The slide switch takes the LM386's input
    // either straight from the detector (through 1 uF) or from the collector
    // of an NPN stage (1 MOhm collector-to-base, 4.7 kOhm) that the detector
    // drives through 100 nF.
    'lab-radio-preamp': {
        vcc: 9, supply: SUP,
        parts: { bat: BAT9, gnd: ['gnd', {}], ant: ['antenna', { heightM: 0.5 }], earth: ['earth', {}], l: ['ferrite_coil', {}], tc: TUNE(0.5),
            d: GE, cd: C(2.2e-9), rd: R(47000), cd2: C(100e-9), ca: C(100e-9), rf: R(1000000), q: NPN, rc: R(4700), cq: C(100e-9),
            sw: ['slide_switch', { position: 1 }], u: ['lm386', {}], cs: EL(220e-6), spk: ['speaker', { ohms: 8 }] },
        nets: [
            ['ant.a', 'l.tap'], ['l.b', 'tc.a', 'd.anode'], ['d.cathode', 'cd.a', 'rd.a', 'ca.a', 'cd2.a'],
            ['ca.b', 'q.base', 'rf.a'], ['q.collector', 'rf.b', 'rc.b', 'cq.a'],
            ['cd2.b', 'sw.a'], ['cq.b', 'sw.b'], ['sw.com', 'u.inp'],
            ['bat.pos', 'rc.a', 'u.vs'], ['u.vout', 'cs.pos'], ['cs.neg', 'spk.a'],
            ['bat.neg', 'gnd.gnd', 'earth.earth', 'l.a', 'tc.b', 'cd.b', 'rd.b', 'q.emitter', 'u.gnd', 'u.inn', 'spk.b'],
        ],
        open: ['l.c1', 'l.c2', 'u.gain1', 'u.gain8', 'u.bypass'],
    },

    // The wake-up radio with a MOSFET detector: the rod's coupling winding
    // drives the gate of an n-MOSFET biased just above its threshold by a
    // pot (100 nF holds it); its source returns to ground through a
    // phototransistor, so in the dark no drain current flows at all. Drain
    // load 10 kOhm with 10 nF for the RF; the audio goes through 1 uF to the
    // LM386 and the speaker.
    'lab-dawn-mosfet': {
        vcc: 9, supply: SUP,
        parts: { bat: BAT9, gnd: ['gnd', {}], ant: ['antenna', {}], earth: ['earth', {}], l: ['ferrite_coil', {}], tc: TUNE(0.5),
            rv: POT(100000, 0.25), cg: C(100e-9), m: ['nmos', { vth: 2, k: 0.002 }], pt: ['phototransistor', { light: 0 }],
            rdr: R(10000), cr: C(10e-9), co: C(100e-9), u: ['lm386', {}], cs: EL(220e-6), spk: ['speaker', { ohms: 8 }] },
        nets: [
            ['ant.a', 'l.tap'], ['l.b', 'tc.a'], ['l.c1', 'm.gate'], ['l.c2', 'rv.wiper', 'cg.a'],
            ['m.source', 'pt.collector'], ['m.drain', 'rdr.b', 'cr.a', 'co.a'], ['co.b', 'u.inp'],
            ['bat.pos', 'rv.a', 'rdr.a', 'u.vs'], ['u.vout', 'cs.pos'], ['cs.neg', 'spk.a'],
            ['bat.neg', 'gnd.gnd', 'earth.earth', 'l.a', 'tc.b', 'rv.b', 'cg.b', 'pt.emitter', 'cr.b', 'u.gnd', 'u.inn', 'spk.b'],
        ],
        open: ['u.gain1', 'u.gain8', 'u.bypass'],
    },

    // A slow amplifier-IC astable sweeping a discrete one. The LM386 is a
    // Schmitt trigger: 470 kOhm from its output to +IN (whose internal 50 kOhm
    // to ground makes the divider) is positive feedback above unity at its
    // gain of 20; the output charges 470 nF quickly through a diode and
    // 10 kOhm and discharges it slowly through 100 kOhm, and 470 kOhm from
    // the capacitor to -IN lets the output flip each time the capacitor
    // crosses a threshold: short high pulses, long low gaps. The two-transistor astable (1 kOhm loads, 47 nF
    // cross capacitors, 47 kOhm base resistors) returns its base resistors to
    // a 2.2 uF control node (22 kOhm from 9 V) instead of to 9 V: the higher
    // that node, the faster the capacitors recharge and the higher the
    // pitch. The LM386 output reaches the node through a diode: each short
    // pulse charges it at once, then it falls slowly through the base
    // resistors until the next pulse — a sawtooth sweep of the pitch.
    'lab-wobble-astable': {
        vcc: 9, supply: SUP,
        parts: { bat: BAT9, u: ['lm386', {}], rpf: R(470000), rch: R(100000), dch: ['diode', {}], rq: R(10000), ct: EL(470e-9), rn: R(470000),
            d: ['diode', {}], cv: EL(2.2e-6), rp: R(22000),
            q1: NPN, q2: NPN, rc1: R(1000), rc2: R(1000), c1: C(47e-9), c2: C(47e-9), rb1: R(47000), rb2: R(47000),
            pz: ['piezo', {}] },
        nets: [
            ['bat.pos', 'u.vs', 'rp.a', 'rc1.a', 'rc2.a', 'pz.a'],
            ['u.vout', 'rpf.a', 'rch.a', 'dch.anode', 'd.anode'], ['dch.cathode', 'rq.a'], ['rpf.b', 'u.inp'], ['rch.b', 'rq.b', 'ct.pos', 'rn.a'], ['rn.b', 'u.inn'],
            ['d.cathode', 'cv.pos', 'rp.b', 'rb1.a', 'rb2.a'],
            ['rc1.b', 'q1.collector', 'c1.a'], ['c1.b', 'q2.base', 'rb2.b'],
            ['rc2.b', 'q2.collector', 'c2.a', 'pz.b'], ['c2.b', 'q1.base', 'rb1.b'],
            ['bat.neg', 'u.gnd', 'ct.neg', 'cv.neg', 'q1.emitter', 'q2.emitter'],
        ],
        open: ['u.gain1', 'u.gain8', 'u.bypass'],
    },

    // The speaker as a microphone bends a discrete astable's pitch: the
    // LM386 (gain 200, 10 uF across pins 1-8) amplifies it, and 1 uF and
    // 1 kOhm carry its output onto the astable's control node, which 22
    // kOhm feeds from 9 V. The astable's base resistors (47 kOhm) return to
    // that node, so the sound swings the node and the pitch follows.
    'lab-whistle-fm': {
        vcc: 9, supply: SUP,
        parts: { bat: BAT9, mic: ['speaker', { ohms: 8, soundDb: 110, soundWave: 'voice' }],
            u: ['lm386', {}], cg: EL(10e-6), co: EL(1e-6), rm: R(1000), rv: R(22000),
            q1: NPN, q2: NPN, rc1: R(1000), rc2: R(1000), c1: C(22e-9), c2: C(22e-9), rb1: R(47000), rb2: R(47000),
            pz: ['piezo', {}] },
        nets: [
            ['bat.pos', 'u.vs', 'rv.a', 'rc1.a', 'rc2.a', 'pz.a'],
            ['mic.a', 'u.inp'], ['u.gain1', 'cg.pos'], ['u.gain8', 'cg.neg'],
            ['u.vout', 'co.pos'], ['co.neg', 'rm.a'], ['rm.b', 'rv.b', 'rb1.a', 'rb2.a'],
            ['rc1.b', 'q1.collector', 'c1.a'], ['c1.b', 'q2.base', 'rb2.b'],
            ['rc2.b', 'q2.collector', 'c2.a', 'pz.b'], ['c2.b', 'q1.base', 'rb1.b'],
            ['bat.neg', 'mic.b', 'u.gnd', 'u.inn', 'q1.emitter', 'q2.emitter'],
        ],
        open: ['u.bypass'],
    },

    // Audio through a biased common-emitter stage: the bias pot (a 100 kOhm
    // rheostat after 4.7 kOhm from 9 V) and 4.7 kOhm to ground set the base;
    // the generator (a music player stand-in, 500 Hz) comes in through 10 uF
    // and 1 kOhm. Emitter 220 Ohm; collector 2.2 kOhm from 9 V with an LED
    // and 1 kOhm beside it to show the swing; out through 10 uF to a
    // magnetic earphone.
    'lab-ce-audio-bias': {
        vcc: 9, supply: SUP,
        parts: { bat: BAT9, rt: R(4700), rv: POT(100000, 0.8), r2: R(4700), q: NPN, rc: R(2200), re: R(220),
            fg: ['function_gen', { wave: 'sine', freq: 500, amplitude: 0.1, offset: 0 }], rin: R(1000), cin: EL(10e-6),
            co: EL(10e-6), ep: ['earphone', { type: 'magnetic', ohms: 2000, henrys: 0.1 }],
            rl: R(1000), led: ['led', { color: 'red' }] },
        nets: [
            ['bat.pos', 'rt.a', 'rc.a', 'rl.a'], ['rt.b', 'rv.a'], ['rv.wiper', 'r2.a', 'q.base', 'cin.neg'],
            ['cin.pos', 'rin.b'], ['rin.a', 'fg.out'],
            ['rc.b', 'q.collector', 'co.pos', 'led.cathode'], ['rl.b', 'led.anode'], ['co.neg', 'ep.a'],
            ['q.emitter', 're.a'],
            ['bat.neg', 'r2.b', 're.b', 'fg.gnd', 'ep.b'],
        ],
        open: ['rv.b'],
    },

    // Bias drift with temperature. The base divider's top (4.7 kOhm and a
    // 100 kOhm bias pot as a rheostat) hangs from 9 V or, with the first
    // slide switch over, from the collector (collector-to-base feedback); the
    // second slide switch shorts the 1 kOhm emitter resistor or leaves it in
    // (bypassed by 100 uF so the signal gain stays). 4.7 kOhm base to ground,
    // 2.2 kOhm collector load. The transistor sits in its own surroundings
    // (surroundC, the Temperature slider).
    'lab-bias-drift': {
        vcc: 9, supply: SUP,
        parts: { bat: BAT9, sf: ['slide_switch', { position: 0 }], rt: R(4700), rv: POT(100000, 0.51), r2: R(4700),
            q: ['npn', { beta: 100, surroundC: 25, thermalTau: 1 }], rc: R(2200),
            re: R(1000), ce: EL(100e-6), se: ['slide_switch', { position: 0 }] },
        nets: [
            ['bat.pos', 'sf.a', 'rc.a'], ['sf.com', 'rt.a'], ['rt.b', 'rv.a'], ['rv.wiper', 'r2.a', 'q.base'],
            ['rc.b', 'q.collector', 'sf.b'], ['q.emitter', 're.a', 'ce.pos', 'se.com'],
            ['bat.neg', 'r2.b', 're.b', 'ce.neg', 'se.a'],
        ],
        open: ['rv.b', 'se.b'],
    },

    // Common base: the base sits on a 47 k / 22 k divider held by 100 uF; the
    // emitter returns through 2.2 kOhm, and a button pulls it down through
    // 2.2 kOhm more. Collector: 2.2 kOhm from 9 V with an LED-and-1 kOhm
    // beside it. A generator (1 kHz, 20 mV) drives the emitter through 47 uF
    // and 100 Ohm: the AC amplifier.
    'lab-cb-button': {
        vcc: 9, supply: SUP,
        parts: { bat: BAT9, r1: R(47000), r2: R(22000), cb: EL(4.7e-6), q: NPN, re: R(2200),
            btn: ['button', {}], rp: R(2200), rc: R(2200), rl: R(1000), led: ['led', { color: 'green' }],
            fg: ['function_gen', { wave: 'sine', freq: 1000, amplitude: 0.02, offset: 0 }], rin: R(100), cin: EL(47e-6),
            scope: ['oscilloscope', {}] },
        nets: [
            ['bat.pos', 'r1.a', 'rc.a', 'rl.a'], ['r1.b', 'r2.a', 'cb.pos', 'q.base'],
            ['q.emitter', 're.a', 'btn.a', 'cin.pos', 'scope.ch1'], ['btn.b', 'rp.a'], ['cin.neg', 'rin.b'], ['rin.a', 'fg.out'],
            ['rc.b', 'q.collector', 'led.cathode', 'scope.ch2'], ['rl.b', 'led.anode'],
            ['bat.neg', 'r2.b', 'cb.neg', 're.b', 'rp.b', 'fg.gnd', 'scope.gnd'],
        ],
    },
    // Meissner oscillator on a ferrite rod: the tank (main winding and the
    // tuning capacitor at 0.30) in the collector, top at 9 V; the coupling
    // winding between the base and a 4.7 nF reservoir that the bias pot (a
    // 1 MOhm rheostat from 9 V, plus 10 kOhm) charges. Two slide switches
    // connect the coupling winding the right way round or reversed (flip
    // both). Emitter 1 kOhm with 1 nF across. A crystal set on a second rod
    // half a metre away listens.
    'lab-meissner-squegg': {
        vcc: 9, supply: SUP,
        parts: { bat: BAT9, gnd: ['gnd', {}],
            lt: ['ferrite_coil', { rodHeightM: 0, couplingRatio: 0.02 }], tct: TUNE(0.3), q: NPN,
            rv: POT(1000000, 0.3), rb: R(10000), cb: C(4.7e-9), re: R(1000), ce: C(1e-9),
            sa: ['slide_switch', { position: 0 }], sb: ['slide_switch', { position: 0 }],
            lr: ['ferrite_coil', { rodHeightM: 0, linkTo: 'ferrite_coil_4', distanceM: 0.5 }], tcr: TUNE(0.309),
            d: GE, cd: C(2.2e-9), rd: R(47000), ep: ['earphone', { type: 'crystal' }] },
        nets: [
            ['bat.pos', 'lt.a', 'tct.a', 'rv.a'], ['q.collector', 'lt.b', 'tct.b'],
            ['rv.wiper', 'rb.a'], ['rb.b', 'cb.a', 'sb.com'], ['q.base', 'sa.com'],
            ['lt.c1', 'sa.a', 'sb.b'], ['lt.c2', 'sa.b', 'sb.a'],
            ['q.emitter', 're.a', 'ce.a'],
            ['lr.b', 'tcr.a', 'd.anode'], ['d.cathode', 'cd.a', 'rd.a', 'ep.a'],
            ['bat.neg', 'gnd.gnd', 'cb.b', 're.b', 'ce.b', 'lr.a', 'tcr.b', 'cd.b', 'rd.b', 'ep.b'],
        ],
        open: ['lt.tap', 'lr.tap', 'lr.c1', 'lr.c2', 'rv.b'],
    },
};
