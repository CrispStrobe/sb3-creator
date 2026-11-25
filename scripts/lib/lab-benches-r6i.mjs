/**
 * Netlists for the round-6 "r6i" lab benches: sound and music over a light
 * guide with a two-transistor astable or a transistor modulator and an
 * LM386 receiver; a light guide's losses heard as a 4046 VCO's pitch and
 * read on an op-amp meter; an op-amp-swept transistor astable near 100 kHz
 * sent down a fibre and demodulated by a 4046 loop; the LM386 as a
 * comparator for reflected colour and for a self-heated PTC bridge; an
 * LM386 tone switched by a biased solar cell or by a Hall switch; a Hall
 * changeover with hysteresis and a Hall-tuned 4046 pitch; a phototransistor
 * lux meter with a PNP stage and with an op-amp follower; a two-stage
 * microphone amplifier into a transistor rectifier; and a thermocouple
 * straight onto a millivolt meter.
 * Written by `node scripts/gen-lab-circuits-4.mjs --set=r6i`.
 *
 * Same shape as lab-benches-4.mjs: pure data, so test/lab-circuits-r6i.test.mjs
 * names parts by role. Ids follow benchIds (breadboard first, then the parts
 * in the order listed). A param written '@role' (a light path's from / to)
 * is resolved to that part's engine id below.
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
const BAT9 = ['vsource', { volts: 9, variant: '9v' }];
const POT = (ohms, position) => ['potentiometer', { ohms, position }];
const PLL = ['cd4046', {}];
const LM386 = ['lm386', {}];
const LM358 = ['lm358', {}];
const PATH = (params) => ['light_path', params];
const SPK = ['speaker', { ohms: 8 }];

export const BENCHES = {
    'lab-fibre-morse-music': {
        vcc: 9, supply: SUP,
        parts: { bat: BAT9,
            key: ['button', {}], rc1: R(1000), rc2: R(1000), q1: NPN, q2: NPN, ca: C(47e-9), cb: C(47e-9), rba: R(22000), rbb: R(22000),
            player: ['function_gen', { wave: 'sine', freq: 440, amplitude: 0.5, offset: 0 }],
            src: ['slide_switch', { position: 0 }], cin: C(1e-6), rin: R(10000), rbh: R(47000), rbl: R(10000),
            rled: R(220), led: LED('red'), qm: NPN, rem: R(220),
            pt: ['phototransistor', {}], re: R(220), cc: C(47e-9), a: LM386, cby: EL(1e-6), co: EL(220e-6), spk: SPK,
            guide: PATH({ from: '@led', to: '@pt', medium: 'fibre', lengthM: 2, outGapMm: 1, shield: 1,
                knob: 'outGapMm', knobMin: 0, knobMax: 20 }) },
        nets: [
            ['bat.pos', 'key.a', 'rbh.a', 'rled.a', 'pt.collector', 'a.vs'],
            ['key.b', 'rc1.a', 'rc2.a', 'rba.a', 'rbb.a'],
            ['rc1.b', 'q1.collector', 'ca.a'], ['ca.b', 'q2.base', 'rba.b'], ['rc2.b', 'q2.collector', 'cb.a', 'src.a'], ['cb.b', 'q1.base', 'rbb.b'],
            ['player.out', 'src.b'], ['src.com', 'cin.a'], ['cin.b', 'rin.a'], ['rin.b', 'rbh.b', 'rbl.a', 'qm.base'],
            ['rled.b', 'led.anode'], ['led.cathode', 'qm.collector'], ['qm.emitter', 'rem.a'],
            ['pt.emitter', 're.a', 'cc.a'], ['cc.b', 'a.inp'], ['a.bypass', 'cby.pos'], ['a.vout', 'co.pos'], ['co.neg', 'spk.a'],
            ['bat.neg', 'q1.emitter', 'q2.emitter', 'player.gnd', 'rbl.b', 'rem.b', 're.b', 'a.inn', 'a.gnd', 'cby.neg', 'spk.b'],
        ],
        open: ['a.gain1', 'a.gain8'],
    },

    'lab-fibre-loss-receivers': {
        vcc: 9, supply: SUP,
        parts: { bat: BAT9, rled: R(1000), led: LED('red'), pt: ['phototransistor', {}], rl: R(1000), cl: C(100e-9),
            u: PLL, r1: R(47000), r2: R(470000), c1: C(10e-9), rpz: R(1000), pz: ['piezo', {}],
            o: LM358, rg: R(10000), rf: R(10000), meter: ['analog_meter', { fullScale: 5, ifs: 0.0001 }],
            guide: PATH({ from: '@led', to: '@pt', medium: 'fibre', lengthM: 1, bendRadiusCm: 5, bends: 1, jointGapMm: 0,
                jointOffsetMm: 0, jointAngleDeg: 0, outGapMm: 1, shield: 1, knob: 'bendRadiusCm', knobMin: 0.4, knobMax: 5 }) },
        nets: [
            ['bat.pos', 'rled.a', 'pt.collector', 'u.vdd', 'o.vcc'], ['rled.b', 'led.anode'],
            ['pt.emitter', 'rl.a', 'cl.a', 'u.vco_in', 'o.1_pos'],
            ['u.r1', 'r1.a'], ['u.r2', 'r2.a'], ['u.c1a', 'c1.a'], ['u.c1b', 'c1.b'], ['u.vco_out', 'rpz.a'], ['rpz.b', 'pz.a'],
            ['o.1_neg', 'rg.a', 'rf.a'], ['rf.b', 'o.1_out', 'meter.a'],
            ['bat.neg', 'led.cathode', 'rl.b', 'cl.b', 'u.vss', 'u.inh', 'r1.b', 'r2.b', 'pz.b', 'rg.b', 'o.gnd', 'o.2_pos', 'o.2_neg', 'meter.b'],
        ],
        open: ['u.pcp_out', 'u.pc1_out', 'u.comp_in', 'u.dem_out', 'u.pc2_out', 'u.sig_in', 'u.zener', 'o.2_out'],
    },

    'lab-colour-amp-comparator': {
        vcc: 9, supply: SUP,
        parts: { bat: BAT9, rs: R(470), led: LED('red'), pt: ['phototransistor', {}], re: R(10000), rin: R(100000),
            rt: R(47000), set: POT(10000, 0.5), a: LM386, rr: R(1000), red: LED('red'), rg: R(1000), green: LED('green'),
            look: PATH({ from: '@led', to: '@pt', medium: 'reflect', surface: 'red', distanceCm: 1,
                knob: 'distanceCm', knobMin: 0.3, knobMax: 5 }) },
        nets: [
            ['bat.pos', 'rs.a', 'pt.collector', 'rt.a', 'a.vs', 'rg.a'], ['rs.b', 'led.anode'],
            ['pt.emitter', 're.a', 'rin.a'], ['rin.b', 'a.inp'], ['rt.b', 'set.a'], ['set.wiper', 'a.inn'], ['a.gain1', 'a.gain8'],
            ['a.vout', 'rr.a', 'green.cathode'], ['rr.b', 'red.anode'], ['rg.b', 'green.anode'],
            ['bat.neg', 'led.cathode', 're.b', 'set.b', 'a.gnd', 'red.cathode'],
        ],
        open: ['a.bypass'],
    },

    'lab-solar-tone-switch': {
        vcc: 9, supply: SUP,
        parts: { bat: BAT9, cell: ['solar_cell', { light: 0.5, voc: 0.5, isc: 0.001 }], bias: ['slide_switch', { position: 0 }],
            rbt: R(100000), bpot: POT(10000, 0.5), rb: R(4700), q1: NPN, rc1: R(22000), rq2: R(22000), q2: NPN,
            a: LM386, ra1: R(1000000), ra2: R(1000000), rt: R(220000), ct: C(47e-9), co: EL(220e-6), spk: SPK },
        nets: [
            ['bat.pos', 'rbt.a', 'rc1.a', 'a.vs', 'ra1.a'],
            ['rbt.b', 'bpot.a'], ['bpot.wiper', 'bias.b'], ['bias.com', 'cell.neg'], ['cell.pos', 'rb.a'], ['rb.b', 'q1.base'],
            ['q1.collector', 'rc1.b', 'rq2.a'], ['rq2.b', 'q2.base'],
            ['q2.collector', 'rt.b', 'ct.a', 'a.inn'], ['ra1.b', 'ra2.b', 'a.inp'], ['a.gain1', 'a.gain8'], ['a.vout', 'ra2.a', 'rt.a', 'co.pos'], ['co.neg', 'spk.a'],
            ['bat.neg', 'bias.a', 'bpot.b', 'q1.emitter', 'q2.emitter', 'ct.b', 'a.gnd', 'spk.b'],
        ],
        open: ['a.bypass'],
    },

    'lab-hall-door-tone': {
        vcc: 9, supply: SUP,
        parts: { bat: BAT9, hall: ['hall_analog', { field: 0, threshold: 0.5 }], rq: R(10000), q: NPN, rled: R(1000), led: LED('green'),
            a: LM386, ra1: R(1000000), ra2: R(1000000), rt: R(220000), ct: C(47e-9), co: EL(220e-6), spk: SPK },
        nets: [
            ['bat.pos', 'hall.vcc', 'rled.a', 'a.vs', 'ra1.a'],
            ['hall.do', 'rq.a', 'led.cathode'], ['rq.b', 'q.base'], ['rled.b', 'led.anode'],
            ['q.collector', 'rt.b', 'ct.a', 'a.inn'],
            ['ra1.b', 'ra2.b', 'a.inp'], ['a.gain1', 'a.gain8'], ['a.vout', 'ra2.a', 'rt.a', 'co.pos'], ['co.neg', 'spk.a'],
            ['bat.neg', 'hall.gnd', 'q.emitter', 'ct.b', 'a.gnd', 'spk.b'],
        ],
        open: ['hall.ao', 'a.bypass'],
    },

    'lab-hall-changeover-pitch': {
        vcc: 9, supply: SUP,
        parts: { bat: BAT9, hall: ['hall_analog', { field: 0 }],
            rin: R(10000), rbg: R(10000), q1: NPN, rl1: R(2200), la: LED('yellow'), r12: R(33000), r2g: R(30000), q2: NPN, rl2: R(1000), lb: LED('green'), re: R(470),
            rv: R(10000), u: PLL, r1: R(47000), r2: R(470000), c1: C(10e-9), rpz: R(1000), pz: ['piezo', {}] },
        nets: [
            ['bat.pos', 'hall.vcc', 'rl1.a', 'rl2.a', 'u.vdd'],
            ['hall.ao', 'rin.a', 'rv.a'], ['rin.b', 'rbg.a', 'q1.base'],
            ['rl1.b', 'la.anode'], ['la.cathode', 'q1.collector', 'r12.a'], ['r12.b', 'r2g.a', 'q2.base'],
            ['rl2.b', 'lb.anode'], ['lb.cathode', 'q2.collector'], ['q1.emitter', 'q2.emitter', 're.a'],
            ['rv.b', 'u.vco_in'], ['u.r1', 'r1.a'], ['u.r2', 'r2.a'], ['u.c1a', 'c1.a'], ['u.c1b', 'c1.b'], ['u.vco_out', 'rpz.a'], ['rpz.b', 'pz.a'],
            ['bat.neg', 'hall.gnd', 'rbg.b', 'r2g.b', 're.b', 'u.vss', 'u.inh', 'r1.b', 'r2.b', 'pz.b'],
        ],
        open: ['hall.do', 'u.pcp_out', 'u.pc1_out', 'u.comp_in', 'u.dem_out', 'u.pc2_out', 'u.sig_in', 'u.zener'],
    },

    'lab-lux-meter-pnp': {
        vcc: 9, supply: SUP,
        parts: { bat: BAT9,
            pt1: ['phototransistor', { light: 0.1 }], rbe: R(4700), qp: PNP, rep: R(4700), m1: ['analog_meter', { fullScale: 5, ifs: 0.001 }],
            pt2: ['phototransistor', { light: 0.1 }], rl: R(4700), o: LM358, m2: ['analog_meter', { fullScale: 5, ifs: 0.001 }] },
        nets: [
            ['bat.pos', 'rbe.a', 'rep.a', 'pt2.collector', 'o.vcc'],
            ['rbe.b', 'qp.base', 'pt1.collector'], ['rep.b', 'qp.emitter'], ['qp.collector', 'm1.a'],
            ['pt2.emitter', 'rl.a', 'o.1_pos'], ['o.1_neg', 'o.1_out', 'm2.a'],
            ['bat.neg', 'pt1.emitter', 'm1.b', 'rl.b', 'o.gnd', 'o.2_pos', 'o.2_neg', 'm2.b'],
        ],
        open: ['o.2_out'],
    },

    'lab-noise-level-meter': {
        vcc: 9, supply: SUP,
        parts: { bat: BAT9, mic: ['earphone', { type: 'magnetic', ohms: 2000, henrys: 0.1, soundDb: 70, soundWave: 'voice', soundHz: 150 }],
            rh1: R(2200), rh2: R(2200), ch: EL(10e-6), o: LM358, rf: R(1000000), rg: R(10000),
            c2: C(100e-9), a: LM386, cby: EL(1e-6), c3: EL(1e-6), dcl: ['diode', {}], rbq: R(22000), q: NPN,
            chold: EL(2.2e-6), meter: ['analog_meter', { fullScale: 5, ifs: 0.0005 }] },
        nets: [
            ['bat.pos', 'rh1.a', 'o.vcc', 'a.vs', 'q.collector'],
            ['rh1.b', 'rh2.a', 'ch.pos', 'mic.b', 'rg.b'], ['mic.a', 'o.1_pos'], ['o.1_neg', 'rf.a', 'rg.a'],
            ['o.1_out', 'rf.b', 'c2.a'], ['c2.b', 'a.inp'], ['a.bypass', 'cby.pos'],
            ['a.vout', 'c3.pos'], ['c3.neg', 'dcl.cathode', 'rbq.a', 'q.base'], ['q.emitter', 'chold.pos', 'meter.a'],
            ['bat.neg', 'rh2.b', 'ch.neg', 'o.gnd', 'o.2_pos', 'o.2_neg', 'a.inn', 'a.gnd', 'cby.neg', 'dcl.anode', 'rbq.b', 'chold.neg', 'meter.b'],
        ],
        open: ['o.2_out', 'a.gain1', 'a.gain8'],
    },

    'lab-draught-alarm': {
        vcc: 9, supply: SUP,
        parts: { bat: BAT9, ptc: ['ptc_sensor', { r25: 2000, rth: 1000, thermalTau: 1 }], rs: R(330), rh: R(100000),
            rt: R(6800), set: POT(200, 0.73), rb: R(820), a: LM386,
            rc1: R(1000), l1: LED('red'), rc2: R(1000), l2: LED('red'), q1: NPN, q2: NPN, ca: EL(10e-6), cb: EL(10e-6), rba: R(47000), rbb: R(47000) },
        nets: [
            ['bat.pos', 'ptc.a', 'rt.a', 'a.vs'],
            ['ptc.b', 'rs.a', 'rh.a', 'a.inp'], ['rt.b', 'set.a'], ['set.b', 'rb.a'], ['set.wiper', 'a.inn'],
            ['a.gain1', 'a.gain8'],
            ['a.vout', 'rh.b', 'rc1.a', 'rc2.a', 'rba.a', 'rbb.a'],
            ['rc1.b', 'l1.anode'], ['l1.cathode', 'q1.collector', 'ca.pos'], ['ca.neg', 'q2.base', 'rba.b'],
            ['rc2.b', 'l2.anode'], ['l2.cathode', 'q2.collector', 'cb.pos'], ['cb.neg', 'q1.base', 'rbb.b'],
            ['bat.neg', 'rs.b', 'rb.b', 'a.gnd', 'q1.emitter', 'q2.emitter'],
        ],
        open: ['a.bypass'],
    },

    'lab-thermocouple-millivolts': {
        vcc: 9,
        parts: { gnd: ['gnd', {}], tc: ['thermocouple', { type: 'T', hotC: 600, ohms: 5 }],
            meter: ['analog_meter', { fullScale: 0.05, ifs: 0.0001 }] },
        nets: [['tc.pos', 'meter.a'], ['gnd.gnd', 'tc.neg', 'meter.b']],
    },
};

// Resolve '@role' params (a light path's ends, a thermal part's heater) to engine ids.
for (const spec of Object.values(BENCHES)) {
    const ids = benchIds(spec);
    for (const [, params] of Object.values(spec.parts))
        for (const [k, v] of Object.entries(params || {}))
            if (typeof v === 'string' && v.startsWith('@')) {
                if (!ids[v.slice(1)]) throw new Error(`${k}: unknown role ${v}`);
                params[k] = ids[v.slice(1)];
            }
}
