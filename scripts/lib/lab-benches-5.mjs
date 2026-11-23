/**
 * Netlists for the fifth set of lab-* benches (discrete regenerative
 * circuits: astables, latches, a one-shot), written by
 * `node scripts/gen-lab-circuits-4.mjs --set=5`.
 *
 * Pure data, like lab-benches-4.mjs, so test/lab-circuits-5.test.mjs can name
 * parts by role. These use the engine's default npn/pnp and real
 * electrolytics (`polarized_cap`): no base capacitors to give a latch memory,
 * no stand-in parts.
 */
export { benchIds } from './lab-benches-4.mjs';

const SUP = { pos: 'bat.pos', neg: 'bat.neg' };
const R = (ohms) => ['resistor', { ohms }];
const LED = (color) => ['led', { color }];
const NPN = ['npn', {}];
const PNP = ['pnp', {}];
const ELKO = (farads) => ['polarized_cap', { farads }];
const BAT9 = ['vsource', { volts: 9, variant: '9v' }];

export const BENCHES = {
    // Two-transistor astable. Each collector drives the other base through an
    // electrolytic (+ at the collector); each base is pulled up through its
    // own timing resistor. Q1's timing resistor is 10 k plus a 100 k rheostat
    // so one half-period can be changed live.
    'lab-astable-blinker': {
        vcc: 9, supply: SUP,
        parts: { bat: BAT9, q1: NPN, q2: NPN,
            rc1: R(470), l1: LED('red'), rc2: R(470), l2: LED('green'),
            rmin: R(10000), pot: ['potentiometer', { ohms: 100000, position: 0.42 }], rb2: R(68000),
            c1: ELKO(10e-6), c2: ELKO(10e-6) },
        // Which transistor wins the power-on race follows the engine's node
        // order, and that follows the layout. Seating the electrolytics first
        // keeps Q1 the winner, as EXPECTED.md's t = 1 ms block says.
        layoutOrder: ['c1', 'c2'],
        nets: [
            ['bat.pos', 'rc1.a', 'rc2.a', 'rmin.a', 'rb2.a'],
            ['rc1.b', 'l1.anode'], ['l1.cathode', 'q1.collector', 'c1.pos'],
            ['rc2.b', 'l2.anode'], ['l2.cathode', 'q2.collector', 'c2.pos'],
            ['c1.neg', 'q2.base', 'rb2.b'],
            ['rmin.b', 'pot.a'], ['pot.wiper', 'pot.b', 'c2.neg', 'q1.base'],
            ['bat.neg', 'q1.emitter', 'q2.emitter'],
        ],
    },

    // The same astable as a tone generator. A Morse key feeds the whole
    // oscillator; a piezo earpiece sits across Q2's collector resistor. Two
    // slide switches choose the coupling capacitors: 10 nF (a tone) or
    // 4.7 µF electrolytics (a metronome).
    'lab-astable-tone': {
        vcc: 9, supply: SUP,
        parts: { bat: BAT9, key: ['button', {}], q1: NPN, q2: NPN,
            rc1: R(1000), led: LED('yellow'), rc2: R(1000), spk: ['piezo', {}],
            rb1: R(47000), rb2: R(56000),
            s1: ['slide_switch', { position: 0 }], s2: ['slide_switch', { position: 0 }],
            ct1: ['capacitor', { farads: 10e-9 }], ct2: ['capacitor', { farads: 10e-9 }],
            cm1: ELKO(4.7e-6), cm2: ELKO(4.7e-6) },
        nets: [
            ['bat.pos', 'key.a'],
            ['key.b', 'rc1.a', 'rc2.a', 'spk.a', 'rb1.a', 'rb2.a'],
            ['rc1.b', 'led.anode'], ['led.cathode', 'q1.collector', 's1.com'],
            ['rc2.b', 'spk.b', 'q2.collector', 's2.com'],
            ['s1.a', 'ct1.a'], ['s1.b', 'cm1.pos'], ['ct1.b', 'cm1.neg', 'q2.base', 'rb2.b'],
            ['s2.a', 'ct2.a'], ['s2.b', 'cm2.pos'], ['ct2.b', 'cm2.neg', 'q1.base', 'rb1.b'],
            ['bat.neg', 'q1.emitter', 'q2.emitter'],
        ],
    },

    // A thyristor from a PNP and an NPN: each collector feeds the other's
    // base. The load (1 k + red LED) runs from the main switch to the anode;
    // the gate button sends a short base current into the NPN. The LED is the
    // only load (the 22 k resistive helper load went with bw-board e339fcb,
    // which converges on the dark-LED anode).
    'lab-scr-pair': {
        vcc: 9, supply: SUP,
        parts: { bat: BAT9, main: ['slide_switch', { position: 1 }], rl: R(1000), led: LED('red'),
            qp: PNP, qn: NPN, rak: R(22000), rgk: R(10000), gate: ['button', {}], rg: R(10000) },
        nets: [
            ['bat.pos', 'main.com', 'gate.a'], ['main.b', 'rl.a'], ['rl.b', 'led.anode'],
            ['led.cathode', 'qp.emitter', 'rak.a'],
            ['qp.base', 'rak.b', 'qn.collector'],
            ['qp.collector', 'qn.base', 'rgk.a', 'rg.b'], ['gate.b', 'rg.a'],
            ['bat.neg', 'qn.emitter', 'rgk.b'],
        ],
        open: ['main.a'],
    },

    // Push on, push off. A flip-flop (22 k / 27 k cross feeds) plus a 1 µF
    // steering electrolytic that follows Q1's collector through 470 k. Either
    // button connects it to Q1's base: if Q1 is off the capacitor is charged
    // and switches it on; if Q1 is on the capacitor is empty and switches it
    // off.
    'lab-toggle-flip-flop': {
        vcc: 9, supply: SUP,
        parts: { bat: BAT9, q1: NPN, q2: NPN,
            rc1: R(1000), red: LED('red'), rc2: R(1000), green: LED('green'),
            x1: R(22000), x2: R(27000), rs: R(470000), cs: ELKO(4.7e-6),
            b1: ['button', {}], b2: ['button', {}] },
        nets: [
            ['bat.pos', 'rc1.a', 'rc2.a'],
            ['rc1.b', 'red.anode'], ['red.cathode', 'q1.collector', 'x1.a', 'rs.a'],
            ['rc2.b', 'green.anode'], ['green.cathode', 'q2.collector', 'x2.a'],
            ['x1.b', 'q2.base'], ['x2.b', 'q1.base', 'b1.a', 'b2.a'],
            ['rs.b', 'cs.pos', 'b1.b', 'b2.b'],
            ['bat.neg', 'q1.emitter', 'q2.emitter', 'cs.neg'],
        ],
    },

    // A home-made unijunction: PNP + NPN latch whose trigger point is the
    // PNP base, held by a 4.7 k / 47 k divider at 91 % of the supply. The
    // electrolytic charges through 22 k plus a 220 k rheostat; when it passes
    // the trigger point the pair fires and dumps it through the LED. The 1 k
    // from the NPN emitter to ground keeps that node defined while the LED is
    // dark (the solve fails on a node held only by an unlit LED).
    'lab-pnp-npn-relax': {
        vcc: 9, supply: SUP,
        parts: { bat: BAT9, rmin: R(22000), pot: ['potentiometer', { ohms: 220000, position: 0.5 }],
            ct: ELKO(4.7e-6), qp: PNP, qn: NPN, rd1: R(1000), rd2: R(2200), rbe: R(100000),
            led: LED('red'), rs: R(47), re: R(1000) },
        nets: [
            ['bat.pos', 'rmin.a', 'rd1.a'], ['rmin.b', 'pot.a'],
            ['pot.wiper', 'pot.b', 'ct.pos', 'qp.emitter'],
            ['rd1.b', 'rd2.a', 'qp.base', 'qn.collector'],
            ['qp.collector', 'qn.base', 'rbe.a'], ['qn.emitter', 'rbe.b', 'led.anode', 're.a'],
            ['led.cathode', 'rs.a'],
            ['bat.neg', 'ct.neg', 'rd2.b', 'rs.b', 're.b'],
        ],
    },

    // A slow two-LED astable steers a 555 tone. When Q2 conducts (green), its
    // collector pulls the 555's control voltage down through a diode and a
    // 10 k rheostat and the pitch jumps up; when Q2 is off the diode blocks.
    'lab-siren-blinker': {
        vcc: 9, supply: SUP,
        parts: { bat: BAT9, q1: NPN, q2: NPN,
            rc1: R(470), l1: LED('red'), rc2: R(470), l2: LED('green'),
            rb1: R(47000), rb2: R(56000), c1: ELKO(4.7e-6), c2: ELKO(4.7e-6),
            u: ['timer_555', {}], r1: R(1000), r2: R(10000), ct: ['capacitor', { farads: 220e-9 }],
            pot: ['potentiometer', { ohms: 10000, position: 0.5 }], d: ['diode', {}],
            rp: R(220), spk: ['piezo', {}] },
        nets: [
            ['bat.pos', 'rc1.a', 'rc2.a', 'rb1.a', 'rb2.a', 'u.vcc', 'u.reset', 'r1.a'],
            ['rc1.b', 'l1.anode'], ['l1.cathode', 'q1.collector', 'c1.pos'],
            ['rc2.b', 'l2.anode'], ['l2.cathode', 'q2.collector', 'c2.pos', 'd.cathode'],
            ['c1.neg', 'q2.base', 'rb2.b'], ['c2.neg', 'q1.base', 'rb1.b'],
            ['r1.b', 'u.discharge', 'r2.a'], ['r2.b', 'u.threshold', 'u.trigger', 'ct.a'],
            ['u.control', 'pot.a'], ['pot.wiper', 'pot.b', 'd.anode'],
            ['u.output', 'rp.a'], ['rp.b', 'spk.a'],
            ['bat.neg', 'q1.emitter', 'q2.emitter', 'u.gnd', 'ct.b', 'spk.b'],
        ],
    },

    // Discrete one-shot. An emitter-coupled pair (shared 330 Ω) makes a
    // Schmitt trigger: Q1 (red) conducts while the timing node is above about
    // 2.5 V; when it is below, Q2 (green) conducts. The button empties the
    // 47 µF timing electrolytic; after release it refills through 220 k and
    // red takes over again.
    'lab-discrete-monostable': {
        vcc: 9, supply: SUP,
        parts: { bat: BAT9, rt: R(100000), ct: ELKO(100e-6), go: ['button', {}], rdis: R(100),
            rb: R(4700), q1: NPN, q2: NPN, rc1: R(1000), red: LED('red'), rx: R(47000),
            rc2: R(1000), green: LED('green'), re: R(330) },
        nets: [
            ['bat.pos', 'rt.a', 'rc1.a', 'rc2.a'],
            ['rt.b', 'ct.pos', 'rb.a', 'go.a'], ['go.b', 'rdis.a'], ['rb.b', 'q1.base'],
            ['rc1.b', 'red.anode'], ['red.cathode', 'q1.collector', 'rx.a'], ['rx.b', 'q2.base'],
            ['rc2.b', 'green.anode'], ['green.cathode', 'q2.collector'],
            ['q1.emitter', 'q2.emitter', 're.a'],
            ['bat.neg', 'ct.neg', 'rdis.b', 're.b'],
        ],
    },
};
