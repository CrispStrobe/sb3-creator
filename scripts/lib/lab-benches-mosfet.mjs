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
    // Depletion mode as a constant-current source: both gates tied straight
    // to the source, no resistor anywhere, a green LED in the drain lead and
    // a red LED in the source lead. The channel at zero gate voltage passes
    // its saturation current whatever the supply (the battery is adjustable),
    // and both LEDs carry the same current wherever they sit in the loop.
    'lab-mosfet-current-source': {
        vcc: 9, supply: SUP,
        parts: { bat: BAT9, top: LED('green'), q: MOS, bot: LED('red') },
        nets: [
            ['bat.pos', 'top.anode'], ['top.cathode', 'q.drain'],
            ['q.source', 'q.gate1', 'q.gate2', 'bot.anode'],
            ['bat.neg', 'bot.cathode'],
        ],
    },

    // A gate swept from negative to positive: the source sits on a red
    // reference LED (2.2 kΩ from +9 V keeps it lit, ~1.7 V), a green LED with
    // 470 Ω in the drain. Gate 2 is held at +9 V. Gate 1 comes through
    // 100 kΩ from a 10 kΩ pot fed through 15 kΩ (0 to 3.6 V), so its travel runs from
    // 1.7 V below the source (pinched, dark) through zero (the button ties
    // gate 1 to the source) to well above it (full). A voltmeter reads the
    // gate against the source.
    'lab-mosfet-vcr': {
        vcc: 9, supply: SUP,
        parts: { bat: BAT9, rd: R(470), sig: LED('green'), q: MOS, pot: ['potentiometer', { ohms: 10000, position: 0.4 }],
            rp: R(15000), rg: R(100000), zero: ['button', {}], rb: R(2200), ref: LED('red'), vm: ['voltmeter', {}] },
        nets: [
            ['bat.pos', 'rd.a', 'q.gate2', 'rb.a', 'rp.a'], ['rp.b', 'pot.a'],
            ['rd.b', 'sig.anode'], ['sig.cathode', 'q.drain'],
            ['pot.wiper', 'rg.a'], ['rg.b', 'q.gate1', 'zero.a', 'vm.a'],
            ['q.source', 'rb.b', 'ref.anode', 'zero.b', 'vm.b'],
            ['bat.neg', 'pot.b', 'ref.cathode'],
        ],
    },

    // Two gates, one channel: a green LED (470 Ω) in the drain, the source
    // on the red reference LED (~1.8 V). Each gate has its own 10 kΩ pot, fed
    // through 15 kΩ from +9 V (0 to 3.6 V), and its own button that grounds
    // it, i.e. takes it about 1.8 V below the source.
    'lab-dual-gate': {
        vcc: 9, supply: SUP,
        parts: { bat: BAT9, rd: R(470), sig: LED('green'), q: MOS,
            r1: R(15000), p1: ['potentiometer', { ohms: 10000, position: 1 }], b1: ['button', {}],
            r2: R(15000), p2: ['potentiometer', { ohms: 10000, position: 1 }], b2: ['button', {}],
            rb: R(2200), ref: LED('red') },
        nets: [
            ['bat.pos', 'rd.a', 'r1.a', 'r2.a', 'rb.a'],
            ['rd.b', 'sig.anode'], ['sig.cathode', 'q.drain'],
            ['r1.b', 'p1.a'], ['p1.wiper', 'q.gate1', 'b1.a'],
            ['r2.b', 'p2.a'], ['p2.wiper', 'q.gate2', 'b2.a'],
            ['q.source', 'rb.b', 'ref.anode'],
            ['bat.neg', 'p1.b', 'p2.b', 'b1.b', 'b2.b', 'ref.cathode'],
        ],
    },

    // One dual-gate MOSFET as a NAND gate. The red LED sits ACROSS the
    // channel (drain to source), fed through 1 kΩ from +9 V; the source on a
    // yellow reference LED (2.2 kΩ bleed). Each gate is pulled to ground by
    // 100 kΩ (below the source: pinched) and a button lifts it to +9 V. Only
    // with both buttons pressed does the channel conduct and short the red
    // LED out.
    'lab-mosfet-nand': {
        vcc: 9, supply: SUP,
        parts: { bat: BAT9, rl: R(1000), out: LED('red'), q: MOS,
            a: ['button', {}], ra: R(100000), b: ['button', {}], rbt: R(100000),
            rb: R(2200), ref: LED('yellow') },
        nets: [
            ['bat.pos', 'rl.a', 'a.a', 'b.a', 'rb.a'],
            ['rl.b', 'out.anode', 'q.drain'],
            ['a.b', 'ra.a', 'q.gate1'], ['b.b', 'rbt.a', 'q.gate2'],
            ['q.source', 'out.cathode', 'rb.b', 'ref.anode'],
            ['bat.neg', 'ra.b', 'rbt.b', 'ref.cathode'],
        ],
    },

    // The humidity comb from +9 V to gate 1, 100 kΩ from gate 1 to ground:
    // in room air the comb is ~10 MΩ, the gate sits near 0.1 V, 1.6 V below
    // the source, and the channel is pinched. Breath (~90 % RH) brings the
    // comb down to kilohms, the gate up to the rail, and the green LED on.
    // A 1 kΩ rheostat under the reference LED lifts the source further: the
    // gate must climb higher before the channel opens, so the knob sets the
    // humidity at which the LED responds.
    'lab-humidity-comb': {
        vcc: 9, supply: SUP,
        parts: { bat: BAT9, comb: ['humidity_comb', { humidity: 50 }], rg: R(100000),
            rd: R(470), sig: LED('green'), q: MOS, rb: R(2200), ref: LED('red'),
            set: ['potentiometer', { ohms: 1000, position: 1 }] },
        nets: [
            ['bat.pos', 'comb.a', 'rd.a', 'q.gate2', 'rb.a'],
            ['comb.b', 'rg.a', 'q.gate1'],
            ['rd.b', 'sig.anode'], ['sig.cathode', 'q.drain'],
            ['q.source', 'rb.b', 'ref.anode'],
            ['ref.cathode', 'set.a'],
            ['bat.neg', 'rg.b', 'set.wiper', 'set.b'],
        ],
    },

    // Volume by button taps, all on one quad op-amp (LM324). Section 2 is a
    // relaxation oscillator (10 kΩ and 150 nF to its −IN, thresholds at a
    // third and two thirds of the supply by three 100 kΩ resistors on +IN):
    // a square wave of a few hundred hertz. It reaches the volume node through
    // 100 nF and 10 kΩ. The MOSFET channel shunts that node to its source on
    // the red reference LED (a few ohms for the tone: the LED is lit). The
    // drain has no DC path but the channel, so it sits at the source's DC
    // level and the channel only ever sees the tone: a voltage-controlled
    // resistor. Section 1 is the integrator (1 µF from output to −IN, +IN at
    // half supply) driving gate 1: "softer" pulls −IN to ground through
    // 47 kΩ and the output ramps UP (the channel conducts, the node is
    // shunted), "louder" pulls −IN to +9 V and the output ramps DOWN (the
    // channel pinches, the tone passes). Between taps the capacitor holds the
    // setting. The earphone listens at the volume node through 1 µF.
    // Sections 3 and 4 are parked as grounded followers.
    'lab-button-volume': {
        vcc: 9, supply: SUP,
        parts: { bat: BAT9, u: ['lm324', {}],
            ro: R(10000), co: C(150e-9), h1: R(100000), h2: R(100000), h3: R(100000),
            cin: C(100e-9), rin: R(10000), q: MOS, rb: R(2200), ref: LED('red'),
            ra: R(10000), rbm: R(10000), ci: C(1e-6),
            soft: ['button', {}], rsoft: R(47000), loud: ['button', {}], rloud: R(47000),
            cout: C(1e-6), ep: ['earphone', { type: 'crystal' }] },
        nets: [
            ['bat.pos', 'u.vcc', 'h1.a', 'q.gate2', 'rb.a', 'ra.a', 'loud.a'],
            ['u.2_out', 'ro.a', 'h3.a', 'cin.a'], ['ro.b', 'co.a', 'u.2_neg'],
            ['h1.b', 'h2.a', 'h3.b', 'u.2_pos'],
            ['cin.b', 'rin.a'],
            ['rin.b', 'q.drain', 'cout.a'], ['cout.b', 'ep.a'],
            ['q.source', 'rb.b', 'ref.anode'],
            ['ra.b', 'rbm.a', 'u.1_pos'],
            ['u.1_neg', 'ci.a', 'rsoft.a', 'rloud.a'], ['u.1_out', 'ci.b', 'q.gate1'],
            ['rsoft.b', 'soft.a'], ['rloud.b', 'loud.b'],
            ['bat.neg', 'u.gnd', 'co.b', 'h2.b', 'ref.cathode', 'rbm.b', 'soft.b', 'ep.b', 'u.3_pos', 'u.4_pos'],
            ['u.3_neg', 'u.3_out'], ['u.4_neg', 'u.4_out'],
        ],
    },

    // Hygrometer: the humidity comb into an op-amp stage read on a meter
    // (LM324). Section 2 buffers half the supply (10 kΩ / 10 kΩ) as the
    // reference. Section 1 is an inverting stage: the comb from +9 V into its
    // −IN, +IN on the reference, feedback 100 kΩ plus a 1 MΩ gain rheostat.
    // Its output falls below the reference by 4.5 V × R_f / R_comb, which the
    // 5 V moving-coil meter (reference to output) shows. The comb's
    // conductance rises tenfold every 12 % RH, so the gain knob picks the
    // humidity range the meter spans.
    'lab-hygrometer': {
        vcc: 9, supply: SUP,
        parts: { bat: BAT9, u: ['lm324', {}], ra: R(10000), rbm: R(10000),
            comb: ['humidity_comb', { humidity: 50 }], rf: R(100000), gain: ['potentiometer', { ohms: 1000000, position: 0.5 }],
            meter: ['analog_meter', { fullScale: 5, ifs: 0.0001 }] },
        nets: [
            ['bat.pos', 'u.vcc', 'ra.a', 'comb.a'],
            ['ra.b', 'rbm.a', 'u.2_pos'], ['u.2_neg', 'u.2_out', 'u.1_pos', 'meter.a'],
            ['comb.b', 'u.1_neg', 'rf.a'], ['rf.b', 'gain.a'], ['gain.wiper', 'gain.b', 'u.1_out', 'meter.b'],
            ['bat.neg', 'u.gnd', 'rbm.b', 'u.3_pos', 'u.4_pos'],
            ['u.3_neg', 'u.3_out'], ['u.4_neg', 'u.4_out'],
        ],
    },
};
