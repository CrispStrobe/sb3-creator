/**
 * Netlists for the depletion-mode dual-gate MOSFET and humidity-comb benches,
 * written by `node scripts/gen-lab-circuits-4.mjs --set=mosfet`.
 *
 * Pure data, like lab-benches-4.mjs, so test/lab-circuits-mosfet.test.mjs can
 * name parts by role. The MOSFET is the engine's `dual_gate_mosfet`: one
 * n-channel under two gates, conducting at zero gate voltage and pinched off
 * by either gate taken about 1.2 V below its source.
 *
 * A depletion MOSFET needs its gate BELOW its source to switch off, and these
 * benches have only one 9 V battery. So each source sits on a red LED
 * (lifted to its ~1.75 V forward voltage, kept lit by a 2.2 kΩ bleed): a gate
 * at 0 V is then 1.75 V below the source, past pinch-off, and a gate tied to
 * the source is the zero-gate-voltage case.
 */
export { benchIds } from './lab-benches-4.mjs';

const SUP = { pos: 'bat.pos', neg: 'bat.neg' };
const R = (ohms) => ['resistor', { ohms }];
const C = (farads) => ['capacitor', { farads }];
const LED = (color) => ['led', { color }];
const BAT9 = ['vsource', { volts: 9, variant: '9v' }];
const MOS = ['dual_gate_mosfet', { vp: -1.2, k: 0.005 }];

export const BENCHES = {
    // The channel as the lower leg of a divider: 4.7 kΩ from +9 V to the
    // drain, the source on the red reference LED. Gate 2 is held at +9 V
    // (out of the way); gate 1 comes through 100 kΩ from a 10 kΩ pot that
    // spans ground to the source, so its whole travel is the useful range,
    // from 1.7 V below the source (pinched) to zero gate voltage. The button
    // ties gate 1 straight to the source. The voltmeter reads the drain
    // against the source.
    'lab-mosfet-vcr': {
        vcc: 9, supply: SUP,
        parts: { bat: BAT9, rt: R(4700), q: MOS, pot: ['potentiometer', { ohms: 10000, position: 0.5 }],
            rg: R(100000), zero: ['button', {}], rb: R(2200), ref: LED('red'), vm: ['voltmeter', {}] },
        nets: [
            ['bat.pos', 'rt.a', 'q.gate2', 'rb.a'],
            ['rt.b', 'q.drain', 'vm.a'],
            ['pot.wiper', 'rg.a'], ['rg.b', 'q.gate1', 'zero.a'],
            ['q.source', 'rb.b', 'ref.anode', 'zero.b', 'vm.b', 'pot.a'],
            ['bat.neg', 'pot.b', 'ref.cathode'],
        ],
    },

    // Two gates, one channel: a green LED (470 Ω) in the drain, the source
    // on the red reference LED. Each gate has its own slide switch: left
    // (a) = +9 V, right (b) = 0 V, i.e. below the source. The green LED is lit
    // only while BOTH gates are up.
    'lab-dual-gate': {
        vcc: 9, supply: SUP,
        parts: { bat: BAT9, rd: R(470), sig: LED('green'), q: MOS,
            s1: ['slide_switch', { position: 0 }], s2: ['slide_switch', { position: 0 }],
            rb: R(2200), ref: LED('red') },
        nets: [
            ['bat.pos', 'rd.a', 's1.a', 's2.a', 'rb.a'],
            ['rd.b', 'sig.anode'], ['sig.cathode', 'q.drain'],
            ['s1.com', 'q.gate1'], ['s2.com', 'q.gate2'],
            ['q.source', 'rb.b', 'ref.anode'],
            ['bat.neg', 's1.b', 's2.b', 'ref.cathode'],
        ],
    },

    // The humidity comb from +9 V to gate 1, 100 kΩ from gate 1 to ground:
    // in room air the comb is ~10 MΩ, the gate sits near 0.1 V, 1.6 V below
    // the source, and the channel is pinched. Breath (~90 % RH) brings the
    // comb down to kilohms, the gate up to the rail, and the green LED on.
    'lab-humidity-comb': {
        vcc: 9, supply: SUP,
        parts: { bat: BAT9, comb: ['humidity_comb', { humidity: 50 }], rg: R(100000),
            rd: R(470), sig: LED('green'), q: MOS, rb: R(2200), ref: LED('red') },
        nets: [
            ['bat.pos', 'comb.a', 'rd.a', 'q.gate2', 'rb.a'],
            ['comb.b', 'rg.a', 'q.gate1'],
            ['rd.b', 'sig.anode'], ['sig.cathode', 'q.drain'],
            ['q.source', 'rb.b', 'ref.anode'],
            ['bat.neg', 'rg.b', 'ref.cathode'],
        ],
    },

    // Volume by button taps. A 555 astable (1 kΩ, 10 kΩ, 150 nF: about 460 Hz)
    // sends its square wave through 100 nF and 10 kΩ to the volume node; the
    // MOSFET channel shunts that node to its source on the red reference LED
    // (a few ohms for the tone: the LED is lit). The drain has no DC path but
    // the channel, so it sits at the source's DC level and the channel only
    // ever sees the tone: a voltage-controlled resistor. The integrator (half an LM358, 1 µF from output
    // to −IN, +IN at half supply) drives gate 1: "softer" pulls −IN to ground
    // through 47 kΩ and the output ramps UP (the channel conducts, the node
    // is shunted), "louder" pulls −IN to +9 V and the output ramps DOWN (the
    // channel pinches, the tone passes). Between taps the capacitor holds the
    // setting. The earphone listens at the volume node through 1 µF.
    'lab-button-volume': {
        vcc: 9, supply: SUP,
        parts: { bat: BAT9, osc: ['timer_555', {}], r1: R(1000), r2: R(10000), ct: C(150e-9), cc: C(10e-9),
            cin: C(100e-9), rin: R(10000), q: MOS, rb: R(2200), ref: LED('red'),
            u: ['lm358', {}], ra: R(10000), rbm: R(10000), ci: C(1e-6),
            soft: ['button', {}], rsoft: R(47000), loud: ['button', {}], rloud: R(47000),
            cout: C(1e-6), ep: ['earphone', { type: 'crystal' }] },
        nets: [
            ['bat.pos', 'osc.vcc', 'osc.reset', 'r1.a', 'q.gate2', 'rb.a', 'u.vcc', 'ra.a', 'loud.a'],
            ['r1.b', 'osc.discharge', 'r2.a'], ['r2.b', 'osc.threshold', 'osc.trigger', 'ct.a'],
            ['osc.control', 'cc.a'],
            ['osc.output', 'cin.a'], ['cin.b', 'rin.a'],
            ['rin.b', 'q.drain', 'cout.a'], ['cout.b', 'ep.a'],
            ['q.source', 'rb.b', 'ref.anode'],
            ['ra.b', 'rbm.a', 'u.1_pos'],
            ['u.1_neg', 'ci.a', 'rsoft.a', 'rloud.a'], ['u.1_out', 'ci.b', 'q.gate1'],
            ['rsoft.b', 'soft.a'], ['rloud.b', 'loud.b'],
            ['bat.neg', 'osc.gnd', 'ct.b', 'cc.b', 'ref.cathode', 'u.gnd', 'rbm.b', 'soft.b', 'ep.b', 'u.2_pos'],
            ['u.2_neg', 'u.2_out'],
        ],
    },
};
