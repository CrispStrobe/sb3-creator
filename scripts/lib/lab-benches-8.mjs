/**
 * Netlists for the eighth set of lab-* benches: transducers that sense. A
 * loudspeaker or earphone used as a microphone (and heard by another one),
 * a thermocouple, a hand-wound coil (its field, a magnet dropped through it,
 * metal near it) and an electrolyte between two electrodes, written by
 * `node scripts/gen-lab-circuits-4.mjs --set=8`.
 *
 * Same shape as lab-benches-4.mjs: pure data, so test/lab-circuits-8.test.mjs
 * names parts by role. Ids follow benchIds (breadboard first, then the parts
 * in the order listed). A param written '@name' (an earphone that `hears` a
 * speaker) is resolved to that part's engine id below.
 *
 * The engine models (bw-board acoustics.js, sensing-transducers.js):
 * - a speaker/earphone with `soundDb` hears the learner's sound (`soundWave`
 *   voice, tone, ring or noise) and makes an EMF of S·p in its coil (speaker
 *   0.5 mV/Pa, magnetic earphone 3 mV/Pa); with `hears` + `distanceCm` it
 *   also hears what another transducer radiates, delayed by r/c;
 * - `thermocouple`: E(hotC) − E(bench) from its type's reference table;
 * - `air_coil`: R and L from turns, radius, length and wire; field and
 *   compass deflection on its device state; a magnet dropped through it
 *   (params.drops bumped) induces −dΦ/dt; metal at metalCm shifts L;
 * - `electrolysis_cell`: electrolyte R, double layer and a Tafel
 *   electrolysis branch above ≈ 1.7 V.
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
const POT = (ohms, position) => ['potentiometer', { ohms, position }];
const LM386 = ['lm386', {}];

export const BENCHES = {
    // Speak into a loudspeaker: its coil makes a fraction of a millivolt. An
    // LM386 at gain 200 (10 µF across pins 1–8) lifts it, and 10 µF couples
    // the amplified voice onto the control pin of a 555 astable (1 k, 10 k,
    // 100 nF: about 750 Hz): the voice pushes the comparator thresholds up
    // and down and the tone's pitch wobbles with it. The tone plays through
    // 100 µF into a second loudspeaker.
    'lab-voice-fm': {
        vcc: 9, supply: SUP,
        parts: { bat: BAT9, mic: ['speaker', { ohms: 8, soundDb: 94, soundWave: 'voice', soundHz: 150 }],
            u: LM386, cg: EL(10e-6), cc: C(1e-6),
            t: ['timer_555', {}], ra: R(1000), rb: R(10000), ct: C(100e-9),
            rs: R(220), pz: ['piezo', {}] },
        nets: [
            ['bat.pos', 'u.vs', 't.vcc', 't.reset', 'ra.a'],
            ['mic.a', 'u.inp'], ['u.gain1', 'cg.pos'], ['u.gain8', 'cg.neg'],
            ['u.vout', 'cc.a'], ['cc.b', 't.control'],
            ['ra.b', 'rb.a', 't.discharge'], ['rb.b', 't.threshold', 't.trigger', 'ct.a'],
            ['t.output', 'rs.a'], ['rs.b', 'pz.a'],
            ['bat.neg', 'mic.b', 'u.gnd', 'u.inn', 't.gnd', 'ct.b', 'pz.b'],
        ],
        open: ['u.bypass'],
    },

    // The same LM386 at gain 200 drives a loudspeaker; a magnetic earphone
    // is its microphone, held `distanceCm` over the speaker. Close enough,
    // what the speaker plays reaches the earphone louder than it started and
    // goes round again: the howl. The 10 kΩ volume pot in series with the
    // gain capacitor (turned fully up: full gain) and the distance decide whether the
    // loop gain reaches one.
    'lab-feedback-howl': {
        vcc: 9, supply: SUP,
        parts: { bat: BAT9, ep: ['earphone', { type: 'magnetic', ohms: 2000, henrys: 0.1, hears: '@spk', distanceCm: 3 }],
            u: LM386, cg: EL(10e-6), vol: POT(10000, 1), co: EL(220e-6), spk: ['speaker', { ohms: 8 }] },
        nets: [
            ['bat.pos', 'u.vs'],
            ['ep.a', 'u.inp'], ['u.gain1', 'cg.pos'], ['cg.neg', 'vol.a'], ['vol.wiper', 'u.gain8'],
            ['u.vout', 'co.pos'], ['co.neg', 'spk.a'],
            ['bat.neg', 'ep.b', 'u.gnd', 'u.inn', 'spk.b'],
        ],
        open: ['u.bypass', 'vol.b'],
    },
    // A loudspeaker lying beside a ringing telephone hears its bell (about
    // 110 dB SPL right beside it; bursts of 1 s every 5 s). An LM386 at gain
    // 200 amplifies the coil's few millivolts. 1 µF and two germanium
    // diodes pump the bell into 2.2 µF, which drives an NPN through 1 kΩ:
    // the transistor's base is also what empties it, so the NPN conducts
    // only while the bell keeps pumping (the amplifier's own switch-on step
    // is gone in a millisecond, too short for the relay). The NPN pulls in a
    // relay (flyback diode and 47 µF across its coil, which carry it over
    // the gaps between the clapper's strikes); the relay's contact lights the
    // lamp, which stands for the mains appliance a real relay's isolated
    // contacts would switch.
    'lab-ring-relay': {
        vcc: 9, supply: SUP,
        parts: { bat: BAT9, mic: ['speaker', { ohms: 8, soundDb: 110, soundWave: 'ring', soundHz: 900, ringOnS: 1, ringOffS: 4 }],
            u: LM386, cg: EL(10e-6), cp: C(1e-6), d1: ['diode', { part: '1N34A' }], d2: ['diode', { part: '1N34A' }],
            ch: C(2.2e-6), rb: R(1000), q: NPN,
            k: ['relay', {}], df: ['diode', { part: '1N4148' }], ck: EL(47e-6),
            lamp: ['light_bulb', { ohms: 90, vRated: 9 }] },
        nets: [
            ['bat.pos', 'u.vs', 'k.coil_a', 'df.cathode', 'ck.pos', 'k.com'],
            ['mic.a', 'u.inp'], ['u.gain1', 'cg.pos'], ['u.gain8', 'cg.neg'],
            ['u.vout', 'cp.a'], ['cp.b', 'd1.cathode', 'd2.anode'],
            ['d2.cathode', 'ch.a', 'rb.a'], ['rb.b', 'q.base'],
            ['q.collector', 'k.coil_b', 'df.anode', 'ck.neg'], ['k.no', 'lamp.a'],
            ['bat.neg', 'mic.b', 'u.gnd', 'u.inn', 'd1.anode', 'ch.b', 'q.emitter', 'lamp.b'],
        ],
        open: ['u.bypass', 'k.nc'],
    },
    // A thermocouple twisted from a copper and a constantan wire (type T) on
    // the + input of an LM358 wired for a gain of 101 (100 kΩ / 1 kΩ). The
    // amplifier lifts the tens of millivolts to volts, which a moving-coil
    // meter (10 V full scale) shows. As authored the junction sits in a
    // match flame (600 °C); a lighter's hotter flame (900 °C) reads more.
    'lab-thermocouple': {
        vcc: 9, supply: SUP,
        parts: { bat: BAT9, tc: ['thermocouple', { type: 'T', hotC: 600, ohms: 5 }],
            u: ['lm358', {}], rf: R(100000), rg: R(1000), meter: ['analog_meter', { fullScale: 10, ifs: 0.0001 }] },
        nets: [
            ['bat.pos', 'u.vcc'], ['tc.pos', 'u.1_pos'], ['u.1_neg', 'rf.b', 'rg.a'], ['u.1_out', 'rf.a', 'meter.a'],
            ['bat.neg', 'tc.neg', 'rg.b', 'u.gnd', 'meter.b', 'u.2_pos', 'u.2_neg'],
        ],
        open: ['u.2_out'],
    },

    // A coil of 1000 turns wound on a 3 cm tube. A bar magnet dropped through
    // it from 20 cm induces a pulse as it enters and an opposite one as it
    // leaves. The positive one reaches the base of Q1 in a transistor
    // flip-flop through a diode and 1 kΩ (100 kΩ holds that base quiet).
    // Q1 and Q2 are cross-coupled through 22 kΩ; the red LED shows Q1 on,
    // the green one Q2 on. The reset button pulls Q1's base to ground; 1 µF
    // on that base makes Q2 win at switch-on.
    'lab-magnet-drop': {
        vcc: 9, supply: SUP,
        parts: { bat: BAT9, coil: ['air_coil', { turns: 1000, radiusM: 0.015, lengthM: 0.03, wireMm: 0.2, dropHeightM: 0.2, magnetAm2: 1 }],
            d: ['diode', { part: '1N4148' }], ri: R(1000), rp: R(100000), cb: C(1e-6),
            q1: NPN, q2: NPN, r1: R(1000), red: LED('red'), r2: R(1000), green: LED('green'),
            x1: R(22000), x2: R(22000), reset: ['button', {}] },
        nets: [
            ['bat.pos', 'r1.a', 'r2.a'],
            ['coil.a', 'd.anode'], ['d.cathode', 'ri.a'], ['ri.b', 'q1.base', 'rp.a', 'cb.a', 'x2.b', 'reset.a'],
            ['r1.b', 'red.anode'], ['red.cathode', 'q1.collector', 'x1.a'],
            ['r2.b', 'green.anode'], ['green.cathode', 'q2.collector', 'x2.a'],
            ['x1.b', 'q2.base'],
            ['bat.neg', 'coil.b', 'rp.b', 'cb.b', 'q1.emitter', 'q2.emitter', 'reset.b'],
        ],
    },

    // The field of a hand-wound coil: 200 turns on a 3 cm tube, a 1.5 V cell,
    // 22 Ω and a 100 Ω rheostat to set the current, an ammeter in the loop.
    // A compass 5 cm along the coil's axis (the coil lying east–west) turns
    // away from north as the coil's field adds to the Earth's.
    'lab-coil-compass': {
        vcc: 9, supply: { pos: 'cell.pos', neg: 'cell.neg' },
        parts: { cell: ['vsource', { volts: 1.5 }], sw: ['switch', {}], rs: R(22), pot: POT(100, 1),
            am: ['ammeter', {}], coil: ['air_coil', { turns: 200, radiusM: 0.015, lengthM: 0.03, wireMm: 0.25, compassCm: 5 }] },
        nets: [
            ['cell.pos', 'sw.a'], ['sw.b', 'rs.a'], ['rs.b', 'pot.a'], ['pot.wiper', 'am.a'], ['am.b', 'coil.a'],
            ['cell.neg', 'coil.b'],
        ],
        open: ['pot.b'],
    },

    // Two Colpitts oscillators, each an NPN with its coil from +9 V to the
    // collector, 100 nF from collector to emitter and 1 µF from emitter to
    // ground (4.7 kΩ emitter resistor; base held by 22 k / 10 k and 1 µF):
    // one around the hand-wound search coil (1000 turns, 10 cm across,
    // ≈ 1.5 kHz), the other around a fixed 175 mH coil, about 200 Hz lower.
    // Each collector reaches a germanium detector through 1 nF and 100 kΩ;
    // 22 nF and 100 kΩ after the diode keep the difference, the beat, and a
    // crystal earphone sounds it. Metal at the search coil shifts its
    // inductance and with it the beat's pitch.
    'lab-metal-detector': {
        vcc: 9, supply: SUP,
        parts: { bat: BAT9,
            ls: ['air_coil', { turns: 1000, radiusM: 0.05, lengthM: 0.03, wireMm: 0.3 }], c1s: C(100e-9), c2s: C(1e-6),
            qs: NPN, res: R(4700), ras: R(22000), rbs: R(10000), cbs: C(1e-6),
            lr: ['inductor', { henries: 0.175 }], c1r: C(100e-9), c2r: C(1e-6),
            qr: NPN, rer: R(4700), rar: R(22000), rbr: R(10000), cbr: C(1e-6),
            cks: C(1e-9), rks: R(100000), ckr: C(1e-9), rkr: R(100000), rm: R(100000),
            d: ['diode', { part: '1N34A' }], cd: C(22e-9), rd: R(100000), ep: ['earphone', { type: 'crystal' }] },
        nets: [
            ['bat.pos', 'ls.a', 'ras.a', 'lr.a', 'rar.a'],
            ['ls.b', 'qs.collector', 'c1s.a', 'cks.a'], ['c1s.b', 'c2s.a', 'qs.emitter', 'res.a'], ['ras.b', 'rbs.a', 'cbs.a', 'qs.base'],
            ['lr.b', 'qr.collector', 'c1r.a', 'ckr.a'], ['c1r.b', 'c2r.a', 'qr.emitter', 'rer.a'], ['rar.b', 'rbr.a', 'cbr.a', 'qr.base'],
            ['cks.b', 'rks.a'], ['ckr.b', 'rkr.a'], ['rks.b', 'rkr.b', 'rm.a', 'd.anode'],
            ['d.cathode', 'cd.a', 'rd.a', 'ep.a'],
            ['bat.neg', 'c2s.b', 'res.b', 'rbs.b', 'cbs.b', 'c2r.b', 'rer.b', 'rbr.b', 'cbr.b', 'rm.b', 'cd.b', 'rd.b', 'ep.b'],
        ],
    },

    // A battery on the tongue, as a circuit: the electrolyte between the two
    // contacts is a resistance (about 2 kΩ), and each contact an electrode
    // that passes current into it only by electrolysis, which needs about
    // 1.7 V. A slide switch picks a 1.5 V cell (left) or a 9 V battery
    // (right); the TOUCH button is the tongue on the contacts. A voltmeter
    // across the electrodes shows what is left on them after the tongue
    // lets go.
    'lab-tongue-battery': {
        vcc: 9, supply: SUP,
        parts: { bat: BAT9, cell: ['vsource', { volts: 1.5 }], sw: ['slide_switch', { position: 1 }], touch: ['button', {}],
            am: ['ammeter', {}], tongue: ['electrolysis_cell', { ohms: 2000, farads: 2e-6, onsetV: 1.7 }], vm: ['voltmeter', {}] },
        nets: [
            ['cell.pos', 'sw.a'], ['bat.pos', 'sw.b'], ['sw.com', 'touch.a'], ['touch.b', 'am.a'], ['am.b', 'tongue.a', 'vm.a'],
            ['bat.neg', 'cell.neg', 'tongue.b', 'vm.b'],
        ],
    },
};

// Resolve '@name' params to engine ids.
for (const spec of Object.values(BENCHES)) {
    const ids = benchIds(spec);
    for (const [, params] of Object.values(spec.parts))
        for (const [k, v] of Object.entries(params || {}))
            if (typeof v === 'string' && v.startsWith('@')) params[k] = ids[v.slice(1)];
}
