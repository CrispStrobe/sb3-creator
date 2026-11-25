/**
 * Netlists for the round-7 VHF bench: a folded dipole turned for best
 * reception, read on a tuned field-strength meter. Written by
 * `node scripts/gen-lab-circuits-4.mjs --set=r7vhf`.
 *
 * Same shape as lab-benches-rf.mjs: pure data, so
 * test/lab-circuits-r7vhf.test.mjs names parts by role. The dipole's EMF is
 * the field times its effective length (λ/π) times cos(turn − bearing)
 * (bw-board src/radio.js, `dipole`); its turn is its knob.
 */
import { benchIds } from './lab-benches-4.mjs';
export { benchIds };

const C = (farads) => ['capacitor', { farads }];

export const BENCHES = {
    // A folded dipole on a lath as a field-strength meter: its 300 Ω feeder
    // through 2.2 pF into a VHF tank (air-core coil 0.15 µH ‖ 15 pF, tuned
    // to the station), a germanium diode, 10 nF and a sensitive meter
    // (50 mV full scale, 50 kΩ) as the detector load. The FM station at
    // 98 MHz arrives from the north (bearing 0°): broadside to the dipole at
    // turn 0°, end-on at 90°.
    'lab-dipole-turn': {
        parts: { gnd: ['gnd', {}],
            dp: ['dipole', { heightM: 0.95, ohms: 300, angleDeg: 0, stations: [
                { id: 'fm', name: 'FM 98.0 MHz', hz: 98e6, mod: 'fm', deviationHz: 75e3, fieldVPerM: 0.05, bearingDeg: 0, audio: { type: 'tone', hz: 1000 } },
            ] }], cd: C(2.2e-12),
            l: ['vhf_coil', { henrys: 0.15e-6, q: 80 }], ct: C(15e-12),
            d: ['diode', { part: '1N34A' }], cf: C(10e-9), meter: ['analog_meter', { fullScale: 0.05, ifs: 1e-6 }] },
        nets: [
            ['dp.a', 'cd.a'], ['cd.b', 'l.b', 'ct.a', 'd.anode'], ['d.cathode', 'cf.a', 'meter.a'],
            ['gnd.gnd', 'dp.b', 'l.a', 'ct.b', 'cf.b', 'meter.b'],
        ],
    },
};
