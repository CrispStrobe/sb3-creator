/**
 * Netlists for the round-11 radio benches: a VHF FM superhet (mixer IC,
 * ceramic filter, FM IF IC) and the evening sky wave on the medium-wave
 * superhet. Written by `node scripts/gen-lab-circuits-4.mjs --set=r11`.
 *
 * Same shape as lab-benches-rf.mjs: pure data, so test/lab-circuits-r11.test.mjs
 * names parts by role. Ids follow benchIds (breadboard first, then the parts
 * in the order listed).
 *
 * The engine (bw-board src/radio.js) carries RF as complex envelopes around
 * the circuit's resonances; a junction swinging in two bands puts its
 * products (sum, difference, harmonics) into a third; linked coils couple
 * through the near field.
 */
import { benchIds } from './lab-benches-4.mjs';
import { BENCHES as MW } from './lab-benches-r7mw.mjs';
export { benchIds };

const SUP = { pos: 'bat.pos', neg: 'bat.neg' };
const R = (ohms) => ['resistor', { ohms }];
const C = (farads) => ['capacitor', { farads }];
const BAT6 = ['vsource', { volts: 6 }];
const POT = (ohms, position) => ['potentiometer', { ohms, position }];
const TUNE = (position) => ['tuning_cap', { minFarads: 10e-12, maxFarads: 500e-12, position }];
const BB = ['varicap', { part: 'BB910' }];
const clone = (x) => JSON.parse(JSON.stringify(x));

/** Two FM stations for the VHF receivers (from the north, broadside to the dipole). */
const FM_STATIONS = [
    { id: 'fm89', name: 'FM 89.0 MHz', hz: 89e6, mod: 'fm', deviationHz: 75e3, fieldVPerM: 0.02, bearingDeg: 0, audio: { type: 'tone', hz: 600 } },
    { id: 'fm98', name: 'FM 98.0 MHz', hz: 98e6, mod: 'fm', deviationHz: 75e3, fieldVPerM: 0.05, bearingDeg: 0, audio: { type: 'tone', hz: 1000 } },
];

/**
 * The VHF FM superhet's parts and nets (`extra` parts/nets appended).
 * Dipole through 1 pF onto the aerial tank (0.135 µH ‖ BB910), 2.2 pF to the
 * mixer IC's input A; the mixer's own transistor a Colpitts (10 pF / 22 pF)
 * on the oscillator tank (0.0987 µH ‖ BB910) through 10 pF. Both varicaps on
 * one tuning voltage from the pot (100 kΩ each, held by 1 nF): the two tanks
 * track 10.7 MHz apart. Output A into the 10.7 MHz ceramic filter, its
 * output into the FM IF IC (limiter, quadrature detector), the detector's
 * output (10 nF) through 100 nF into a crystal earphone. 6 V.
 */
function VHF_SUPERHET(tune = 0.75) {
    return {
        vcc: 6, supply: SUP,
        parts: { bat: BAT6, gnd: ['gnd', {}],
            dp: ['dipole', { heightM: 0.95, ohms: 300, angleDeg: 0, stations: FM_STATIONS }], ca: C(1e-12),
            l1: ['vhf_coil', { henrys: 0.135e-6, q: 60 }], v1: BB, cv1: C(1e-9), rt1: R(100000), tune: POT(100000, tune),
            ci: C(2.2e-12), u: ['sa612', {}], cb: C(100e-9),
            co1: C(10e-12), co2: C(22e-12), ck: C(10e-12),
            l2: ['vhf_coil', { henrys: 0.0987e-6, q: 60 }], v2: BB, cv2: C(1e-9), rt2: R(100000),
            f: ['ceramic_filter', {}], ifc: ['fm_if', {}], cau: C(10e-9),
            cc: C(100e-9), ep: ['earphone', { type: 'crystal' }] },
        nets: [
            ['dp.a', 'ca.a'], ['ca.b', 'l1.b', 'cv1.a', 'ci.a'], ['cv1.b', 'v1.cathode', 'rt1.a'],
            ['tune.wiper', 'rt1.b', 'rt2.b'],
            ['ci.b', 'u.in_a'], ['u.in_b', 'cb.a'],
            ['u.osc_b', 'co1.a', 'ck.a'], ['u.osc_e', 'co1.b', 'co2.a'],
            ['ck.b', 'l2.b', 'cv2.a'], ['cv2.b', 'v2.cathode', 'rt2.a'],
            ['u.out_a', 'f.in'], ['f.out', 'ifc.in'], ['ifc.out', 'cau.a', 'cc.a'], ['cc.b', 'ep.a'],
            ['bat.pos', 'tune.a', 'u.vcc', 'ifc.vcc'],
            ['bat.neg', 'gnd.gnd', 'dp.b', 'l1.a', 'v1.anode', 'tune.b', 'u.gnd', 'cb.b', 'co2.b', 'l2.a', 'v2.anode',
                'f.gnd', 'ifc.gnd', 'cau.b', 'ep.b'],
        ],
        open: ['u.out_b'],
    };
}

/**
 * The medium-wave superhet of lab-superhet with a clock on its antenna: the
 * antenna's dial is the hour of the day. Two local stations (ground wave
 * only) and a distant one at 702 kHz whose ground wave is 2 µV/m and
 * whose sky wave, after dark, 1 mV/m. The aerial tank and the oscillator
 * are set to it (0.384, 0.06).
 */
function SKYWAVE_RX() {
    const rx = clone(MW['lab-superhet']);
    const ant = rx.parts.ant[1];
    ant.clock = true;
    ant.hourOfDay = 12;
    ant.stations = [
        ...ant.stations.filter(s => s.hz < 1e6),
        { id: 'far702', name: 'Distant 702 kHz', hz: 702e3, fieldVPerM: 2e-6, skyFieldVPerM: 0.001, depth: 0.6, audio: { type: 'tone', hz: 700 } },
    ];
    rx.parts.tc1 = TUNE(0.384);
    rx.parts.tc2 = TUNE(0.06);
    return rx;
}

export const BENCHES = {
    'lab-vhf-superhet': VHF_SUPERHET(),
    'lab-skywave': SKYWAVE_RX(),
};
