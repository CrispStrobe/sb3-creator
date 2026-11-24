/**
 * Netlists for the counting / light-sensing lab benches: LEDs used backwards
 * as colour-selective light sensors, an IR light meter with a zero adjust, an
 * IR on/off remote, a seven-octave divider, a light-barrier counter that pulls
 * a relay in after N interruptions, and a counter that only counts loud sound.
 * Written by `node scripts/gen-lab-circuits-4.mjs --set=counting`.
 *
 * Same shape as lab-benches-optics.mjs: pure data, so
 * test/lab-circuits-counting.test.mjs names parts by role. A light path's
 * `from` / `to` are written as '@role' and turned into engine ids below.
 */
import { benchIds } from './lab-benches-4.mjs';
export { benchIds };

const SUP = { pos: 'bat.pos', neg: 'bat.neg' };
const R = (ohms) => ['resistor', { ohms }];
const C = (farads) => ['capacitor', { farads }];
const EL = (farads) => ['polarized_cap', { farads }];
const NPN = ['npn', { beta: 100 }];
const BAT9 = ['vsource', { volts: 9, variant: '9v' }];
const BAT5 = ['vsource', { volts: 5 }];
const LED = (color) => ['led', { color }];
const VM = ['voltmeter', {}];
const POT = (ohms, position) => ['potentiometer', { ohms, position }];
const PATH = (params) => ['light_path', params];
/** An LED used backwards as a light sensor: `amps` of photocurrent at full light. */
const SENSOR = (color, amps) => ['led', { color, photoSensitivity: amps }];

/** Replace '@role' in a light path's from / to with the bench's engine id. */
function resolveRefs(benches) {
    for (const spec of Object.values(benches)) {
        const ids = benchIds(spec);
        for (const [, [, params]] of Object.entries(spec.parts)) {
            for (const k of ['from', 'to']) {
                const v = params?.[k];
                if (typeof v === 'string' && v.startsWith('@')) {
                    if (!ids[v.slice(1)]) throw new Error(`${k}: unknown role ${v}`);
                    params[k] = ids[v.slice(1)];
                }
            }
        }
    }
    return benches;
}

export const BENCHES = resolveRefs({
    // Two LEDs used backwards as sensors, side by side: a red one and an IR
    // one. A selector switch connects one of them to the op-amp, a
    // transimpedance stage (1 MΩ: 1 V per µA of photocurrent). A red LED and
    // an IR emitter, each on its own switch, shine on both sensors from 2 cm.
    // An LED senses only light of shorter wavelength than its own: the IR
    // sensor answers both lamps, the red sensor only red. The LM358's second
    // half is not used (inputs grounded).
    'lab-led-sensor-colours': {
        vcc: 9, supply: SUP,
        parts: { bat: BAT9, swr: ['slide_switch', { position: 1 }], rr: R(470), red: LED('red'),
            swi: ['slide_switch', { position: 0 }], ri: R(470), ir: ['ir_transmitter', {}],
            sr: SENSOR('red', 5e-6), si: SENSOR('ir', 5e-6), sel: ['slide_switch', { position: 0 }],
            u: ['lm358', {}], rf: R(1000000), vm: VM,
            rToR: PATH({ from: '@red', to: '@sr', medium: 'air', distanceCm: 2 }),
            rToI: PATH({ from: '@red', to: '@si', medium: 'air', distanceCm: 2 }),
            iToR: PATH({ from: '@ir', to: '@sr', medium: 'air', distanceCm: 2 }),
            iToI: PATH({ from: '@ir', to: '@si', medium: 'air', distanceCm: 2 }) },
        nets: [
            ['bat.pos', 'swr.com', 'swi.com', 'u.vcc'], ['swr.b', 'rr.a'], ['rr.b', 'red.anode'],
            ['swi.b', 'ri.a'], ['ri.b', 'ir.anode'],
            ['sr.cathode', 'sel.a'], ['si.cathode', 'sel.b'],
            ['sel.com', 'rf.a', 'u.1_neg'], ['u.1_out', 'rf.b', 'vm.a'],
            ['bat.neg', 'red.cathode', 'ir.cathode', 'sr.anode', 'si.anode', 'u.1_pos', 'u.gnd',
                'u.2_pos', 'u.2_neg', 'vm.b'],
        ],
        open: ['swr.a', 'swi.a', 'u.2_out'],
    },

    // IR light meter. The sensor is an IR LED used backwards; LM358 half 1
    // turns its photocurrent into volts (4.7 MΩ) above a 1 V reference, which a
    // single-supply amplifier needs to work near zero light. So in the dark
    // its output is not 0 but 1 V: an offset. Half 2 is a difference
    // amplifier (all four resistors 100 k): it outputs half 1 minus the zero
    // pot's voltage. Turn the zero pot until the meter just reads 0 in the
    // dark; from then on it shows the light alone. The IR emitter's distance
    // is the light path's knob (3 .. 20 cm).
    'lab-ir-light-meter': {
        vcc: 9, supply: SUP,
        parts: { bat: BAT9, sw: ['slide_switch', { position: 1 }], re: R(470), ir: ['ir_transmitter', {}],
            sens: SENSOR('ir', 10e-6), ra: R(8200), rb: R(1000), u: ['lm358', {}], rf: R(4700000),
            rz: R(56000), zero: POT(10000, 0.5),
            r1: R(100000), r2: R(100000), r3: R(100000), r4: R(100000), meter: ['analog_meter', { fullScale: 5 }],
            beam: PATH({ from: '@ir', to: '@sens', medium: 'air', distanceCm: 5,
                knob: 'distanceCm', knobMin: 3, knobMax: 20 }) },
        nets: [
            ['bat.pos', 'sw.com', 'ra.a', 'u.vcc', 'rz.a'], ['sw.b', 're.a'], ['re.b', 'ir.anode'],
            ['ra.b', 'rb.a', 'u.1_pos'],
            ['sens.cathode', 'rf.a', 'u.1_neg'], ['u.1_out', 'rf.b', 'r1.a'],
            ['r1.b', 'r2.a', 'u.2_pos'], ['rz.b', 'zero.a'], ['zero.wiper', 'r3.a'],
            ['r3.b', 'r4.a', 'u.2_neg'], ['u.2_out', 'r4.b', 'meter.a'],
            ['bat.neg', 'ir.cathode', 'sens.anode', 'rb.b', 'r2.b', 'zero.b', 'u.gnd', 'meter.b'],
        ],
        open: ['sw.a'],
    },
    // IR on/off remote. The button keys an IR LED; 30 cm away a
    // phototransistor feeds its photocurrent into an NPN's base (220 k from
    // base to emitter keeps it off below a few µA), and the NPN pulls its
    // 10 k load low while the flash lasts. 220 nF passes only that falling
    // edge, and a diode lets the dip pull the op-amp's + input down. The
    // op-amp is a monoflop: its - input sits at half the supply, its + input
    // is held high by 1 MΩ, so its output rests high; once the + input dips
    // below half the supply the output falls, and 47 nF from the output
    // drags the + input further down. It climbs back through 1 MΩ, and about
    // 40 ms later the output returns high: one clean pulse per flash, short
    // or held. The pulse's falling edge clocks the counter's first stage,
    // which is a toggle flip-flop: one flash on, the next off. Its output
    // drives an NPN that pulls in the relay; the relay's contact switches
    // the lamp. The light path's knob is the distance (10 .. 150 cm).
    'lab-ir-remote-toggle': {
        vcc: 5, supply: SUP,
        parts: { bat: BAT5, btn: ['button', {}], re: R(100), ir: ['ir_transmitter', {}],
            pt: ['phototransistor', {}], rbe: R(220000), qa: NPN, rp: R(10000), cd: C(220e-9), rt: R(10000),
            dt: ['diode', { part: '1N4148' }], rm: R(1000000), cm: C(47e-9), rr1: R(10000), rr2: R(10000),
            u: ['lm358', {}], cnt: ['74hc93', {}],
            rb: R(4700), q: NPN, k: ['relay', { coilR: 200 }], df: ['diode', { part: '1N4148' }],
            rl: R(220), lamp: LED('green'),
            air: PATH({ from: '@ir', to: '@pt', medium: 'air', distanceCm: 30,
                knob: 'distanceCm', knobMin: 10, knobMax: 150 }) },
        nets: [
            ['bat.pos', 'btn.a', 'pt.collector', 'rp.a', 'rt.a', 'rm.a', 'rr1.a', 'u.vcc', 'cnt.vcc',
                'k.coil_a', 'df.cathode', 'k.com'],
            ['btn.b', 're.a'], ['re.b', 'ir.anode'],
            ['pt.emitter', 'rbe.a', 'qa.base'], ['qa.collector', 'rp.b', 'cd.a'], ['cd.b', 'rt.b', 'dt.cathode'],
            ['dt.anode', 'rm.b', 'cm.a', 'u.1_pos'], ['rr1.b', 'rr2.a', 'u.1_neg'],
            ['u.1_out', 'cm.b', 'cnt.clk_a'],
            ['cnt.qa', 'rb.a'], ['rb.b', 'q.base'],
            ['q.collector', 'k.coil_b', 'df.anode'], ['k.no', 'rl.a'], ['rl.b', 'lamp.anode'],
            ['bat.neg', 'ir.cathode', 'rbe.b', 'qa.emitter', 'rr2.b', 'u.gnd', 'u.2_pos', 'u.2_neg',
                'cnt.gnd', 'cnt.clk_b', 'cnt.r0_1', 'cnt.r0_2', 'q.emitter', 'lamp.cathode'],
        ],
        open: ['u.2_out', 'cnt.qb', 'cnt.qc', 'cnt.qd', 'cnt.nc1', 'cnt.nc2', 'cnt.nc3', 'cnt.nc4', 'k.nc'],
    },

    // Seven octaves from one oscillator. A 555 astable near 4.5 kHz clocks
    // two 74HC93 ripple counters in a chain (each counter's QA feeds its own
    // input B, the first counter's QD clocks the second): seven stages, each
    // half the frequency of the one before, f/2 down to f/128. Every output
    // feeds 47 k into one summing node, and 10 µF couples the mix into a
    // crystal earphone: one chord of seven octaves.
    'lab-octave-divider': {
        vcc: 5, supply: SUP,
        parts: { bat: BAT5, osc: ['timer_555', {}], ra: R(1000), rb: R(6800), ct: C(22e-9), cv: C(10e-9),
            c1: ['74hc93', {}], c2: ['74hc93', {}],
            s1: R(47000), s2: R(47000), s3: R(47000), s4: R(47000), s5: R(47000), s6: R(47000), s7: R(47000),
            cc: EL(10e-6), ear: ['earphone', { type: 'crystal' }] },
        nets: [
            ['bat.pos', 'osc.vcc', 'osc.reset', 'ra.a', 'c1.vcc', 'c2.vcc'],
            ['ra.b', 'osc.discharge', 'rb.a'], ['rb.b', 'osc.threshold', 'osc.trigger', 'ct.a'], ['osc.control', 'cv.a'],
            ['osc.output', 'c1.clk_a'],
            ['c1.qa', 'c1.clk_b', 's1.a'], ['c1.qb', 's2.a'], ['c1.qc', 's3.a'], ['c1.qd', 'c2.clk_a', 's4.a'],
            ['c2.qa', 'c2.clk_b', 's5.a'], ['c2.qb', 's6.a'], ['c2.qc', 's7.a'],
            ['s1.b', 's2.b', 's3.b', 's4.b', 's5.b', 's6.b', 's7.b', 'cc.pos'], ['cc.neg', 'ear.a'],
            ['bat.neg', 'osc.gnd', 'ct.b', 'cv.b', 'c1.gnd', 'c2.gnd', 'c1.r0_1', 'c1.r0_2', 'c2.r0_1', 'c2.r0_2', 'ear.b'],
        ],
        open: ['c1.nc1', 'c1.nc2', 'c1.nc3', 'c1.nc4', 'c2.nc1', 'c2.nc2', 'c2.nc3', 'c2.nc4', 'c2.qd'],
    },

    // Light barrier counter. An IR LED shines on a phototransistor 5 cm away;
    // the light path's knob is how much of the beam an object blocks (0 .. 1).
    // The phototransistor is an emitter follower into 10 k: its emitter is
    // high while the beam is clear and drops when it is blocked. That signal
    // goes through the first changeover contact of a two-pole relay (rest
    // side) to the counter's clock, which steps on a falling edge: every
    // interruption counts one. Two diodes decode 6 (QB and QC both high):
    // only then does 4.7 k lift their junction above the extra diode in the
    // base lead, and the NPN pulls the relay in. The relay's first pole cuts
    // the clock (100 k holds the input low), so the count stays at 6; its
    // second pole lights the lamp. The button clears the counter and the
    // relay drops out.
    'lab-barrier-counter': {
        vcc: 5, supply: SUP,
        parts: { bat: BAT5, re: R(150), ir: ['ir_transmitter', {}], pt: ['phototransistor', {}],
            rp: R(10000), rpd: R(100000), cnt: ['74hc93', {}],
            clr: ['button', {}], rcl: R(10000),
            r0: R(470), l0: LED('red'), r1: R(470), l1: LED('red'), r2: R(470), l2: LED('red'),
            db: ['diode', { part: '1N4148' }], dc: ['diode', { part: '1N4148' }], rd: R(4700),
            ds: ['diode', { part: '1N4148' }], rb: R(1000), rbq: R(10000), q: NPN,
            k: ['relay_dpdt', { coilR: 200 }], df: ['diode', { part: '1N4148' }],
            rl: R(220), lamp: LED('green'),
            beam: PATH({ from: '@ir', to: '@pt', medium: 'air', distanceCm: 5, blocked: 0,
                knob: 'blocked', knobMin: 0, knobMax: 1 }) },
        nets: [
            ['bat.pos', 're.a', 'pt.collector', 'cnt.vcc', 'clr.a', 'rd.a', 'k.coil_a', 'df.cathode', 'k.com2'],
            ['re.b', 'ir.anode'], ['pt.emitter', 'rp.a', 'k.com1'], ['k.nc1', 'rpd.a', 'cnt.clk_a'],
            ['cnt.qa', 'cnt.clk_b', 'r0.a'], ['cnt.qb', 'db.cathode', 'r1.a'], ['cnt.qc', 'dc.cathode', 'r2.a'],
            ['db.anode', 'dc.anode', 'rd.b', 'ds.anode'], ['ds.cathode', 'rb.a'], ['rb.b', 'rbq.a', 'q.base'],
            ['clr.b', 'rcl.a', 'cnt.r0_1', 'cnt.r0_2'],
            ['r0.b', 'l0.anode'], ['r1.b', 'l1.anode'], ['r2.b', 'l2.anode'],
            ['q.collector', 'k.coil_b', 'df.anode'], ['k.no2', 'rl.a'], ['rl.b', 'lamp.anode'],
            ['bat.neg', 'ir.cathode', 'rp.b', 'rpd.b', 'cnt.gnd', 'rcl.b',
                'l0.cathode', 'l1.cathode', 'l2.cathode', 'rbq.b', 'q.emitter', 'lamp.cathode'],
        ],
        open: ['cnt.qd', 'cnt.nc1', 'cnt.nc2', 'cnt.nc3', 'cnt.nc4', 'k.no1', 'k.nc2'],
    },

    // A counter that only counts loud sound. A magnetic earphone is the
    // microphone (a steady 200 Hz tone at 90 dB SPL is reaching it). One
    // op-amp amplifies its millivolts about 300 times (1 MΩ against 1 k plus
    // the earphone's own 2 k). Its + input sits on the sensitivity pot, and
    // since 10 µF blocks DC at the - input, the output rests at the pot's
    // voltage, below the counter's switching level (half the supply). Only
    // when the sound swings the output above that level does the 74HC93 get
    // clock edges; four LEDs show the count. The LM358's second half is not
    // used (inputs grounded).
    'lab-loud-counter': {
        vcc: 5, supply: SUP,
        parts: { bat: BAT5, mic: ['earphone', { type: 'magnetic', ohms: 2000, henrys: 0.1, ratedWatts: 0.001,
            soundDb: 90, soundWave: 'tone', soundHz: 200 }],
            cin: EL(10e-6), rin: R(1000), rf: R(1000000), u: ['lm358', {}],
            rt: R(10000), sens: POT(10000, 0.8), cnt: ['74hc93', {}],
            r0: R(470), l0: LED('red'), r1: R(470), l1: LED('red'), r2: R(470), l2: LED('red'), r3: R(470), l3: LED('red') },
        nets: [
            ['bat.pos', 'u.vcc', 'rt.a', 'cnt.vcc'],
            ['mic.a', 'cin.neg'], ['cin.pos', 'rin.a'], ['rin.b', 'rf.a', 'u.1_neg'], ['u.1_out', 'rf.b', 'cnt.clk_a'],
            ['rt.b', 'sens.a'], ['sens.wiper', 'u.1_pos', 'mic.b'],
            ['cnt.qa', 'cnt.clk_b', 'r0.a'], ['cnt.qb', 'r1.a'], ['cnt.qc', 'r2.a'], ['cnt.qd', 'r3.a'],
            ['r0.b', 'l0.anode'], ['r1.b', 'l1.anode'], ['r2.b', 'l2.anode'], ['r3.b', 'l3.anode'],
            ['bat.neg', 'sens.b', 'u.gnd', 'u.2_pos', 'u.2_neg', 'cnt.gnd', 'cnt.r0_1', 'cnt.r0_2',
                'l0.cathode', 'l1.cathode', 'l2.cathode', 'l3.cathode'],
        ],
        open: ['u.2_out', 'cnt.nc1', 'cnt.nc2', 'cnt.nc3', 'cnt.nc4'],
    },
});
