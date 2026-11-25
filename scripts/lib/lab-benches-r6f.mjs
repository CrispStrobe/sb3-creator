/**
 * Netlists for the round-6 "r6f" lab benches: a 4046-type phase-locked loop
 * (`cd4046`: its VCO tuned by a pot, a phototransistor or a humidity comb,
 * modulated, beating, locking to a transistor astable, showing its lock
 * range, decoding two tones), a silicon PTC sensor (`ptc_sensor`) in
 * bridges, alarms, a window and a fibre link, a Hall sensor on a motor shaft
 * and under a bending ruler, and light links over a fibre or a lens.
 * Written by `node scripts/gen-lab-circuits-4.mjs --set=r6f`.
 *
 * Same shape as lab-benches-4.mjs: pure data, so test/lab-circuits-r6f.test.mjs
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

export const BENCHES = {
    'lab-pll-vco': {
        vcc: 9, supply: SUP,
        parts: { bat: BAT9, pot: POT(10000, 0.5), u: PLL, r1: R(47000), r2: R(220000), c1: C(10e-9),
            rb: R(4700), q: NPN, rs: R(100), spk: ['speaker', { ohms: 8 }], d: ['diode', {}] },
        nets: [
            ['bat.pos', 'pot.a', 'u.vdd', 'rs.a', 'd.cathode'],
            ['pot.wiper', 'u.vco_in'], ['u.r1', 'r1.a'], ['u.r2', 'r2.a'], ['u.c1a', 'c1.a'], ['u.c1b', 'c1.b'],
            ['u.vco_out', 'rb.a'], ['rb.b', 'q.base'], ['rs.b', 'spk.a'], ['spk.b', 'q.collector', 'd.anode'],
            ['bat.neg', 'pot.b', 'u.vss', 'u.inh', 'r1.b', 'r2.b', 'q.emitter'],
        ],
        open: ['u.pcp_out', 'u.pc1_out', 'u.comp_in', 'u.dem_out', 'u.pc2_out', 'u.sig_in', 'u.zener'],
    },
    'lab-pll-lock': {
        vcc: 9, supply: SUP,
        parts: { bat: BAT9,
            rc1: R(1000), rc2: R(1000), q1: NPN, q2: NPN, ca: C(47e-9), cb: C(47e-9), rba: R(22000), rbb: R(2200), tune: POT(50000, 0.69),
            u: PLL, r1: R(100000), r2: R(47000), c1: C(10e-9), rf: R(47000), rd: R(100000), cf: C(22e-9), rbh: R(1000000), rbl: R(1000000),
            sw: ['slide_switch', { position: 0 }], man: POT(10000, 0.3),
            ra: R(10000), cavg: C(220e-9), rin: R(100000), rref: R(220000), a: LM386,
            rg: R(1000), green: LED('green'), rr: R(1000), red: LED('red') },
        nets: [
            ['bat.pos', 'rc1.a', 'rc2.a', 'rba.a', 'tune.a', 'u.vdd', 'rbh.a', 'man.a', 'rref.a', 'a.vs', 'rr.a'],
            ['rc1.b', 'q1.collector', 'ca.a'], ['ca.b', 'q2.base', 'rba.b'],
            ['rc2.b', 'q2.collector', 'cb.a', 'u.sig_in'], ['cb.b', 'q1.base', 'rbb.a'], ['rbb.b', 'tune.wiper'],
            ['u.r1', 'r1.a'], ['u.r2', 'r2.a'], ['u.c1a', 'c1.a'], ['u.c1b', 'c1.b'], ['u.vco_out', 'u.comp_in'],
            ['u.pc2_out', 'rf.a'], ['rf.b', 'rd.a', 'sw.a'], ['rd.b', 'cf.a'], ['man.wiper', 'sw.b'], ['sw.com', 'u.vco_in', 'rbh.b', 'rbl.a'],
            ['u.pcp_out', 'ra.a'], ['ra.b', 'cavg.a', 'rin.a'], ['rin.b', 'a.inp'], ['rref.b', 'a.inn'],
            ['a.vout', 'rg.a', 'red.cathode'], ['rg.b', 'green.anode'], ['rr.b', 'red.anode'],
            ['bat.neg', 'q1.emitter', 'q2.emitter', 'u.vss', 'u.inh', 'r1.b', 'r2.b', 'cf.b', 'rbl.b', 'man.b', 'cavg.b', 'a.gnd', 'green.cathode'],
        ],
        open: ['tune.b', 'u.pc1_out', 'u.dem_out', 'u.zener', 'a.gain1', 'a.gain8', 'a.bypass'],
    },

    'lab-led-power-curve': {
        vcc: 9, supply: SUP,
        parts: { bat: BAT9, cur: POT(4700, 0.5), rmin: R(220), am: ['ammeter', {}], sel: ['slide_switch', { position: 0 }],
            red: LED('red'), green: LED('green'), pd: ['photodiode', {}], u: LM358, rf: R(22000), vm: ['voltmeter', {}],
            pr: PATH({ from: '@red', to: '@pd', medium: 'air', distanceCm: 3 }),
            pg: PATH({ from: '@green', to: '@pd', medium: 'air', distanceCm: 3 }) },
        nets: [
            ['bat.pos', 'cur.a', 'u.vcc'], ['cur.wiper', 'rmin.a'], ['rmin.b', 'am.a'], ['am.b', 'sel.com'],
            ['sel.a', 'red.anode'], ['sel.b', 'green.anode'],
            ['pd.cathode', 'u.1_neg', 'rf.a'], ['rf.b', 'u.1_out', 'vm.a'],
            ['bat.neg', 'red.cathode', 'green.cathode', 'pd.anode', 'u.1_pos', 'u.gnd', 'u.2_pos', 'u.2_neg', 'vm.b'],
        ],
        open: ['cur.b', 'u.2_out'],
    },

    'lab-led-colour-blind': {
        vcc: 9, supply: SUP,
        parts: { bat: BAT9, swr: ['switch', { closed: true }], rr: R(470), red: LED('red'), swg: ['switch', {}], rg: R(470), green: LED('green'),
            sr: ['led', { color: 'red', photoSensitivity: 5e-6, light: 0 }], sg: ['led', { color: 'green', photoSensitivity: 5e-6, light: 0 }],
            sel: ['slide_switch', { position: 0 }], u: LM358, rf: R(1000000), meter: ['analog_meter', { fullScale: 5 }],
            p1: PATH({ from: '@red', to: '@sr', medium: 'air', distanceCm: 2 }),
            p2: PATH({ from: '@red', to: '@sg', medium: 'air', distanceCm: 2 }),
            p3: PATH({ from: '@green', to: '@sr', medium: 'air', distanceCm: 2 }),
            p4: PATH({ from: '@green', to: '@sg', medium: 'air', distanceCm: 2 }) },
        nets: [
            ['bat.pos', 'swr.a', 'swg.a', 'u.vcc'], ['swr.b', 'rr.a'], ['rr.b', 'red.anode'], ['swg.b', 'rg.a'], ['rg.b', 'green.anode'],
            ['sr.cathode', 'sel.a'], ['sg.cathode', 'sel.b'], ['sel.com', 'u.1_neg', 'rf.a'], ['rf.b', 'u.1_out', 'meter.a'],
            ['bat.neg', 'red.cathode', 'green.cathode', 'sr.anode', 'sg.anode', 'u.1_pos', 'u.gnd', 'u.2_pos', 'u.2_neg', 'meter.b'],
        ],
        open: ['u.2_out'],
    },

    'lab-light-thyristor': {
        vcc: 9, supply: SUP,
        parts: { bat: BAT9, main: ['slide_switch', { position: 1 }], rl: R(1000), led: LED('red'),
            qp: PNP, qn: NPN, rak: R(22000), rgk: R(2200), pt: ['phototransistor', { light: 0 }], rg: R(10000) },
        nets: [
            ['bat.pos', 'main.com', 'pt.collector'], ['main.b', 'rl.a'], ['rl.b', 'led.anode'],
            ['led.cathode', 'qp.emitter', 'rak.a'],
            ['qp.base', 'rak.b', 'qn.collector'],
            ['qp.collector', 'qn.base', 'rgk.a', 'rg.b'], ['pt.emitter', 'rg.a'],
            ['bat.neg', 'qn.emitter', 'rgk.b'],
        ],
        open: ['main.a'],
    },

    'lab-fibre-proximity': {
        vcc: 9, supply: SUP,
        parts: { bat: BAT9, rs: R(1000), led: LED('red'), pt: ['phototransistor', {}], rb: R(22000), rbe: R(4700), q: NPN,
            k: ['relay', { coilR: 200 }], df: ['diode', {}], rl: R(1000), lamp: LED('yellow'),
            gap: PATH({ from: '@led', to: '@pt', medium: 'fibre', lengthM: 1, jointGapMm: 0.2, outGapMm: 1,
                knob: 'jointGapMm', knobMin: 0, knobMax: 5 }) },
        nets: [
            ['bat.pos', 'rs.a', 'pt.collector', 'k.coil_a', 'df.cathode', 'k.com'], ['rs.b', 'led.anode'],
            ['pt.emitter', 'rb.a'], ['rb.b', 'rbe.a', 'q.base'], ['q.collector', 'k.coil_b', 'df.anode'],
            ['k.no', 'rl.a'], ['rl.b', 'lamp.anode'],
            ['bat.neg', 'led.cathode', 'rbe.b', 'q.emitter', 'lamp.cathode'],
        ],
        open: ['k.nc'],
    },

    'lab-ruler-scale': {
        vcc: 9, supply: SUP,
        parts: { bat: BAT9, ruler: ['bending_ruler', { loadG: 0, gapMm: 25, magnetAm2: 0.1 }],
            zt: R(47000), zero: POT(1000, 0.82), zb: R(47000), u: LM358,
            r1: R(10000), r2: R(200000), r3: R(10000), r4: R(200000), meter: ['analog_meter', { fullScale: 5, ifs: 0.0001 }] },
        nets: [
            ['bat.pos', 'ruler.vcc', 'zt.a', 'u.vcc'], ['zt.b', 'zero.a'], ['zero.b', 'zb.a'],
            ['zero.wiper', 'u.2_pos'], ['u.2_out', 'u.2_neg', 'r3.a'],
            ['ruler.ao', 'r1.a'], ['r1.b', 'r2.a', 'u.1_pos'], ['r3.b', 'r4.a', 'u.1_neg'], ['r4.b', 'u.1_out', 'meter.a'],
            ['bat.neg', 'ruler.gnd', 'zb.b', 'r2.b', 'u.gnd', 'meter.b'],
        ],
    },

    'lab-ptc-bridge': {
        vcc: 9, supply: SUP,
        parts: { bat: BAT9, rt1: R(39000), ptc: ['ptc_sensor', { r25: 2000, surroundC: 25, thermalTau: 1 }],
            rt2: R(39000), rb: R(1800), bal: POT(470, 0.575), meter: ['analog_meter', { fullScale: 0.05, ifs: 0.000005 }],
            a: LM386, rh: R(1000), red: LED('red'), rc: R(1000), green: LED('green') },
        nets: [
            ['bat.pos', 'rt1.a', 'rt2.a', 'a.vs', 'rc.a'],
            ['rt1.b', 'ptc.a', 'meter.a', 'a.inp'], ['rt2.b', 'rb.a', 'meter.b', 'a.inn'], ['rb.b', 'bal.a'],
            ['a.gain1', 'a.gain8'],
            ['a.vout', 'rh.a', 'green.cathode'], ['rh.b', 'red.anode'], ['rc.b', 'green.anode'],
            ['bat.neg', 'ptc.b', 'bal.wiper', 'a.gnd', 'red.cathode'],
        ],
        open: ['bal.b', 'a.bypass'],
    },


    'lab-ptc-thermometer': {
        vcc: 9, supply: SUP,
        parts: { bat: BAT9, ptc: ['ptc_sensor', { r25: 2000, surroundC: 20, thermalTau: 1 }], rt: R(6800),
            ot: R(6800), off: POT(1000, 0.485), ob: R(1500), u: LM358,
            r1: R(10000), r2: R(360000), r3: R(10000), r4: R(360000), meter: ['analog_meter', { fullScale: 5, ifs: 0.0001 }] },
        nets: [
            ['bat.pos', 'rt.a', 'ot.a', 'u.vcc'], ['rt.b', 'ptc.a', 'r1.a'], ['ot.b', 'off.a'], ['off.b', 'ob.a'],
            ['off.wiper', 'u.2_pos'], ['u.2_out', 'u.2_neg', 'r3.a'],
            ['r1.b', 'r2.a', 'u.1_pos'], ['r3.b', 'r4.a', 'u.1_neg'], ['r4.b', 'u.1_out', 'meter.a'],
            ['bat.neg', 'ptc.b', 'ob.b', 'r2.b', 'u.gnd', 'meter.b'],
        ],
    },
    'lab-lamp-hum': {
        vcc: 9, supply: SUP,
        parts: { bat: BAT9, mains: ['function_gen', { wave: 'sine', freq: 50, amplitude: 8, offset: 0 }], rref: R(1000000),
            d1: ['diode', {}], d2: ['diode', {}], d3: ['diode', {}], d4: ['diode', {}],
            src: ['slide_switch', { position: 0 }], rt: R(220), rl: R(220), lamp: LED('white'),
            pt: ['phototransistor', {}], re: R(4700), c1: C(1e-6), rb: R(680000), q: NPN, rc: R(4700),
            c2: C(1e-6), rin: R(100000), a: LM386, cby: EL(1e-6), co: EL(220e-6), spk: ['speaker', { ohms: 8 }],
            guide: PATH({ from: '@lamp', to: '@pt', medium: 'fibre', lengthM: 1, outGapMm: 1, shield: 1,
                knob: 'outGapMm', knobMin: 0, knobMax: 20 }) },
        nets: [
            ['bat.pos', 'rt.a', 'pt.collector', 'rc.a', 'a.vs'],
            ['mains.out', 'd1.anode', 'd3.cathode'], ['mains.gnd', 'd2.anode', 'd4.cathode', 'rref.a'],
            ['d1.cathode', 'd2.cathode', 'src.a'], ['rt.b', 'src.b'], ['src.com', 'rl.a'], ['rl.b', 'lamp.anode'],
            ['pt.emitter', 're.a', 'c1.a'], ['c1.b', 'q.base', 'rb.b'], ['rc.b', 'q.collector', 'rb.a', 'c2.a'],
            ['c2.b', 'rin.a'], ['rin.b', 'a.inp'], ['a.bypass', 'cby.pos'], ['a.vout', 'co.pos'], ['co.neg', 'spk.a'],
            ['bat.neg', 'rref.b', 'd3.anode', 'd4.anode', 'lamp.cathode', 're.b', 'q.emitter', 'a.gnd', 'cby.neg', 'a.inn', 'spk.b'],
        ],
        open: ['a.gain1', 'a.gain8'],
    },

    'lab-light-remote': {
        vcc: 9, supply: SUP,
        parts: { bat: BAT9, tx: ['switch', {}], rc1: R(1000), rled: R(470), txled: LED('red'), q1: NPN, q2: NPN,
            ca: C(100e-9), cb: C(100e-9), duty: POT(10000, 0.5), rb1: R(4700), rb2: R(4700),
            pt: ['phototransistor', {}], re: R(4700), rin: R(100000), rbias: R(1800000), a: LM386,
            load: ['slide_switch', { position: 0 }], rl: R(470), rxled: LED('green'),
            motor: ['dc_motor', { J: 5e-6, loadTorque: 0.0003 }], dm: ['diode', {}],
            link: PATH({ from: '@txled', to: '@pt', medium: 'air', distanceCm: 3, knob: 'distanceCm', knobMin: 1, knobMax: 30 }) },
        nets: [
            ['bat.pos', 'tx.a', 'pt.collector', 'rbias.a', 'a.vs'],
            ['tx.b', 'rc1.a', 'rled.a', 'duty.wiper'], ['rled.b', 'txled.anode'],
            ['rc1.b', 'q1.collector', 'ca.a'], ['ca.b', 'q2.base', 'rb2.b'], ['txled.cathode', 'q2.collector', 'cb.a'], ['cb.b', 'q1.base', 'rb1.b'],
            ['duty.a', 'rb1.a'], ['duty.b', 'rb2.a'],
            ['pt.emitter', 're.a', 'rin.a'], ['rin.b', 'a.inp'], ['rbias.b', 'a.inn'],
            ['a.vout', 'load.com'], ['load.a', 'rl.a'], ['rl.b', 'rxled.anode'], ['load.b', 'motor.a', 'dm.cathode'],
            ['bat.neg', 'q1.emitter', 'q2.emitter', 're.b', 'a.gnd', 'rxled.cathode', 'motor.b', 'dm.anode'],
        ],
        open: ['a.gain1', 'a.gain8', 'a.bypass'],
    },

    'lab-pll-light-tone': {
        vcc: 9, supply: SUP,
        parts: { bat: BAT9, pt: ['phototransistor', { light: 0.2 }], rl: R(3300), cl: C(100e-9),
            u: PLL, r1: R(47000), r2: R(470000), c1: C(10e-9),
            rin: R(100000), rgnd: R(2200), cs: C(10e-9), a: LM386, cby: EL(1e-6), co: EL(220e-6), spk: ['speaker', { ohms: 8 }] },
        nets: [
            ['bat.pos', 'pt.collector', 'u.vdd', 'a.vs'],
            ['pt.emitter', 'rl.a', 'cl.a', 'u.vco_in'], ['u.r1', 'r1.a'], ['u.r2', 'r2.a'], ['u.c1a', 'c1.a'], ['u.c1b', 'c1.b'],
            ['u.vco_out', 'rin.a'], ['rin.b', 'rgnd.a', 'cs.a', 'a.inp'], ['a.bypass', 'cby.pos'], ['a.vout', 'co.pos'], ['co.neg', 'spk.a'],
            ['bat.neg', 'rl.b', 'cl.b', 'u.vss', 'u.inh', 'r1.b', 'r2.b', 'rgnd.b', 'cs.b', 'cby.neg', 'a.gnd', 'a.inn', 'spk.b'],
        ],
        open: ['u.pcp_out', 'u.pc1_out', 'u.comp_in', 'u.dem_out', 'u.pc2_out', 'u.sig_in', 'u.zener', 'a.gain1', 'a.gain8'],
    },

    'lab-pll-sound-machine': {
        vcc: 9, supply: SUP,
        parts: { bat: BAT9, pitch: POT(10000, 0.5), rp: R(22000), u: PLL, r1: R(47000), r2: R(220000), c1: C(10e-9),
            rpz: R(1000), pz: ['piezo', {}],
            a: LM386, rfa: R(1000000), rfb: R(1000000), rt: R(220000), ct: C(470e-9),
            o: LM358, ri: R(47000), ci: C(220e-9), rdc: R(1000000), rh1: R(10000), rh2: R(10000),
            mod: ['switch', {}], sel: ['slide_switch', { position: 0 }], rm: R(47000) },
        nets: [
            ['bat.pos', 'pitch.a', 'u.vdd', 'a.vs', 'rfa.a', 'o.vcc', 'rh1.a'],
            ['pitch.wiper', 'rp.a'], ['rp.b', 'rm.b', 'u.vco_in'],
            ['u.r1', 'r1.a'], ['u.r2', 'r2.a'], ['u.c1a', 'c1.a'], ['u.c1b', 'c1.b'], ['u.vco_out', 'rpz.a'], ['rpz.b', 'pz.a'],
            ['rfa.b', 'rfb.a', 'a.inp'], ['a.gain1', 'a.gain8'], ['a.vout', 'rfb.b', 'rt.a', 'ri.a', 'sel.a'], ['rt.b', 'ct.a', 'a.inn'],
            ['ri.b', 'ci.a', 'rdc.a', 'o.1_neg'], ['rh1.b', 'rh2.a', 'o.1_pos'], ['o.1_out', 'ci.b', 'rdc.b', 'sel.b'],
            ['sel.com', 'mod.a'], ['mod.b', 'rm.a'],
            ['bat.neg', 'pitch.b', 'u.vss', 'u.inh', 'r1.b', 'r2.b', 'pz.b', 'ct.b', 'a.gnd', 'o.gnd', 'rh2.b', 'o.2_pos', 'o.2_neg'],
        ],
        open: ['u.pcp_out', 'u.pc1_out', 'u.comp_in', 'u.dem_out', 'u.pc2_out', 'u.sig_in', 'u.zener', 'a.bypass', 'o.2_out'],
    },

    'lab-pll-beats': {
        vcc: 9, supply: SUP,
        parts: { bat: BAT9, rc1: R(1000), rc2: R(1000), q1: NPN, q2: NPN, ca: C(47e-9), cb: C(47e-9), rba: R(22000), rbb: R(20000),
            u: PLL, tune: POT(10000, 0.5), r1: R(100000), r2: R(47000), c1: C(10e-9),
            m1: R(100000), c1m: C(1e-6), g1: R(1000), f1: C(10e-9), m2: R(100000), c2m: C(1e-6), g2: R(1000), f2: C(10e-9),
            a: LM386, cby: EL(1e-6), co: EL(220e-6), spk: ['speaker', { ohms: 8 }] },
        nets: [
            ['bat.pos', 'rc1.a', 'rc2.a', 'rba.a', 'rbb.a', 'u.vdd', 'tune.a', 'a.vs'],
            ['rc1.b', 'q1.collector', 'ca.a'], ['ca.b', 'q2.base', 'rba.b'], ['rc2.b', 'q2.collector', 'cb.a', 'm1.a'], ['cb.b', 'q1.base', 'rbb.b'],
            ['tune.wiper', 'u.vco_in'], ['u.r1', 'r1.a'], ['u.r2', 'r2.a'], ['u.c1a', 'c1.a'], ['u.c1b', 'c1.b'], ['u.vco_out', 'm2.a'],
            ['m1.b', 'c1m.a'], ['c1m.b', 'g1.a', 'f1.a', 'a.inp'], ['m2.b', 'c2m.a'], ['c2m.b', 'g2.a', 'f2.a', 'a.inn'],
            ['a.bypass', 'cby.pos'], ['a.vout', 'co.pos'], ['co.neg', 'spk.a'],
            ['bat.neg', 'q1.emitter', 'q2.emitter', 'tune.b', 'u.vss', 'u.inh', 'r1.b', 'r2.b', 'g1.b', 'f1.b', 'g2.b', 'f2.b', 'a.gnd', 'cby.neg', 'spk.b'],
        ],
        open: ['u.pcp_out', 'u.pc1_out', 'u.comp_in', 'u.dem_out', 'u.pc2_out', 'u.sig_in', 'u.zener', 'a.gain1', 'a.gain8'],
    },

    'lab-barcode-pen': {
        vcc: 9, supply: SUP,
        parts: { bat: BAT9, rs: R(470), led: LED('red'), pt: ['phototransistor', {}], re: R(10000),
            rq1: R(10000), q1: NPN, rc1: R(4700), rq2: R(10000), q2: NPN, rl: R(1000), bar: LED('yellow'), rq3: R(10000), q3: NPN,
            a: LM386, ra1: R(1000000), ra2: R(1000000), rt: R(220000), ct: C(56e-9), co: EL(220e-6), spk: ['speaker', { ohms: 8 }],
            pen: PATH({ from: '@led', to: '@pt', medium: 'reflect', surface: 'white', distanceCm: 0.5, blocked: 0,
                knob: 'blocked', knobMin: 0, knobMax: 1 }) },
        nets: [
            ['bat.pos', 'rs.a', 'pt.collector', 'rc1.a', 'rl.a', 'a.vs', 'ra1.a'], ['rs.b', 'led.anode'],
            ['pt.emitter', 're.a', 'rq1.a', 'rq3.a'], ['rq1.b', 'q1.base'], ['q1.collector', 'rc1.b', 'rq2.a'], ['rq2.b', 'q2.base'],
            ['rl.b', 'bar.anode'], ['bar.cathode', 'q2.collector'], ['rq3.b', 'q3.base'],
            ['q3.collector', 'rt.b', 'ct.a', 'a.inn'], ['ra1.b', 'ra2.b', 'a.inp'], ['a.gain1', 'a.gain8'], ['a.vout', 'ra2.a', 'rt.a', 'co.pos'], ['co.neg', 'spk.a'],
            ['bat.neg', 'led.cathode', 're.b', 'q1.emitter', 'q2.emitter', 'q3.emitter', 'ct.b', 'a.gnd', 'spk.b'],
        ],
        open: ['a.bypass'],
    },

    'lab-tail-light-fibre': {
        vcc: 9, supply: SUP,
        parts: { bat: BAT9, lights: ['switch', {}], bulb: ['slide_switch', { position: 0 }], rl: R(470), lamp: LED('red'),
            pt: ['phototransistor', {}], re: R(22000), rq: R(10000), qc: NPN,
            a: LM386, ra1: R(1000000), ra2: R(1000000), rt: R(220000), ct: C(56e-9), co: EL(220e-6), spk: ['speaker', { ohms: 8 }],
            guide: PATH({ from: '@lamp', to: '@pt', medium: 'fibre', lengthM: 2, outGapMm: 1, shield: 1 }) },
        nets: [
            ['bat.pos', 'lights.a'], ['lights.b', 'bulb.com', 'pt.collector', 'a.vs', 'ra1.a'], ['bulb.a', 'rl.a'], ['rl.b', 'lamp.anode'],
            ['pt.emitter', 're.a', 'rq.a'], ['rq.b', 'qc.base'],
            ['qc.collector', 'rt.b', 'ct.a', 'a.inn'], ['ra1.b', 'ra2.b', 'a.inp'], ['a.gain1', 'a.gain8'], ['a.vout', 'ra2.a', 'rt.a', 'co.pos'], ['co.neg', 'spk.a'],
            ['bat.neg', 'lamp.cathode', 're.b', 'qc.emitter', 'ct.b', 'a.gnd', 'spk.b'],
        ],
        open: ['bulb.b', 'a.bypass'],
    },

    'lab-brake-light-check': {
        vcc: 9, supply: SUP,
        parts: { bat: BAT9, pedal: ['button', {}], rp: R(10000), rd: R(10000), dd: ['diode', {}], cd: EL(1e-6),
            bulb: ['slide_switch', { position: 0 }], rl: R(470), lamp: LED('red'),
            pt: ['phototransistor', {}], re: R(10000), rq: R(10000), qd: NPN, rk: R(10000), ck: EL(1e-6),
            g: ['cd4093', {}], rr: R(100000), cr: C(100e-9), reset: ['button', {}],
            rqr: R(10000), qr: NPN, rlr: R(1000), red: LED('red'), rqg: R(10000), qg: NPN, rlg: R(1000), green: LED('green'),
            guide: PATH({ from: '@lamp', to: '@pt', medium: 'fibre', lengthM: 2, outGapMm: 1, shield: 1 }) },
        nets: [
            ['bat.pos', 'pedal.a', 'g.vcc', 'rk.a', 'rr.a', 'rlr.a', 'rlg.a', 'pt.collector'],
            ['pedal.b', 'rp.a', 'rd.a', 'dd.cathode', 'bulb.com'], ['rd.b', 'dd.anode', 'cd.pos', 'g.1a'], ['bulb.a', 'rl.a'], ['rl.b', 'lamp.anode'],
            ['pt.emitter', 're.a', 'rq.a'], ['rq.b', 'qd.base'], ['qd.collector', 'rk.b', 'ck.pos', 'g.1b'],
            ['g.1y', 'g.2a'], ['g.2y', 'g.3b', 'rqr.a'], ['g.3y', 'g.2b', 'rqg.a'], ['rr.b', 'cr.a', 'reset.a', 'g.3a'],
            ['rqr.b', 'qr.base'], ['rlr.b', 'red.anode'], ['red.cathode', 'qr.collector'],
            ['rqg.b', 'qg.base'], ['rlg.b', 'green.anode'], ['green.cathode', 'qg.collector'],
            ['bat.neg', 'rp.b', 'cd.neg', 'ck.neg', 'lamp.cathode', 're.b', 'qd.emitter', 'cr.b', 'reset.b', 'qr.emitter', 'qg.emitter', 'g.gnd', 'g.4a', 'g.4b'],
        ],
        open: ['bulb.b', 'g.4y'],
    },

    'lab-lens-beam-link': {
        vcc: 9, supply: SUP,
        parts: { bat: BAT9, a: LM386, ra1: R(1000000), ra2: R(1000000), rt: R(220000), ct: C(22e-9), rled: R(220), led: LED('red'),
            pt: ['phototransistor', {}], re: R(10000), cc1: C(100e-9), rb1: R(1000000), rc1: R(10000), q1: NPN,
            cc2: C(100e-9), rb2: R(1000000), rc2: R(10000), q2: NPN, cc3: EL(1e-6), ear: ['earphone', { type: 'magnetic', ohms: 2000, henrys: 0.1, ratedWatts: 0.001 }],
            beam: PATH({ from: '@led', to: '@pt', medium: 'air', lensFocalCm: 5, lensAtCm: 5.1, lensRadiusCm: 2, distanceCm: 300,
                knob: 'distanceCm', knobMin: 50, knobMax: 500 }) },
        nets: [
            ['bat.pos', 'a.vs', 'ra1.a', 'pt.collector', 'rc1.a', 'rc2.a'],
            ['rt.b', 'ct.a', 'a.inn'], ['ra1.b', 'ra2.b', 'a.inp'], ['a.gain1', 'a.gain8'], ['a.vout', 'ra2.a', 'rt.a', 'rled.a'], ['rled.b', 'led.anode'],
            ['pt.emitter', 're.a', 'cc1.a'], ['cc1.b', 'q1.base', 'rb1.b'], ['q1.collector', 'rc1.b', 'rb1.a', 'cc2.a'],
            ['cc2.b', 'q2.base', 'rb2.b'], ['q2.collector', 'rc2.b', 'rb2.a', 'cc3.pos'], ['cc3.neg', 'ear.a'],
            ['bat.neg', 'ct.b', 'a.gnd', 'led.cathode', 're.b', 'q1.emitter', 'q2.emitter', 'ear.b'],
        ],
        open: ['a.bypass'],
    },

    'lab-pll-light-gate': {
        vcc: 9, supply: SUP,
        parts: { bat: BAT9, a: LM386, ra1: R(1000000), ra2: R(1000000), rt: R(220000), ct: C(10e-9), rled: R(220), led: LED('red'),
            pt: ['phototransistor', {}], re: R(10000), cc: C(10e-9), rb: R(1000000), rc: R(10000), q: NPN,
            cp: C(100e-9), d1: ['diode', {}], d2: ['diode', {}], ch: C(220e-9), rh: R(100000),
            u: PLL, r1: R(100000), c1: C(10e-9), rpz: R(1000), pz: ['piezo', {}],
            beam: PATH({ from: '@led', to: '@pt', medium: 'air', distanceCm: 20, blocked: 0, knob: 'blocked', knobMin: 0, knobMax: 1 }) },
        nets: [
            ['bat.pos', 'a.vs', 'ra1.a', 'pt.collector', 'rc.a', 'u.vdd', 'u.vco_in'],
            ['rt.b', 'ct.a', 'a.inn'], ['ra1.b', 'ra2.b', 'a.inp'], ['a.gain1', 'a.gain8'], ['a.vout', 'ra2.a', 'rt.a', 'rled.a'], ['rled.b', 'led.anode'],
            ['pt.emitter', 're.a', 'cc.a'], ['cc.b', 'q.base', 'rb.b'], ['q.collector', 'rc.b', 'rb.a', 'cp.a'],
            ['cp.b', 'd1.anode', 'd2.cathode'], ['d1.cathode', 'ch.a', 'rh.a', 'u.inh'],
            ['u.r1', 'r1.a'], ['u.c1a', 'c1.a'], ['u.c1b', 'c1.b'], ['u.vco_out', 'rpz.a'], ['rpz.b', 'pz.a'],
            ['bat.neg', 'ct.b', 'a.gnd', 'led.cathode', 're.b', 'q.emitter', 'd2.anode', 'ch.b', 'rh.b', 'u.vss', 'r1.b', 'pz.b'],
        ],
        open: ['a.bypass', 'u.pcp_out', 'u.pc1_out', 'u.comp_in', 'u.dem_out', 'u.r2', 'u.pc2_out', 'u.sig_in', 'u.zener'],
    },

    'lab-pll-hygrometer': {
        vcc: 9, supply: SUP,
        parts: { bat: BAT9, comb: ['humidity_comb', {}], sel: ['slide_switch', { position: 0 }],
            u: PLL, c1: C(1e-9), rin: R(100000), rgnd: R(2200), a: LM386, cby: EL(1e-6), co: EL(220e-6), spk: ['speaker', { ohms: 8 }],
            rt1: R(1000000), rt2: R(1000000), rb: R(1000000), meter: ['analog_meter', { fullScale: 2, ifs: 0.000004 }] },
        nets: [
            ['bat.pos', 'u.vdd', 'u.vco_in', 'a.vs', 'rt1.a', 'rt2.a'],
            ['comb.a', 'sel.com'], ['sel.a', 'u.r1'], ['sel.b', 'rt1.b', 'meter.b'], ['rt2.b', 'rb.a', 'meter.a'],
            ['u.c1a', 'c1.a'], ['u.c1b', 'c1.b'], ['u.vco_out', 'rin.a'], ['rin.b', 'rgnd.a', 'a.inp'], ['a.bypass', 'cby.pos'], ['a.vout', 'co.pos'], ['co.neg', 'spk.a'],
            ['bat.neg', 'comb.b', 'u.vss', 'u.inh', 'rb.b', 'rgnd.b', 'a.gnd', 'cby.neg', 'a.inn', 'spk.b'],
        ],
        open: ['u.pcp_out', 'u.pc1_out', 'u.comp_in', 'u.dem_out', 'u.r2', 'u.pc2_out', 'u.sig_in', 'u.zener', 'a.gain1', 'a.gain8'],
    },

    'lab-ptc-tone-bridge': {
        vcc: 9, supply: SUP,
        parts: { bat: BAT9, a: LM386, ra1: R(1000000), ra2: R(1000000), rt: R(220000), ct: C(22e-9), cb: EL(10e-6),
            r1: R(1000), ptc: ['ptc_sensor', { r25: 2000, surroundC: 25, thermalTau: 1 }], r2: R(1000), rb: R(1800), bal: POT(470, 0.575),
            ear: ['earphone', { type: 'magnetic', ohms: 2000, henrys: 0.1, ratedWatts: 0.001 }] },
        nets: [
            ['bat.pos', 'a.vs', 'ra1.a'],
            ['rt.b', 'ct.a', 'a.inn'], ['ra1.b', 'ra2.b', 'a.inp'], ['a.gain1', 'a.gain8'], ['a.vout', 'ra2.a', 'rt.a', 'cb.pos'],
            ['cb.neg', 'r1.a', 'r2.a'], ['r1.b', 'ptc.a', 'ear.a'], ['r2.b', 'rb.a', 'ear.b'], ['rb.b', 'bal.a'],
            ['bat.neg', 'ct.b', 'a.gnd', 'ptc.b', 'bal.wiper'],
        ],
        open: ['bal.b', 'a.bypass'],
    },

    'lab-ptc-alarm': {
        vcc: 9, supply: SUP,
        parts: { bat: BAT9, rs: R(10000), ptc: ['ptc_sensor', { r25: 2000, surroundC: 25, thermalTau: 1 }],
            rst: R(3900), set: POT(1000, 0.86), a: LM386, rh: R(220000), lamp: LED('red'),
            mode: ['slide_switch', { position: 0 }], rpb: R(22000), rpe: R(10000), qp: PNP,
            rc1: R(1000), rc2: R(1000), q1: NPN, q2: NPN, ca: C(100e-9), cb: C(100e-9), rba: R(22000), rbb: R(22000), pz: ['piezo', {}] },
        nets: [
            ['bat.pos', 'rs.a', 'rst.a', 'a.vs', 'rpe.a', 'qp.emitter'],
            ['rs.b', 'ptc.a', 'a.inp', 'rh.b'], ['rst.b', 'set.a'], ['set.wiper', 'a.inn'], ['a.gain1', 'a.gain8'],
            ['a.vout', 'rh.a', 'lamp.anode', 'rpb.a'], ['rpb.b', 'rpe.b', 'qp.base'],
            ['lamp.cathode', 'mode.a'], ['qp.collector', 'mode.b'], ['mode.com', 'rc1.a', 'rc2.a', 'rba.a', 'rbb.a'],
            ['rc1.b', 'q1.collector', 'ca.a'], ['ca.b', 'q2.base', 'rba.b'], ['rc2.b', 'q2.collector', 'cb.a', 'pz.a'], ['cb.b', 'q1.base', 'rbb.b'],
            ['bat.neg', 'ptc.b', 'set.b', 'a.gnd', 'q1.emitter', 'q2.emitter', 'pz.b'],
        ],
        open: ['a.bypass'],
    },

    'lab-ptc-fibre-alarm': {
        vcc: 9, supply: SUP,
        parts: { bat: BAT9, rs: R(20000), ptc: ['ptc_sensor', { r25: 2000, surroundC: 25, thermalTau: 1 }],
            rst: R(8200), set: POT(1000, 0.89), a: LM386, rled: R(470), led: LED('red'),
            pt: ['phototransistor', {}], re: R(10000), rq: R(10000), qs: NPN, rpb: R(10000), rpe: R(10000), qp: PNP,
            rc1: R(1000), rc2: R(1000), q1: NPN, q2: NPN, ca: C(100e-9), cb: C(100e-9), rba: R(22000), rbb: R(22000), pz: ['piezo', {}],
            guide: PATH({ from: '@led', to: '@pt', medium: 'fibre', lengthM: 2, outGapMm: 1, shield: 1 }) },
        nets: [
            ['bat.pos', 'rs.a', 'rst.a', 'a.vs', 'pt.collector', 'rpe.a', 'qp.emitter'],
            ['rs.b', 'ptc.a', 'a.inp'], ['rst.b', 'set.a'], ['set.wiper', 'a.inn'], ['a.gain1', 'a.gain8'],
            ['a.vout', 'rled.a'], ['rled.b', 'led.anode'],
            ['pt.emitter', 're.a', 'rq.a'], ['rq.b', 'qs.base'], ['qs.collector', 'rpb.a'], ['rpb.b', 'rpe.b', 'qp.base'],
            ['qp.collector', 'rc1.a', 'rc2.a', 'rba.a', 'rbb.a'],
            ['rc1.b', 'q1.collector', 'ca.a'], ['ca.b', 'q2.base', 'rba.b'], ['rc2.b', 'q2.collector', 'cb.a', 'pz.a'], ['cb.b', 'q1.base', 'rbb.b'],
            ['bat.neg', 'ptc.b', 'set.b', 'a.gnd', 'led.cathode', 're.b', 'qs.emitter', 'q1.emitter', 'q2.emitter', 'pz.b'],
        ],
        open: ['a.bypass'],
    },
    'lab-pll-fsk': {
        vcc: 9, supply: SUP,
        parts: { bat: BAT9,
            rc1: R(1000), rc2: R(1000), q1: NPN, q2: NPN, ca: C(47e-9), cb: C(47e-9), rba: R(22000), rbb: R(22000), key: ['button', {}], rk: R(22000),
            u: PLL, r1: R(100000), r2: R(47000), c1: C(10e-9), rf: R(47000), rd: R(100000), cf: C(22e-9), rbh: R(1000000), rbl: R(1000000),
            rdem: R(10000), rin: R(470000), cin: C(100e-9), rref: R(820000), a: LM386,
            r1led: R(1000), one: LED('yellow'), r0led: R(1000), zero: LED('green') },
        nets: [
            ['bat.pos', 'rc1.a', 'rc2.a', 'rba.a', 'rbb.a', 'key.a', 'u.vdd', 'rbh.a', 'rref.a', 'a.vs', 'r0led.a'],
            ['rc1.b', 'q1.collector', 'ca.a'], ['ca.b', 'q2.base', 'rba.b'],
            ['rc2.b', 'q2.collector', 'cb.a', 'u.sig_in'], ['cb.b', 'q1.base', 'rbb.b', 'rk.b'], ['key.b', 'rk.a'],
            ['u.r1', 'r1.a'], ['u.r2', 'r2.a'], ['u.c1a', 'c1.a'], ['u.c1b', 'c1.b'], ['u.vco_out', 'u.comp_in'],
            ['u.pc2_out', 'rf.a'], ['rf.b', 'rd.a', 'u.vco_in', 'rbh.b', 'rbl.a'], ['rd.b', 'cf.a'],
            ['u.dem_out', 'rdem.a', 'rin.a'], ['rin.b', 'cin.a', 'a.inp'], ['rref.b', 'a.inn'], ['a.gain1', 'a.gain8'],
            ['a.vout', 'r1led.a', 'zero.cathode'], ['r1led.b', 'one.anode'], ['r0led.b', 'zero.anode'],
            ['bat.neg', 'q1.emitter', 'q2.emitter', 'u.vss', 'u.inh', 'r1.b', 'r2.b', 'cf.b', 'rbl.b', 'rdem.b', 'cin.b', 'a.gnd', 'one.cathode'],
        ],
        open: ['u.pcp_out', 'u.pc1_out', 'u.zener', 'a.bypass'],
    },

    'lab-abs-alarm': {
        vcc: 9, supply: SUP,
        parts: { bat: BAT9, wheel: ['dc_motor_encoder', { kV: 0.02, pulsesPerRev: 1, J: 5e-7, loadTorque: 0 }], dm: ['diode', {}],
            cq: C(100e-9), rq: R(10000), rbg: R(47000), q1: NPN, rtc: R(100000), ctc: C(470e-9), o: LM358, rh1: R(10000), rh2: R(10000), rhy: R(100000),
            g: ['cd4093', {}], rgr: R(1000), green: LED('green'), rrd: R(1000), red: LED('red'), rqc: R(10000), qc: NPN,
            a: LM386, ra1: R(1000000), ra2: R(1000000), rt: R(220000), ct: C(56e-9), co: EL(220e-6), spk: ['speaker', { ohms: 8 }] },
        nets: [
            ['bat.pos', 'wheel.a', 'dm.cathode', 'rtc.a', 'o.vcc', 'rh1.a', 'g.vcc', 'a.vs', 'ra1.a'],
            ['wheel.enc_a', 'cq.a'], ['cq.b', 'rq.a'], ['rq.b', 'rbg.a', 'q1.base'], ['q1.collector', 'rtc.b', 'ctc.a', 'o.1_neg'], ['rh1.b', 'rh2.a', 'rhy.a', 'o.1_pos'],
            ['o.1_out', 'rhy.b', 'g.1a', 'g.1b'], ['g.1y', 'g.2a', 'g.2b', 'rrd.a'], ['rrd.b', 'red.anode'], ['g.2y', 'rgr.a', 'rqc.a'], ['rgr.b', 'green.anode'],
            ['rqc.b', 'qc.base'], ['qc.collector', 'rt.b', 'ct.a', 'a.inn'], ['ra1.b', 'ra2.b', 'a.inp'], ['a.gain1', 'a.gain8'],
            ['a.vout', 'ra2.a', 'rt.a', 'co.pos'], ['co.neg', 'spk.a'],
            ['bat.neg', 'wheel.b', 'dm.anode', 'rbg.b', 'q1.emitter', 'ctc.b', 'rh2.b', 'o.gnd', 'o.2_pos', 'o.2_neg', 'g.gnd', 'g.3a', 'g.3b', 'g.4a', 'g.4b',
                'green.cathode', 'red.cathode', 'qc.emitter', 'ct.b', 'a.gnd', 'spk.b'],
        ],
        open: ['wheel.enc_b', 'o.2_out', 'g.3y', 'g.4y', 'a.bypass'],
    },


    'lab-hall-tacho': {
        vcc: 9, supply: SUP,
        parts: { bat: BAT9, motor: ['dc_motor_encoder', { kV: 0.02, pulsesPerRev: 8, J: 5e-6, loadTorque: 0 }], dm: ['diode', {}],
            rq: R(10000), q: NPN, rpu: R(4700), cp: C(10e-9), d1: ['diode', {}], d2: ['diode', {}], ch: EL(1e-6), rload: R(47000),
            meter: ['analog_meter', { fullScale: 1, ifs: 0.000005 }],
            rs: R(47000), set: POT(10000, 0.43), o: LM358, mode: ['slide_switch', { position: 0 }], thr: POT(10000, 0.5),
            rdiv: R(620000), rbias: R(2400000), a: LM386 },
        nets: [
            ['bat.pos', 'rpu.a', 'rs.a', 'o.vcc', 'thr.a', 'rbias.a', 'a.vs'],
            ['motor.enc_a', 'rq.a'], ['rq.b', 'q.base'], ['q.collector', 'rpu.b', 'cp.a'], ['cp.b', 'd1.anode', 'd2.cathode'],
            ['d1.cathode', 'ch.pos', 'rload.a', 'meter.a', 'o.1_neg'], ['rs.b', 'set.a'], ['set.wiper', 'o.1_pos'],
            ['o.1_out', 'mode.a'], ['thr.wiper', 'mode.b'], ['mode.com', 'rdiv.a'], ['rdiv.b', 'a.inp'], ['rbias.b', 'a.inn'],
            ['a.vout', 'motor.a', 'dm.cathode'],
            ['bat.neg', 'motor.b', 'dm.anode', 'q.emitter', 'd2.anode', 'ch.neg', 'rload.b', 'meter.b', 'set.b', 'thr.b', 'o.gnd', 'o.2_pos', 'o.2_neg', 'a.gnd'],
        ],
        open: ['motor.enc_b', 'o.2_out', 'a.gain1', 'a.gain8', 'a.bypass'],
    },

    'lab-motor-throttle': {
        vcc: 9, supply: SUP,
        parts: { bat: BAT9, hall: ['hall_analog', { field: 0 }], o: LM358, r1: R(10000), r2: R(20000), r3: R(10000), r4: R(20000), rh1: R(1000), rh2: R(1000),
            run: ['slide_switch', { position: 0 }], rr: R(100000), cr: EL(10e-6),
            mode: ['slide_switch', { position: 0 }], rdiv: R(620000), rbias: R(2000000), a: LM386,
            ds: ['diode', {}], motor: ['dc_motor_encoder', { kV: 0.02, pulsesPerRev: 1, J: 5e-6, loadTorque: 0.002 }], dm: ['diode', {}] },
        nets: [
            ['bat.pos', 'hall.vcc', 'o.vcc', 'rh1.a', 'run.b', 'rbias.a', 'a.vs'],
            ['hall.ao', 'r1.a'], ['r1.b', 'r2.a', 'o.1_pos'], ['rh1.b', 'rh2.a', 'r3.a'], ['r3.b', 'r4.a', 'o.1_neg'], ['o.1_out', 'r4.b', 'mode.a'],
            ['run.com', 'rr.a'], ['rr.b', 'cr.pos', 'o.2_pos'], ['o.2_out', 'o.2_neg', 'mode.b'],
            ['mode.com', 'rdiv.a'], ['rdiv.b', 'a.inp'], ['rbias.b', 'a.inn'], ['a.vout', 'ds.anode'], ['ds.cathode', 'motor.a', 'dm.cathode'],
            ['bat.neg', 'run.a', 'hall.gnd', 'r2.b', 'rh2.b', 'cr.neg', 'o.gnd', 'a.gnd', 'motor.b', 'dm.anode'],
        ],
        open: ['hall.do', 'motor.enc_a', 'motor.enc_b', 'a.gain1', 'a.gain8', 'a.bypass'],
    },

    'lab-motor-stall-cutout': {
        vcc: 9, supply: SUP,
        parts: { bat: BAT9, main: ['slide_switch', { position: 1 }], rled: R(1000), trip: LED('red'), qp: PNP, qn: NPN, rak: R(22000), rgk: R(22000),
            rsg: R(4700), cdel: EL(47e-6), rdrive: R(560000), rbias: R(1500000), a: LM386,
            motor: ['dc_motor_encoder', { kV: 0.02, pulsesPerRev: 1, J: 5e-7, loadTorque: 0.002 }], dm: ['diode', {}], rs: R(2.2) },
        nets: [
            ['bat.pos', 'main.com', 'rbias.a', 'a.vs'], ['main.b', 'rled.a'], ['rled.b', 'trip.anode'],
            ['trip.cathode', 'qp.emitter', 'rak.a', 'rdrive.a'], ['qp.base', 'rak.b', 'qn.collector'],
            ['qp.collector', 'qn.base', 'rgk.a', 'cdel.pos', 'rsg.b'],
            ['rdrive.b', 'a.inp'], ['rbias.b', 'a.inn'], ['a.vout', 'motor.a', 'dm.cathode'], ['motor.b', 'dm.anode', 'rs.a', 'rsg.a'],
            ['bat.neg', 'qn.emitter', 'rgk.b', 'cdel.neg', 'a.gnd', 'rs.b'],
        ],
        open: ['main.a', 'motor.enc_a', 'motor.enc_b', 'a.gain1', 'a.gain8', 'a.bypass'],
    },



    'lab-magnet-code-lock': {
        vcc: 9, supply: SUP,
        parts: { bat: BAT9, hall: ['hall_analog', { field: 0 }], o: ['lm324', {}], rn1: R(3300), rn2: R(4700), rn3: R(3300),
            cp: C(220e-9), d1: ['diode', {}], d2: ['diode', {}], cs: EL(1e-6), rleak: R(2200000), rqd: R(10000), qd: NPN,
            g: ['cd4093', {}], rr: R(100000), cr: C(100e-9), lock: ['button', {}], dl: ['diode', {}], rqg: R(10000), qg: NPN, rlg: R(1000), unl: LED('green'),
            rqc: R(10000), qc: NPN, a: LM386, ra1: R(1000000), ra2: R(1000000), rt: R(220000), ct: C(56e-9), co: EL(220e-6), spk: ['speaker', { ohms: 8 }] },
        nets: [
            ['bat.pos', 'hall.vcc', 'o.vcc', 'rn1.a', 'g.vcc', 'rr.a', 'rlg.a', 'a.vs', 'ra1.a'],
            ['rn1.b', 'rn2.a', 'o.1_neg'], ['rn2.b', 'rn3.a', 'o.2_pos', 'o.3_neg'],
            ['hall.ao', 'o.1_pos', 'o.2_neg'],
            ['o.1_out', 'cp.a'], ['cp.b', 'd1.anode', 'd2.cathode'], ['d1.cathode', 'cs.pos', 'rleak.a', 'qd.collector', 'o.3_pos', 'dl.anode'],
            ['o.2_out', 'rqd.a'], ['rqd.b', 'qd.base'],
            ['o.3_out', 'g.1a', 'g.1b'], ['g.1y', 'g.2a'], ['g.2y', 'g.3a', 'rqg.a'], ['g.3y', 'g.2b', 'rqc.a'], ['rr.b', 'cr.a', 'lock.a', 'g.3b', 'dl.cathode'],
            ['rqg.b', 'qg.base'], ['rlg.b', 'unl.anode'], ['unl.cathode', 'qg.collector'], ['rqc.b', 'qc.base'],
            ['qc.collector', 'rt.b', 'ct.a', 'a.inn'], ['ra1.b', 'ra2.b', 'a.inp'], ['a.gain1', 'a.gain8'], ['a.vout', 'ra2.a', 'rt.a', 'co.pos'],
            ['co.neg', 'spk.a'],
            ['bat.neg', 'hall.gnd', 'rn3.b', 'd2.anode', 'cs.neg', 'rleak.b', 'qd.emitter', 'cr.b', 'lock.b', 'qg.emitter', 'qc.emitter', 'ct.b', 'a.gnd', 'spk.b',
                'o.gnd', 'o.4_pos', 'o.4_neg', 'g.gnd', 'g.4a', 'g.4b'],
        ],
        open: ['hall.do', 'o.4_out', 'g.4y', 'a.bypass'],
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
