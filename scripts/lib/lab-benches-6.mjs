/**
 * Netlists for the sixth set of lab-* benches (coupled coils, LC oscillators,
 * motor speed control, a self-heated airflow sensor, solar cells and Schmitt
 * NAND sound gates), written by
 * `node scripts/gen-lab-circuits-4.mjs --set=6`.
 *
 * Same shape as lab-benches-4.mjs: pure data, so test/lab-circuits-6.test.mjs
 * names parts by role. Ids follow benchIds (breadboard first, then the parts
 * in the order listed). A param written '@name' (the thermal model's
 * heatedBy) is resolved to that part's engine id below.
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

export const BENCHES = {
    // A 100 µF capacitor, kept charged through 1 kΩ, is dumped by a button
    // into winding A (2.2 Ω stands for the wire). Winding B (four times the
    // inductance, so twice the turns) is wired to nothing on side A: a diode
    // catches its pulse in 10 µF, which feeds an NPN through 100 kΩ and
    // flashes the LED. Separately, an LED tester and a second, identical coil
    // pair: through winding A the LED lights; to winding B it stays dark, and
    // the voltmeter from B back to the battery shows the gap holding ~7 V.
    'lab-coil-pulse': {
        vcc: 9, supply: SUP,
        parts: { bat: BAT9, rch: R(1000), cp: EL(100e-6), dump: ['button', {}], rw: R(2.2),
            t1: ['transformer', { l1: 0.01, l2: 0.04, k: 0.9 }],
            d: ['diode', {}], cs: EL(10e-6), rb: R(100000), q: NPN, rl: R(470), led: LED('red'),
            rt: R(1000), lt: LED('green'), sw: ['slide_switch', { position: 0 }],
            t2: ['transformer', { l1: 0.01, l2: 0.04, k: 0.9 }], vm: ['voltmeter', {}] },
        nets: [
            ['bat.pos', 'rch.a', 'rl.a', 'rt.a'], ['rch.b', 'cp.pos', 'dump.a'], ['dump.b', 'rw.a'], ['rw.b', 't1.p1'],
            ['t1.s1', 'd.anode'], ['d.cathode', 'cs.pos', 'rb.a'], ['rb.b', 'q.base'],
            ['rl.b', 'led.anode'], ['led.cathode', 'q.collector'],
            ['rt.b', 'lt.anode'], ['lt.cathode', 'sw.com'], ['sw.a', 't2.p1'], ['sw.b', 't2.s1'], ['t2.s2', 'vm.a'],
            ['bat.neg', 'cp.neg', 't1.p2', 't1.s2', 'cs.neg', 'q.emitter', 't2.p2', 'vm.b'],
        ],
    },

    // Meissner oscillator: Q1 common emitter, the tank (10 mH primary with
    // 22 nF, 4.7 kΩ loss) in its collector; the 1 mH secondary, wound the
    // right way round, sits between the base and the 47 k / 10 k bias divider
    // (held still by 100 nF) and returns the swing to the base. About
    // 10.7 kHz. Q2 sits just at the edge of conduction, biased by the audio
    // generator's offset (0.65 V, 500 Hz, 0.15 V): the carrier reaches its
    // base through 1 nF + 47 kΩ, and the audio sets how much of each carrier
    // peak gets through: amplitude modulation at Q2's collector.
    'lab-meissner-am': {
        vcc: 9, supply: SUP,
        parts: { bat: BAT9, t: ['transformer', { l1: 0.01, l2: 0.001, k: 0.9 }], ct: C(22e-9), rd: R(4700),
            r1: R(47000), r2: R(10000), cb: C(100e-9), q1: NPN, re: R(220), re0: R(820), ce: C(1e-6),
            cc: C(1e-9), rc: R(47000), q2: NPN, rl: R(2200), re2: R(100),
            fg: ['function_gen', { wave: 'sine', freq: 500, amplitude: 0.15, offset: 0.65 }], rin: R(1000),
            scope: ['oscilloscope', {}] },
        nets: [
            ['bat.pos', 't.p1', 'ct.a', 'rd.a', 'r1.a', 'rl.a'],
            ['t.p2', 'ct.b', 'rd.b', 'q1.collector', 'cc.a', 'scope.ch1'],
            ['r1.b', 'r2.a', 't.s2', 'cb.a'], ['t.s1', 'q1.base'],
            ['q1.emitter', 're.a'], ['re.b', 're0.a', 'ce.a'],
            ['cc.b', 'rc.a'], ['rc.b', 'q2.base', 'rin.b'], ['fg.out', 'rin.a'],
            ['rl.b', 'q2.collector', 'scope.ch2'], ['q2.emitter', 're2.a'],
            ['bat.neg', 'r2.b', 'cb.b', 're0.b', 'ce.b', 're2.b', 'fg.gnd', 'scope.gnd'],
        ],
    },

    // Colpitts oscillator in common base: 100 mH from +9 V to the collector,
    // 100 nF collector-to-emitter and 1 µF emitter-to-ground split the tank
    // and hand a tenth of the swing back to the emitter. The base sits on a
    // 22 k / 10 k divider held still by 10 µF. f = 1/(2π√(L·C1C2/(C1+C2)))
    // ≈ 1.67 kHz.
    'lab-lc-oscillator': {
        vcc: 9, supply: SUP,
        parts: { bat: BAT9, l: ['inductor', { henries: 0.1 }], c1: C(100e-9), c2: C(1e-6),
            q: NPN, re: R(4700), ra: R(22000), rb: R(10000), cb: EL(10e-6), scope: ['oscilloscope', {}] },
        nets: [
            ['bat.pos', 'l.a', 'ra.a'], ['l.b', 'q.collector', 'c1.a', 'scope.ch1'],
            ['c1.b', 'c2.a', 'q.emitter', 're.a', 'scope.ch2'], ['ra.b', 'rb.a', 'cb.pos', 'q.base'],
            ['bat.neg', 'c2.b', 're.b', 'rb.b', 'cb.neg', 'scope.gnd'],
        ],
    },

    // Speed sensing: the encoder gives two pulses per turn; each falling edge,
    // through 10 nF onto a trigger held at 4.5 V, fires a 555 monostable
    // (22 kΩ x 100 nF = 2.4 ms). 10 kΩ + 10 µF average the pulses into a
    // voltage proportional to speed, shown on a moving-coil meter (2 V full
    // scale). Control: in "regulated" the LM358 integrates set-point minus
    // speed (47 kΩ, 1 µF + 47 kΩ) and drives the motor through an emitter
    // follower; in "manual" the follower takes a throttle pot instead.
    'lab-motor-speed': {
        vcc: 9, supply: SUP,
        parts: { bat: BAT9, m: ['dc_motor_encoder', { kV: 0.02, pulsesPerRev: 2, loadTorque: 0 }],
            rp: R(10000), rq: R(10000), cd: C(10e-9), tm: ['timer_555', {}], rt: R(22000), ct: C(100e-9), cv: C(10e-9),
            ravg: R(10000), cavg: EL(10e-6), meter: ['analog_meter', { fullScale: 2, ifs: 0.0001 }],
            rs1: R(33000), set: POT(10000, 0.5), u: ['lm358', {}], ri: R(47000), rf: R(47000), cf: C(1e-6),
            thr: POT(10000, 0.5), sw: ['slide_switch', { position: 0 }], q: NPN, d: ['diode', {}] },
        nets: [
            ['bat.pos', 'tm.vcc', 'tm.reset', 'rp.a', 'rt.a', 'rs1.a', 'u.vcc', 'thr.a', 'q.collector'],
            ['m.enc_a', 'cd.a'], ['cd.b', 'rp.b', 'rq.a', 'tm.trigger'],
            ['rt.b', 'tm.threshold', 'tm.discharge', 'ct.a'], ['tm.control', 'cv.a'],
            ['tm.output', 'ravg.a'], ['ravg.b', 'cavg.pos', 'ri.a', 'meter.a'],
            ['rs1.b', 'set.a'], ['set.wiper', 'u.1_pos'], ['ri.b', 'u.1_neg', 'cf.a'], ['cf.b', 'rf.a'],
            ['rf.b', 'u.1_out', 'sw.a'], ['thr.wiper', 'sw.b'], ['sw.com', 'q.base'], ['q.emitter', 'm.a', 'd.cathode'],
            ['bat.neg', 'd.anode', 'rq.b', 'm.b', 'tm.gnd', 'ct.b', 'cv.b', 'cavg.neg', 'meter.b', 'set.b', 'thr.b', 'u.gnd',
                'u.2_pos', 'u.2_neg', 'u.2_out'],
        ],
        open: ['m.enc_b'],
    },

    // Hot-wire anemometer: a 470 Ω heater (rth 200 K/W) warms the NTC beside
    // it (coupling 0.8). The NTC over 10 kΩ gives the sensor voltage S. A
    // "zero" pot is the other half of the bridge; the meter (2 V full scale)
    // between them reads airflow. Comparator 1 lights the DRAUGHT LED when S
    // falls below the alarm pot; comparator 2 runs the fan when S rises above
    // the thermostat pot (a warmer room). The fan blows on the sensor
    // (airflowGain 0.01 m/s per rad/s), so the thermostat cycles it.
    'lab-airflow-sensor': {
        vcc: 9, supply: SUP,
        parts: { bat: BAT9, rh: ['resistor', { ohms: 470, rth: 200, thermalTau: 2 }],
            ntc: ['ntc', { r25: 10000, beta: 3950, heatedBy: '@rh', thermalCoupling: 0.8, thermalTau: 2 }], rn: R(6800),
            zero: POT(1000, 0.69), meter: ['analog_meter', { fullScale: 2, ifs: 0.0001 }],
            alarm: POT(10000, 0.66), u: ['lm358', {}], rl: R(1000), led: LED('red'),
            stat: POT(10000, 0.71), rbq: R(10000), q: NPN, fan: ['dc_motor', { J: 5e-6, loadTorque: 0.0005, airflowGain: 0.01 }], d: ['diode', {}] },
        nets: [
            ['bat.pos', 'rh.a', 'ntc.a', 'zero.a', 'alarm.a', 'stat.a', 'u.vcc', 'q.collector'],
            ['ntc.b', 'rn.a', 'meter.b', 'u.1_neg', 'u.2_pos'], ['zero.wiper', 'meter.a'],
            ['alarm.wiper', 'u.1_pos'], ['u.1_out', 'rl.a'], ['rl.b', 'led.anode'],
            ['stat.wiper', 'u.2_neg'], ['u.2_out', 'rbq.a'], ['rbq.b', 'q.base'], ['q.emitter', 'fan.a', 'd.cathode'],
            ['bat.neg', 'rh.b', 'rn.b', 'zero.b', 'alarm.b', 'stat.b', 'u.gnd', 'led.cathode', 'fan.b', 'd.anode'],
        ],
    },

    // Three cells, each with its own light setting (start: half light).
    // Cell 1 with an ammeter, a load rheostat (100 Ω pot + 1 Ω) that a slide
    // switch can take away, and a voltmeter: the I-V curve. Cell 2 between a
    // bias divider (100 k / 5.6 k, 0.48 V) and an NPN base: alone (switch to
    // ground) it cannot open the transistor, stacked on the bias it does.
    // Cell 3 drives a small fan motor that needs some light to start.
    'lab-solar-cell': {
        vcc: 9, supply: SUP,
        parts: { bat: BAT9,
            pv1: ['solar_cell', { light: 0.5 }], am: ['ammeter', {}], sl: ['slide_switch', { position: 1 }],
            rmin: R(1), load: POT(100, 0.5), vm: ['voltmeter', {}],
            pv2: ['solar_cell', { light: 0.5 }], sb: ['slide_switch', { position: 1 }], ra: R(100000), rb: R(5600),
            q: NPN, rc: R(1000), led: LED('green'),
            pv3: ['solar_cell', { light: 0.5 }], fan: ['dc_motor', { loadTorque: 0.0003, J: 5e-6 }], d: ['diode', {}] },
        nets: [
            ['pv1.pos', 'am.a', 'vm.a'], ['am.b', 'sl.com'], ['sl.b', 'rmin.a'], ['rmin.b', 'load.a'],
            ['bat.pos', 'ra.a', 'rc.a'], ['ra.b', 'rb.a', 'sb.b'], ['sb.com', 'pv2.neg'], ['pv2.pos', 'q.base'],
            ['rc.b', 'led.anode'], ['led.cathode', 'q.collector'], ['pv3.pos', 'fan.a', 'd.cathode'],
            ['bat.neg', 'pv1.neg', 'vm.b', 'load.wiper', 'load.b', 'rb.b', 'sb.a', 'q.emitter', 'pv3.neg', 'fan.b', 'd.anode'],
        ],
        open: ['sl.a'],
    },

    // One 74HC132 (four Schmitt NANDs) on 5 V. Gate 1 with 470 kΩ / 1 µF is a
    // slow oscillator (a few hertz, yellow LED). Gate 2 with 22 kΩ / 100 nF
    // is a tone oscillator (about 570 Hz) into the piezo through 10 kΩ; its
    // second input takes gate 1's output (pips) or, switched over, a steady
    // high (continuous tone). Gates 3 and 4 are left over (inputs grounded).
    'lab-nand-pips': {
        vcc: 5, supply: SUP,
        parts: { bat: ['vsource', { volts: 5 }], u: ['74hc132', {}],
            r1: R(470000), c1: EL(1e-6), rl1: R(470), l1: LED('yellow'),
            sw: ['slide_switch', { position: 0 }],
            r2: R(22000), c2: C(100e-9), rs: R(10000), spk: ['piezo', {}] },
        nets: [
            ['bat.pos', 'u.vcc', 'u.1a', 'sw.b'], ['u.1b', 'r1.a', 'c1.pos'], ['u.1y', 'r1.b', 'sw.a', 'rl1.a'],
            ['rl1.b', 'l1.anode'], ['sw.com', 'u.2a'], ['u.2b', 'r2.a', 'c2.a'], ['u.2y', 'r2.b', 'rs.a'], ['rs.b', 'spk.a'],
            ['bat.neg', 'u.gnd', 'c1.neg', 'l1.cathode', 'c2.b', 'spk.b', 'u.3a', 'u.3b', 'u.4a', 'u.4b'],
        ],
        open: ['u.3y', 'u.4y'],
    },

    // One-shot beep. Gate 1 inverts the button (10 kΩ pull-up): pressed, its
    // output goes high and fills 1 µF through a diode and 100 Ω. 1 MΩ drains
    // it. Gate 2 reads the capacitor (output low while it is charged: green
    // LED from +5 V on), gate 3 inverts that and lets gate 4 (22 kΩ / 100 nF)
    // sing into the piezo for as long as the timer runs, about 0.9 s after
    // release.
    'lab-nand-one-shot': {
        vcc: 5, supply: SUP,
        parts: { bat: ['vsource', { volts: 5 }], u: ['74hc132', {}],
            go: ['button', {}], rp: R(10000), d: ['diode', {}], rch: R(100), ct: EL(1e-6), rt: R(1000000),
            rl: R(470), led: LED('green'),
            r4: R(22000), c4: C(100e-9), rs: R(10000), spk: ['piezo', {}] },
        nets: [
            ['bat.pos', 'u.vcc', 'rp.a', 'rl.a'], ['rp.b', 'go.a', 'u.1a', 'u.1b'], ['u.1y', 'd.anode'], ['d.cathode', 'rch.a'],
            ['rch.b', 'ct.pos', 'rt.a', 'u.2a', 'u.2b'], ['u.2y', 'led.cathode', 'u.3a', 'u.3b'], ['rl.b', 'led.anode'],
            ['u.3y', 'u.4a'], ['u.4b', 'r4.a', 'c4.a'], ['u.4y', 'r4.b', 'rs.a'], ['rs.b', 'spk.a'],
            ['bat.neg', 'u.gnd', 'go.b', 'ct.neg', 'rt.b', 'c4.b', 'spk.b'],
        ],
    },

    // Amp-IC horn. An LM386 (gain 20, pins 1 and 8 open) is made to oscillate:
    // its output kicks +IN through 47 nF, and the kick decays through 22 kΩ
    // (in parallel with the chip's own 50 kΩ input) until the amplifier flips
    // back. −IN is grounded. The output, biased at half the supply, reaches an
    // 8 Ω speaker (a piezo part with an 8 Ω element) through 100 µF, which
    // blocks the DC. The button puts 10 kΩ across the 22 kΩ: a faster decay,
    // a higher note. The scope watches both sides of the coupling capacitor.
    'lab-amp-horn': {
        vcc: 9, supply: SUP,
        parts: { bat: BAT9, u: ['lm386', {}], cf: C(47e-9), rb: R(22000), btn: ['button', {}], rp: R(10000),
            co: EL(100e-6), spk: ['piezo', { leakOhms: 8 }], scope: ['oscilloscope', {}] },
        nets: [
            ['bat.pos', 'u.vs'],
            ['u.vout', 'cf.a', 'co.pos', 'scope.ch1'], ['cf.b', 'u.inp', 'rb.a', 'btn.a'], ['btn.b', 'rp.a'],
            ['co.neg', 'spk.a', 'scope.ch2'],
            ['bat.neg', 'u.gnd', 'u.inn', 'rb.b', 'rp.b', 'spk.b', 'scope.gnd'],
        ],
        open: ['u.gain1', 'u.gain8', 'u.bypass'],
    },
};

// Resolve '@name' params to engine ids.
for (const spec of Object.values(BENCHES)) {
    const ids = benchIds(spec);
    for (const [, params] of Object.values(spec.parts))
        for (const [k, v] of Object.entries(params || {}))
            if (typeof v === 'string' && v.startsWith('@')) params[k] = ids[v.slice(1)];
}
