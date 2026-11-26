/**
 * Netlists for the "r9" lab benches, built once the engine could carry them
 * (bw-board: a gate output that merely follows its moving supply is no
 * longer a device edge; the LM386 pole on its clamp is damped; a square edge
 * is a clean solve point; a light path can be chopped by a motor's shaft):
 *
 *   - lab-ptc-window-blink   op-amp temperature window judged by Schmitt
 *                            NAND gates; outside it an LM386 blinker flashes
 *   - lab-chopper-tacho      a slotted disc on a solar-driven motor chops a
 *                            fibre gap; an LM386 clicks a speaker and drives
 *                            a diode-pump rate meter
 *   - lab-fibre-pll-music    an op-amp sweeps a two-transistor astable near
 *                            100 kHz; the light down a fibre is demodulated
 *                            by a 4046 loop for an LM386 and an earphone
 *   - lab-ptc-fibre-tone     a PTC voltage through an LM386 sets an LED's
 *                            brightness; at the far end the light sets the
 *                            pitch of a transistor astable
 *   - lab-ptc-fibre-pll      the LM386 output sets a transistor astable's
 *                            rate; a 4046 locks onto the light and its
 *                            control voltage reads the temperature
 *   - lab-pll-jar-level      a 4046 oscillator drives foil electrodes on a
 *                            jar; an op-amp rectifies what passes, Schmitt
 *                            NAND gates light a level bar and an LM386 beeps
 *                            when full
 *   - lab-hum-counter        a wire on a counter's clock input counts the
 *                            mains hum it picks up
 *
 * Written by `node scripts/gen-lab-circuits-4.mjs --set=r9`. Same shape as
 * lab-benches-4.mjs: pure data, so test/lab-circuits-r9.test.mjs names parts
 * by role. Ids follow benchIds (breadboard first, then the parts in the
 * order listed). A param written '@role' (a light path's from / to /
 * chopper) is resolved to that part's engine id below.
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
const PTC = ['ptc_sensor', { r25: 2000, surroundC: 25, thermalTau: 0.05 }];
const FIBRE = (extra = {}) => PATH({ from: '@led', to: '@pt', medium: 'fibre', lengthM: 2, outGapMm: 1, shield: 1,
    knob: 'outGapMm', knobMin: 0, knobMax: 20, ...extra });

export const BENCHES = {
    // 6.8 k over the PTC; op-amp 1 amplifies x3; the two limits (30 k, 4.3 k,
    // 68 k from 9 V) go to op-amps 2 and 3 as a window. NAND 1 is LOW only
    // inside it; NAND 2 inverts: HIGH lights the green LED and, through the
    // NPN, holds the LM386 blinker's timing capacitor at 0 V. Outside, the
    // blinker runs and its output pulls the PNP's base: the red LED flashes.
    'lab-ptc-window-blink': {
        vcc: 9, supply: SUP,
        parts: { bat: BAT9, rs: R(6800), ptc: PTC,
            u: ['lm324', {}], rg: R(10000), rf: R(20000), rl1: R(30000), rl2: R(4300), rl3: R(68000),
            g: ['cd4093', {}], rgr: R(1000), green: LED('green'), rqc: R(10000), qc: NPN,
            a: LM386, ra1: R(1000000), ra2: R(1000000), rt: R(220000), ct: EL(2.2e-6),
            rpb: R(10000), rbe: R(10000), qp: PNP, rr: R(1000), red: LED('red') },
        nets: [
            ['bat.pos', 'rs.a', 'u.vcc', 'rl1.a', 'g.vcc', 'a.vs', 'ra1.a', 'qp.emitter', 'rbe.a'],
            ['rs.b', 'ptc.a', 'u.1_pos'], ['u.1_neg', 'rg.a', 'rf.a'], ['rf.b', 'u.1_out', 'u.2_pos', 'u.3_neg'],
            ['rl1.b', 'rl2.a', 'u.3_pos'], ['rl2.b', 'rl3.a', 'u.2_neg'],
            ['u.2_out', 'g.1a'], ['u.3_out', 'g.1b'], ['g.1y', 'g.2a', 'g.2b'], ['g.2y', 'rgr.a', 'rqc.a'], ['rgr.b', 'green.anode'],
            ['rqc.b', 'qc.base'], ['qc.collector', 'rt.b', 'ct.pos', 'a.inn'], ['ra1.b', 'ra2.b', 'a.inp'], ['a.gain1', 'a.gain8'],
            ['a.vout', 'ra2.a', 'rt.a', 'rpb.a'], ['rpb.b', 'rbe.b', 'qp.base'], ['qp.collector', 'rr.a'], ['rr.b', 'red.anode'],
            ['bat.neg', 'ptc.b', 'rg.b', 'rl3.b', 'u.gnd', 'u.4_pos', 'u.4_neg', 'g.gnd', 'g.3a', 'g.3b', 'g.4a', 'g.4b',
                'green.cathode', 'qc.emitter', 'ct.neg', 'a.gnd', 'red.cathode'],
        ],
        open: ['u.4_out', 'g.3y', 'g.4y', 'a.bypass'],
    },
    // A small solar panel turns a motor; a disc with 4 slots on its shaft
    // chops the light of an LED through a fibre gap onto a phototransistor.
    // Each pulse, AC-coupled into an LM386 (gain 20), clicks the speaker; the
    // same output pumps a fixed charge per pulse (100 nF, two diodes) into
    // 47 k || 1 uF: the meter reads a voltage proportional to the speed.
    'lab-chopper-tacho': {
        vcc: 9, supply: SUP,
        parts: { bat: BAT9,
            cell: ['solar_cell', { light: 1, voc: 3, isc: 0.3 }], m: ['dc_motor', { kV: 0.01, windingR: 10, J: 2e-7, friction: 3e-6 }],
            rled: R(470), led: LED('red'),
            pt: ['phototransistor', {}], re: R(1000), cin: C(100e-9), rin: R(100000),
            a: LM386, co: EL(220e-6), spk: ['speaker', { ohms: 8 }],
            cp: C(100e-9), d1: ['diode', {}], d2: ['diode', {}], rm: R(47000), cm: EL(1e-6),
            meter: ['analog_meter', { fullScale: 5, ifs: 0.0001 }],
            disc: PATH({ from: '@led', to: '@pt', medium: 'fibre', lengthM: 0.5, outGapMm: 2, shield: 1,
                chopper: '@m', slots: 4, openFraction: 0.5, beamFraction: 0.3, knob: 'outGapMm', knobMin: 0, knobMax: 10 }),
            // Flyback: cathode to the motor's high side, anode to ground. It
            // sits reverse-biased while the cell drives the motor and catches
            // the winding's kick when the light (and so the drive) drops.
            dfly: ['diode', {}] },
        nets: [
            ['bat.pos', 'rled.a', 'pt.collector', 'a.vs'],
            ['cell.pos', 'm.a', 'dfly.cathode'], ['rled.b', 'led.anode'],
            ['pt.emitter', 're.a', 'cin.a'], ['cin.b', 'rin.a'], ['rin.b', 'a.inp'],
            ['a.vout', 'co.pos', 'cp.a'], ['co.neg', 'spk.a'],
            ['cp.b', 'd1.anode', 'd2.cathode'], ['d1.cathode', 'rm.a', 'cm.pos', 'meter.a'],
            ['bat.neg', 'cell.neg', 'm.b', 'dfly.anode', 'led.cathode', 're.b', 'a.gnd', 'a.inn', 'spk.b', 'd2.anode', 'rm.b', 'cm.neg', 'meter.b'],
        ],
        open: ['a.gain1', 'a.gain8', 'a.bypass'],
    },

    // Transmitter: the music (a 5 kHz test tone) into an LM358 inverting
    // stage centred by a pot; its output feeds the base resistors of a
    // two-transistor astable (1 nF, 6.8 k), whose frequency (65-90 kHz)
    // follows that voltage. The LED in the astable's collector flashes into
    // a 2 m fibre. Receiver: the phototransistor's pulses (1 nF coupling)
    // clock a 4046's comparator II; its loop (10 k, 1 k + 4.7 nF) holds the
    // VCO (10 k, 220 pF) on the incoming rate, so the control voltage,
    // buffered at dem_out, is the music again: filtered (10 k / 10 nF) into
    // an LM386 and a magnetic earphone.
    'lab-fibre-pll-music': {
        vcc: 9, supply: SUP,
        parts: { bat: BAT9,
            music: ['function_gen', { wave: 'sine', freq: 5000, amplitude: 1, offset: 0 }], centre: POT(10000, 0.35),
            o: LM358, rin: R(10000), rf: R(10000),
            rc1: R(1000), q1: NPN, q2: NPN, ca: C(1e-9), cb: C(1e-9), rba: R(6800), rbb: R(6800),
            rled: R(470), led: LED('red'),
            pt: ['phototransistor', {}], re: R(1000), cs: C(1e-9),
            u: PLL, r1: R(10000), c1: C(220e-12), rlf: R(10000), rz: R(1000), clf: C(4.7e-9), rdem: R(10000),
            rout: R(10000), cout: C(10e-9), cam: C(1e-6), a: LM386, co: EL(10e-6),
            ear: ['earphone', { type: 'magnetic', ohms: 2000, henrys: 0.1 }],
            guide: FIBRE() },
        nets: [
            ['bat.pos', 'centre.a', 'o.vcc', 'rc1.a', 'rled.a', 'pt.collector', 'u.vdd', 'a.vs'],
            ['music.out', 'rin.a'], ['centre.wiper', 'o.1_pos'], ['o.1_neg', 'rin.b', 'rf.a'], ['rf.b', 'o.1_out', 'rba.a', 'rbb.a'],
            ['rc1.b', 'q1.collector', 'ca.a'], ['ca.b', 'q2.base', 'rba.b'], ['led.cathode', 'q2.collector', 'cb.a'], ['cb.b', 'q1.base', 'rbb.b'],
            ['rled.b', 'led.anode'],
            ['pt.emitter', 're.a', 'cs.a'], ['cs.b', 'u.sig_in'],
            ['u.r1', 'r1.a'], ['u.c1a', 'c1.a'], ['u.c1b', 'c1.b'], ['u.vco_out', 'u.comp_in'],
            ['u.pc2_out', 'rlf.a'], ['rlf.b', 'u.vco_in', 'rz.a'], ['rz.b', 'clf.a'],
            ['u.dem_out', 'rdem.a', 'rout.a'], ['rout.b', 'cout.a', 'cam.a'], ['cam.b', 'a.inp'], ['a.vout', 'co.pos'], ['co.neg', 'ear.a'],
            ['bat.neg', 'music.gnd', 'centre.b', 'o.gnd', 'o.2_pos', 'o.2_neg', 'q1.emitter', 'q2.emitter',
                're.b', 'u.vss', 'u.inh', 'r1.b', 'clf.b', 'rdem.b', 'cout.b', 'a.gnd', 'a.inn', 'ear.b'],
        ],
        open: ['o.2_out', 'u.pcp_out', 'u.pc1_out', 'u.r2', 'u.zener', 'a.gain1', 'a.gain8', 'a.bypass'],
    },

    // The temperature sent as brightness: 22 k over the PTC into the LM386's
    // + input, a set pot on its - input; gain 20 turns a few millivolts per
    // kelvin into the LED's current. At the far end of the fibre the
    // phototransistor feeds the base resistors of a two-transistor astable:
    // more light, higher pitch from the piezo.
    'lab-ptc-fibre-tone': {
        vcc: 9, supply: SUP,
        parts: { bat: BAT9, rs: R(22000), ptc: PTC, set: POT(10000, 0.84), rset: R(82000),
            a: LM386, rled: R(1000), led: LED('red'),
            pt: ['phototransistor', {}], rpl: R(2200),
            rc1: R(4700), rc2: R(4700), q1: NPN, q2: NPN, ca: C(10e-9), cb: C(10e-9), rba: R(47000), rbb: R(47000), pz: ['piezo', {}],
            guide: FIBRE() },
        nets: [
            ['bat.pos', 'rs.a', 'rset.a', 'a.vs', 'pt.collector', 'rc1.a', 'rc2.a'],
            ['rs.b', 'ptc.a', 'a.inp'], ['rset.b', 'set.a'], ['set.wiper', 'a.inn'],
            ['a.vout', 'rled.a'], ['rled.b', 'led.anode'],
            ['pt.emitter', 'rpl.a', 'rba.a', 'rbb.a'],
            ['rc1.b', 'q1.collector', 'ca.a'], ['ca.b', 'q2.base', 'rba.b'], ['rc2.b', 'q2.collector', 'cb.a', 'pz.a'], ['cb.b', 'q1.base', 'rbb.b'],
            ['bat.neg', 'ptc.b', 'set.b', 'a.gnd', 'led.cathode', 'rpl.b', 'q1.emitter', 'q2.emitter', 'pz.b'],
        ],
        open: ['a.gain1', 'a.gain8', 'a.bypass'],
    },

    // The temperature sent as a pulse rate: the same PTC stage drives the
    // base resistors of a two-transistor astable (47 nF, 10 k) whose LED
    // flashes about a thousand times a second, faster when warmer. A 4046 at
    // the far end locks onto the pulses (comparator II, 22 k, 2.2 k + 100 nF);
    // its control voltage, through dem_out and 10 k / 220 nF, is the meter's
    // reading of the temperature, however bright the light arrives.
    'lab-ptc-fibre-pll': {
        vcc: 9, supply: SUP,
        parts: { bat: BAT9, rs: R(22000), ptc: PTC, set: POT(10000, 0.84), rset: R(82000),
            a: LM386,
            rc1: R(1000), q1: NPN, q2: NPN, ca: C(47e-9), cb: C(47e-9), rba: R(10000), rbb: R(10000),
            rled: R(470), led: LED('red'),
            pt: ['phototransistor', {}], re: R(1000), cs: C(10e-9),
            u: PLL, r1: R(100000), c1: C(2.2e-9), rlf: R(22000), rz: R(2200), clf: C(100e-9),
            rdem: R(10000), rm: R(10000), cm: EL(220e-9), meter: ['analog_meter', { fullScale: 10, ifs: 0.0001 }],
            guide: FIBRE() },
        nets: [
            ['bat.pos', 'rs.a', 'rset.a', 'a.vs', 'rc1.a', 'rled.a', 'pt.collector', 'u.vdd'],
            ['rs.b', 'ptc.a', 'a.inp'], ['rset.b', 'set.a'], ['set.wiper', 'a.inn'],
            ['a.vout', 'rba.a', 'rbb.a'],
            ['rc1.b', 'q1.collector', 'ca.a'], ['ca.b', 'q2.base', 'rba.b'], ['led.cathode', 'q2.collector', 'cb.a'], ['cb.b', 'q1.base', 'rbb.b'],
            ['rled.b', 'led.anode'],
            ['pt.emitter', 're.a', 'cs.a'], ['cs.b', 'u.sig_in'],
            ['u.r1', 'r1.a'], ['u.c1a', 'c1.a'], ['u.c1b', 'c1.b'], ['u.vco_out', 'u.comp_in'],
            ['u.pc2_out', 'rlf.a'], ['rlf.b', 'u.vco_in', 'rz.a'], ['rz.b', 'clf.a'],
            ['u.dem_out', 'rdem.a', 'rm.a'], ['rm.b', 'cm.pos', 'meter.a'],
            ['bat.neg', 'ptc.b', 'set.b', 'a.gnd', 'q1.emitter', 'q2.emitter', 're.b', 'u.vss', 'u.inh', 'r1.b', 'clf.b', 'rdem.b', 'cm.neg', 'meter.b'],
        ],
        open: ['a.gain1', 'a.gain8', 'a.bypass', 'u.pcp_out', 'u.pc1_out', 'u.r2', 'u.zener'],
    },

    // The 4046's VCO (100 k, 2.2 nF, control at half supply: ~1.1 kHz)
    // drives the jar's foil electrodes: 1 nF empty, plus 2.2 nF per level
    // switch. What passes into 22 k is rectified by an LM358 (op-amp 1 with a
    // diode in its loop) and averaged (10 k, 220 nF); op-amp 2 amplifies it
    // x4.6 against a 0.2 V offset. NAND 1 (its Schmitt input straight on that
    // voltage) lights the green "half" LED; NAND 2 (through 10 k / 47 k) the
    // red "full" LED, and releases the LM386 beeper by turning off the NPN
    // that held its timing capacitor.
    'lab-pll-jar-level': {
        vcc: 9, supply: SUP,
        parts: { bat: BAT9,
            u: PLL, rv1: R(10000), rv2: R(10000), r1: R(100000), c1: C(2.2e-9),
            cj0: C(1e-9), s1: ['slide_switch', { position: 0 }], cj1: C(2.2e-9), s2: ['slide_switch', { position: 0 }], cj2: C(2.2e-9),
            s3: ['slide_switch', { position: 0 }], cj3: C(2.2e-9),
            rs: R(22000), o: LM358, dr: ['diode', { part: '1N4148' }], rr: R(10000), ra: R(10000), ca: C(220e-9),
            rf: R(36000), rg: R(10000), rref1: R(10000), rref2: R(220),
            g: ['cd4093', {}], rt_f: R(10000), rb_f: R(47000),
            rl1: R(1000), half: LED('green'), rl2: R(1000), full: LED('red'),
            rq: R(10000), q: NPN,
            a: LM386, ra1: R(1000000), ra2: R(1000000), rt: R(220000), ct: C(22e-9), rpz: R(220), pz: ['piezo', {}] },
        nets: [
            ['bat.pos', 'u.vdd', 'rv1.a', 'o.vcc', 'g.vcc', 'rref1.a', 'rl1.a', 'rl2.a', 'a.vs', 'ra1.a'],
            ['rv1.b', 'rv2.a', 'u.vco_in'], ['u.r1', 'r1.a'], ['u.c1a', 'c1.a'], ['u.c1b', 'c1.b'],
            ['u.vco_out', 'cj0.a', 's1.com', 's2.com', 's3.com'], ['s1.b', 'cj1.a'], ['s2.b', 'cj2.a'], ['s3.b', 'cj3.a'],
            ['cj0.b', 'cj1.b', 'cj2.b', 'cj3.b', 'rs.a', 'o.1_pos'],
            ['o.1_out', 'dr.anode'], ['dr.cathode', 'rr.a', 'o.1_neg', 'ra.a'], ['ra.b', 'ca.a', 'o.2_pos'],
            ['rref1.b', 'rref2.a', 'rg.a'], ['rg.b', 'rf.a', 'o.2_neg'], ['rf.b', 'o.2_out', 'g.1a', 'g.1b', 'rt_f.a'],
            ['rt_f.b', 'rb_f.a', 'g.2a', 'g.2b'],
            ['rl1.b', 'half.anode'], ['g.1y', 'half.cathode'], ['rl2.b', 'full.anode'], ['g.2y', 'full.cathode', 'rq.a'],
            ['rq.b', 'q.base'], ['q.collector', 'rt.b', 'ct.a', 'a.inn'], ['ra1.b', 'ra2.b', 'a.inp'], ['a.vout', 'ra2.a', 'rt.a', 'rpz.a'], ['rpz.b', 'pz.a'],
            ['a.gain1', 'a.gain8'],
            ['bat.neg', 'u.vss', 'u.inh', 'rv2.b', 'r1.b', 'rs.b', 'rr.b', 'ca.b', 'rref2.b', 'o.gnd', 'g.gnd', 'g.3a', 'g.3b', 'g.4a', 'g.4b', 'rb_f.b',
                'q.emitter', 'ct.b', 'a.gnd', 'pz.b'],
        ],
        open: ['s1.a', 's2.a', 's3.a', 'u.pcp_out', 'u.pc1_out', 'u.comp_in', 'u.dem_out', 'u.r2', 'u.pc2_out', 'u.sig_in', 'u.zener',
            'g.3y', 'g.4y', 'a.bypass'],
    },

    // A bare wire near the mains (a field probe: its knob is how close) on
    // the clock input of a 4-bit binary counter, with 10 M to ground: the hum
    // it picks up swings the input across the threshold 50 times a second,
    // and the counter counts it. Four LEDs show the count; RESET clears it.
    'lab-hum-counter': {
        vcc: 5, supply: SUP,
        parts: { bat: ['vsource', { volts: 5 }], ant: ['field_probe', { source: 'mains', position: 0.8, maxFarads: 5e-12 }], rin: R(10000000),
            cnt: ['74hc93', {}], reset: ['button', {}], rr: R(10000),
            r0: R(1000), l0: LED('red'), r1: R(1000), l1: LED('red'), r2: R(1000), l2: LED('red'), r3: R(1000), l3: LED('red') },
        nets: [
            ['bat.pos', 'cnt.vcc', 'reset.a'],
            ['ant.a', 'rin.a', 'cnt.clk_a'], ['cnt.qa', 'cnt.clk_b', 'r0.a'], ['reset.b', 'rr.a', 'cnt.r0_1', 'cnt.r0_2'],
            ['cnt.qb', 'r1.a'], ['cnt.qc', 'r2.a'], ['cnt.qd', 'r3.a'],
            ['r0.b', 'l0.anode'], ['r1.b', 'l1.anode'], ['r2.b', 'l2.anode'], ['r3.b', 'l3.anode'],
            ['bat.neg', 'rin.b', 'rr.b', 'cnt.gnd', 'l0.cathode', 'l1.cathode', 'l2.cathode', 'l3.cathode'],
        ],
        open: ['cnt.nc1', 'cnt.nc2', 'cnt.nc3', 'cnt.nc4'],
    },
};

// Resolve '@role' params (a light path's ends and chopper) to engine ids.
for (const spec of Object.values(BENCHES)) {
    const ids = benchIds(spec);
    for (const [, params] of Object.values(spec.parts))
        for (const [k, v] of Object.entries(params || {}))
            if (typeof v === 'string' && v.startsWith('@')) {
                if (!ids[v.slice(1)]) throw new Error(`${k}: unknown role ${v}`);
                params[k] = ids[v.slice(1)];
            }
}
