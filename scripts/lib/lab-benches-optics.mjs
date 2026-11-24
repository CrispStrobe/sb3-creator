/**
 * Netlists for the optics lab benches: light from a placed emitter (LED, IR
 * LED, laser diode) to a placed receiver (phototransistor, photodiode) along
 * a `light_path` part (bw-board src/optics.js) — light guide, optical bench,
 * lens, coloured surface, prism, glass of liquid, plucked string. Written by
 * `node scripts/gen-lab-circuits-4.mjs --set=optics`.
 *
 * Same shape as lab-benches-4.mjs: pure data, so
 * test/lab-circuits-optics.test.mjs names parts by role. A light path has no
 * leads; its `from` / `to` params name the emitter and receiver by ENGINE id,
 * so a bench writes them as '@role' and `resolveRefs` below turns them into
 * the ids benchIds assigns (breadboard first, then the parts in listing order).
 */
import { benchIds } from './lab-benches-4.mjs';
export { benchIds };

const SUP = { pos: 'bat.pos', neg: 'bat.neg' };
const R = (ohms) => ['resistor', { ohms }];
const C = (farads) => ['capacitor', { farads }];
const EL = (farads) => ['polarized_cap', { farads }];
const NPN = ['npn', { beta: 100 }];
const PNP = ['pnp', { beta: 100 }];
const BAT9 = ['vsource', { volts: 9, variant: '9v' }];
const LED = (color) => ['led', { color }];
const PT = ['phototransistor', {}];
const PD = ['photodiode', {}];
const VM = ['voltmeter', {}];
const PATH = (params) => ['light_path', params];

/**
 * Replace '@role' in a part param that names another part (a light path's
 * from / to, a thermal part's heatedBy) with the bench's engine id.
 */
function resolveRefs(benches) {
    for (const spec of Object.values(benches)) {
        const ids = benchIds(spec);
        for (const [, [, params]] of Object.entries(spec.parts)) {
            for (const k of ['from', 'to', 'heatedBy']) {
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

const T555 = ['timer_555', {}];
const EAR = ['earphone', { type: 'magnetic', ohms: 2000, henrys: 0.1, ratedWatts: 0.001 }];

export const BENCHES = resolveRefs({
    // Red LED -> 1 m plastic light guide (one 3 cm bend, clean cuts) ->
    // phototransistor as an emitter follower into 470 ohm; the voltmeter reads
    // the light. The knob is the bend radius (0.4 .. 5 cm).
    'lab-light-guide': {
        vcc: 9, supply: SUP,
        parts: { bat: BAT9, rs: R(470), led: LED('red'), pt: PT, rl: R(470), vm: VM,
            guide: PATH({ from: '@led', to: '@pt', medium: 'fibre', lengthM: 1, bendRadiusCm: 3, bends: 1,
                cutQuality: 1, outGapMm: 1, shield: 0, knob: 'bendRadiusCm', knobMin: 0.4, knobMax: 5 }) },
        nets: [
            ['bat.pos', 'rs.a', 'pt.collector'], ['rs.b', 'led.anode'],
            ['pt.emitter', 'rl.a', 'vm.a'],
            ['bat.neg', 'led.cathode', 'rl.b', 'vm.b'],
        ],
    },

    // The light guide's entrance 9 cm from the LED, with a lens (f = 2 cm,
    // 3 cm across) 6 cm in front of the LED: it images the LED onto the fibre
    // face 3 cm behind it. The knob slides the fibre end from 7.5 to 10.5 cm.
    'lab-fibre-lens': {
        vcc: 9, supply: SUP,
        parts: { bat: BAT9, rs: R(470), led: LED('red'), pt: PT, rl: R(470), vm: VM,
            guide: PATH({ from: '@led', to: '@pt', medium: 'fibre', lengthM: 1, outGapMm: 1,
                lensFocalCm: 2, lensAtCm: 6, lensRadiusCm: 1.5, fibreAtCm: 9,
                knob: 'fibreAtCm', knobMin: 7.5, knobMax: 10.5 }) },
        nets: [
            ['bat.pos', 'rs.a', 'pt.collector'], ['rs.b', 'led.anode'],
            ['pt.emitter', 'rl.a', 'vm.a'],
            ['bat.neg', 'led.cathode', 'rl.b', 'vm.b'],
        ],
    },

    // A 555 astable whose 47 k charging resistor has a phototransistor in
    // parallel: light from the light guide's far end adds charging current,
    // so the pitch rises. The knob moves the fibre end toward the receiver
    // (gap 0 .. 10 mm).
    'lab-fibre-tone': {
        vcc: 9, supply: SUP,
        parts: { bat: BAT9, rs: R(470), led: LED('red'), pt: ['phototransistor', { iMax: 0.0005 }],
            r1: R(47000), r2: R(1000), ct: C(47e-9), u: T555, cv: C(10e-9), spk: ['piezo', {}],
            guide: PATH({ from: '@led', to: '@pt', medium: 'fibre', lengthM: 0.5, outGapMm: 2,
                knob: 'outGapMm', knobMin: 0, knobMax: 10 }) },
        nets: [
            ['bat.pos', 'rs.a', 'pt.collector', 'r1.a', 'u.vcc', 'u.reset'], ['rs.b', 'led.anode'],
            ['pt.emitter', 'r1.b', 'u.discharge', 'r2.a'], ['r2.b', 'u.threshold', 'u.trigger', 'ct.a'],
            ['u.control', 'cv.a'], ['u.output', 'spk.a'],
            ['bat.neg', 'led.cathode', 'ct.b', 'cv.b', 'u.gnd', 'spk.b'],
        ],
    },

    // A 555 tone (about 750 Hz) flashes the LED; the light guide carries the
    // flashes; at the far end a phototransistor turns them back into a
    // current and the earphone, AC-coupled across its load, plays the tone.
    'lab-fibre-audio': {
        vcc: 9, supply: SUP,
        parts: { bat: BAT9, u: T555, r1: R(1000), r2: R(10000), ct: C(100e-9), cv: C(10e-9),
            rs: R(330), led: LED('red'), pt: PT, rl: R(2200), cc: EL(10e-6), ear: EAR,
            guide: PATH({ from: '@led', to: '@pt', medium: 'fibre', lengthM: 2, outGapMm: 1,
                knob: 'outGapMm', knobMin: 0, knobMax: 20 }) },
        nets: [
            ['bat.pos', 'u.vcc', 'u.reset', 'r1.a', 'pt.collector'],
            ['r1.b', 'u.discharge', 'r2.a'], ['r2.b', 'u.threshold', 'u.trigger', 'ct.a'],
            ['u.control', 'cv.a'], ['u.output', 'rs.a'], ['rs.b', 'led.anode'],
            ['pt.emitter', 'rl.a', 'cc.pos'], ['cc.neg', 'ear.a'],
            ['bat.neg', 'u.gnd', 'ct.b', 'cv.b', 'led.cathode', 'rl.b', 'ear.b'],
        ],
    },

    // FM over the fibre on a 5 V bench. TX: a 555 near 100 kHz; the
    // potentiometer moves its control voltage (the music's instantaneous
    // value), and the pitch of the light flashes follows it. RX: the
    // phototransistor switches its 1 k load fully on and off, and a diode
    // pump turns every flash into the same small charge: the averaged
    // output voltage follows the flash frequency, not the brightness.
    'lab-fibre-fm': {
        vcc: 5, supply: { pos: 'bat.pos', neg: 'bat.neg' },
        parts: { bat: ['vsource', { volts: 5 }], u: T555, r1: R(1000), r2: R(6800), ct: C(1e-9),
            pot: ['potentiometer', { ohms: 10000, position: 0.5 }], rcv: R(4700),
            rs: R(150), led: LED('red'), pt: PT, rl: R(1000),
            cp: C(100e-12), d1: ['diode', {}], d2: ['diode', {}], ro: R(47000), co: C(2.2e-9), vm: VM,
            guide: PATH({ from: '@led', to: '@pt', medium: 'fibre', lengthM: 1, outGapMm: 1,
                knob: 'outGapMm', knobMin: 0, knobMax: 20 }) },
        nets: [
            ['bat.pos', 'u.vcc', 'u.reset', 'r1.a', 'rl.a', 'pot.a'],
            ['r1.b', 'u.discharge', 'r2.a'], ['r2.b', 'u.threshold', 'u.trigger', 'ct.a'],
            ['pot.wiper', 'rcv.a'], ['rcv.b', 'u.control'],
            ['u.output', 'rs.a'], ['rs.b', 'led.anode'],
            ['rl.b', 'pt.collector', 'cp.a'], ['cp.b', 'd1.anode', 'd2.cathode'],
            ['d1.cathode', 'ro.a', 'co.a', 'vm.a'],
            ['bat.neg', 'pot.b', 'u.gnd', 'ct.b', 'led.cathode', 'pt.emitter', 'd2.anode',
                'ro.b', 'co.b', 'vm.b'],
        ],
    },

    // Two light-guide pieces meet in a joint; the gap between their ends is
    // the knob (0 .. 0.5 mm). The phototransistor's current through 47 k sets
    // the base of a complementary NPN/PNP (Sziklai) pair, an emitter follower
    // with the gain of a Darlington: the meter follows hundredths of a mm.
    'lab-fibre-gap-gauge': {
        vcc: 9, supply: SUP,
        parts: { bat: BAT9, rs: R(470), led: LED('red'), pt: ['phototransistor', { iMax: 0.0005 }], rb: R(47000),
            q1: NPN, rk: R(1000), rbe: R(10000), q2: PNP, rm: R(1000), vm: VM,
            guide: PATH({ from: '@led', to: '@pt', medium: 'fibre', lengthM: 1, jointGapMm: 0.1, outGapMm: 2,
                knob: 'jointGapMm', knobMin: 0, knobMax: 0.5 }) },
        nets: [
            ['bat.pos', 'rs.a', 'pt.collector', 'q2.emitter', 'rbe.a'], ['rs.b', 'led.anode'],
            ['pt.emitter', 'rb.a', 'q1.base'], ['q1.collector', 'rk.a'], ['rk.b', 'rbe.b', 'q2.base'],
            ['q1.emitter', 'q2.collector', 'rm.a', 'vm.a'],
            ['bat.neg', 'led.cathode', 'rb.b', 'rm.b', 'vm.b'],
        ],
    },

    // Optical bench: a red LED and a reverse-biased photodiode facing it
    // 10 cm away. The photocurrent through 10 k is proportional to the light,
    // so the voltmeter reads the inverse-square law. The knob is the distance.
    'lab-optical-bench': {
        vcc: 9, supply: SUP,
        parts: { bat: BAT9, rs: R(470), led: LED('red'), pd: PD, rl: R(10000), vm: VM,
            bench: PATH({ from: '@led', to: '@pd', medium: 'air', distanceCm: 10, angleDeg: 0,
                knob: 'distanceCm', knobMin: 2, knobMax: 30 }) },
        nets: [
            ['bat.pos', 'rs.a', 'pd.cathode'], ['rs.b', 'led.anode'],
            ['pd.anode', 'rl.a', 'vm.a'],
            ['bat.neg', 'led.cathode', 'rl.b', 'vm.b'],
        ],
    },

    // A heater resistor (switched) sits against LED 1 and phototransistor 2.
    // Link A: hot-able LED 1 -> cold phototransistor 1. Link B: cold LED 2 ->
    // hot-able phototransistor 2. Heated, LED 1 gives less light while
    // phototransistor 2 grows more sensitive.
    'lab-led-heat-light': {
        vcc: 9, supply: SUP,
        parts: { bat: BAT9, sw: ['slide_switch', { position: 0 }], rh: ['resistor', { ohms: 100, rth: 60, thermalTau: 1.5 }],
            rs1: R(470), led1: ['led', { color: 'red', heatedBy: '@rh', thermalCoupling: 0.9, thermalTau: 1.5 }],
            pt1: PT, rl1: R(2200), vm1: VM,
            rs2: R(470), led2: LED('red'), pt2: ['phototransistor', { heatedBy: '@rh', thermalCoupling: 0.9, thermalTau: 1.5 }],
            rl2: R(2200), vm2: VM,
            linkA: PATH({ from: '@led1', to: '@pt1', medium: 'air', distanceCm: 3 }),
            linkB: PATH({ from: '@led2', to: '@pt2', medium: 'air', distanceCm: 3 }) },
        nets: [
            ['bat.pos', 'sw.com', 'rs1.a', 'rs2.a', 'pt1.collector', 'pt2.collector'], ['sw.b', 'rh.a'],
            ['rs1.b', 'led1.anode'], ['rs2.b', 'led2.anode'],
            ['pt1.emitter', 'rl1.a', 'vm1.a'], ['pt2.emitter', 'rl2.a', 'vm2.a'],
            ['bat.neg', 'rh.b', 'led1.cathode', 'led2.cathode', 'rl1.b', 'vm1.b', 'rl2.b', 'vm2.b'],
        ],
        open: ['sw.a'],
    },

    // A string half in the beam between an LED and a phototransistor:
    // plucked (every second), it shades the light at its own pitch, and the
    // earphone across the phototransistor's load plays it. The knob tunes
    // the string (80 .. 330 Hz).
    'lab-light-guitar': {
        vcc: 9, supply: SUP,
        parts: { bat: BAT9, rs: R(470), led: LED('red'), pt: PT, rl: R(2200), cc: EL(10e-6), ear: EAR,
            string: PATH({ from: '@led', to: '@pt', medium: 'string', distanceCm: 2, stringHz: 110, decayS: 1.5,
                depth: 0.45, pluckPeriodS: 1, knob: 'stringHz', knobMin: 80, knobMax: 330 }) },
        nets: [
            ['bat.pos', 'rs.a', 'pt.collector'], ['rs.b', 'led.anode'],
            ['pt.emitter', 'rl.a', 'cc.pos'], ['cc.neg', 'ear.a'],
            ['bat.neg', 'led.cathode', 'rl.b', 'ear.b'],
        ],
    },

    // A red LED lights a surface 1 cm away; a phototransistor beside it
    // sees what the surface reflects. Red reflects red light, green hardly:
    // over a red surface the transistor stage lights the indicator LED.
    'lab-colour-sensor': {
        vcc: 9, supply: SUP,
        parts: { bat: BAT9, rs: R(470), led: LED('red'), pt: PT, re: R(10000), rbq: R(4700), q: NPN,
            rc: R(1000), ind: LED('yellow'), vm: VM,
            surface: PATH({ from: '@led', to: '@pt', medium: 'reflect', surface: 'red', distanceCm: 1,
                knob: 'distanceCm', knobMin: 0.3, knobMax: 5 }) },
        nets: [
            ['bat.pos', 'rs.a', 'pt.collector', 'rc.a'], ['rs.b', 'led.anode'],
            ['pt.emitter', 're.a', 'rbq.a', 'vm.a'], ['rbq.b', 'q.base'],
            ['rc.b', 'ind.anode'], ['ind.cathode', 'q.collector'],
            ['bat.neg', 'led.cathode', 're.b', 'q.emitter', 'vm.b'],
        ],
    },

    // A lens (f = 10 cm) 15 cm in front of the LED images it 30 cm behind
    // the lens, i.e. 45 cm from the LED. A small photodiode on the bench reads
    // most light there; the knob slides it from 20 to 70 cm.
    'lab-lens-focus': {
        vcc: 9, supply: SUP,
        parts: { bat: BAT9, rs: R(470), led: LED('red'), pd: PD, rl: R(47000), vm: VM,
            lens: PATH({ from: '@led', to: '@pd', medium: 'air', lensFocalCm: 10, lensAtCm: 15, lensRadiusCm: 1.5,
                distanceCm: 45, knob: 'distanceCm', knobMin: 20, knobMax: 70 }) },
        nets: [
            ['bat.pos', 'rs.a', 'pd.cathode'], ['rs.b', 'led.anode'],
            ['pd.anode', 'rl.a', 'vm.a'],
            ['bat.neg', 'led.cathode', 'rl.b', 'vm.b'],
        ],
    },

    // A beam through a round glass to a phototransistor that holds a
    // transistor's base low. When the liquid reaches the beam it is refracted
    // away, the phototransistor goes dark, the transistor turns on and the
    // "full" LED lights. The knob is the liquid level.
    'lab-liquid-level': {
        vcc: 9, supply: SUP,
        parts: { bat: BAT9, rs: R(470), led: ['led', { color: 'red', halfAngleDeg: 8 }], rb: R(100000), pt: PT,
            q: NPN, rc: R(1000), full: LED('blue'),
            glass: PATH({ from: '@led', to: '@pt', medium: 'liquid', level: 0, beamHeight: 0.5, distanceCm: 15,
                knob: 'level', knobMin: 0, knobMax: 1 }) },
        nets: [
            ['bat.pos', 'rs.a', 'rb.a', 'rc.a'], ['rs.b', 'led.anode'],
            ['rb.b', 'pt.collector', 'q.base'], ['rc.b', 'full.anode'], ['full.cathode', 'q.collector'],
            ['bat.neg', 'led.cathode', 'pt.emitter', 'q.emitter'],
        ],
    },

    // A white LED through a prism: blue is bent more than yellow-green. A
    // photodiode behind a slit reads one colour at a time; the knob turns
    // the slit across the spectrum.
    'lab-prism-spectrum': {
        vcc: 9, supply: SUP,
        parts: { bat: BAT9, rs: R(220), led: LED('white'), pd: PD, rl: R(4700), vm: VM,
            prism: PATH({ from: '@led', to: '@pd', medium: 'prism', material: 'acrylic', apexDeg: 60,
                slitAngleDeg: 37.2, knob: 'slitAngleDeg', knobMin: 36.0, knobMax: 37.6 }) },
        nets: [
            ['bat.pos', 'rs.a', 'pd.cathode'], ['rs.b', 'led.anode'],
            ['pd.anode', 'rl.a', 'vm.a'],
            ['bat.neg', 'led.cathode', 'rl.b', 'vm.b'],
        ],
    },
});
