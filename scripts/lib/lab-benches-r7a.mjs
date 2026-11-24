/**
 * Netlists for the r7a lab benches: a loudspeaker on a battery, switched
 * filters on an amp-IC oscillator, a one-transistor preamp ahead of the
 * amp IC (speaker as microphone, earphone feedback, an untuned ferrite-rod
 * pickup, a two-winding audio link), induction pulses from a dropped magnet
 * and from a capacitor dumped into a winding driving amplifiers, a
 * monostable and a flip-flop, and a junction threshold tester whose
 * reference is a second transistor's base–emitter junction. Written by
 * `node scripts/gen-lab-circuits-4.mjs --set=r7a`.
 *
 * Same shape as lab-benches-8.mjs: pure data, so test/lab-circuits-r7a.test.mjs
 * names parts by role. Ids follow benchIds (breadboard first, then the parts
 * in the order listed). A param written '@name' is resolved to that part's
 * engine id below.
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
const LM386 = ['lm386', {}];
const SW = ['slide_switch', { position: 0 }];

export const BENCHES = {
    // A loudspeaker straight on a 4.5 V battery through a push button and
    // 22 Ω (to spare the coil). Two slide switches, thrown together, swap
    // the speaker's leads: a reversing switch. The ammeter in series shows
    // which way the current flows, and with it which way the cone is pushed.
    // While the button is held the current is steady: the cone stays out
    // (or in) and is silent; only pressing and releasing make a click.
    'lab-speaker-click': {
        vcc: 4.5, supply: SUP,
        parts: { bat: ['vsource', { volts: 4.5 }], btn: ['button', {}], rs: R(22),
            swa: SW, swb: SW, am: ['ammeter', {}], spk: ['speaker', { ohms: 8 }] },
        nets: [
            ['bat.pos', 'btn.a'], ['btn.b', 'rs.a'], ['rs.b', 'swa.a', 'swb.b'],
            ['swa.com', 'am.a'], ['am.b', 'spk.a'], ['spk.b', 'swb.com'],
            ['bat.neg', 'swa.b', 'swb.a'],
        ],
    },

    // The amp-IC square-wave oscillator (lab-amp-horn's: LM386, 47 nF from
    // the output back to +IN, 22 kΩ to ground) drives the loudspeaker through
    // 100 µF and 47 Ω. Button "bright" puts 22 µF across the 47 Ω: the
    // resistor is bypassed for the fast edges, which now reach the speaker
    // with their full strength (a high-pass path). Button "soft" puts 220 µF
    // across the speaker: the edges are shorted and rounded (a low-pass with
    // the 47 Ω). The pitch stays where it is; only the sound changes.
    'lab-amp-timbre': {
        vcc: 9, supply: SUP,
        parts: { bat: BAT9, u: LM386, cf: C(47e-9), rb: R(22000), co: EL(100e-6), rser: R(47),
            bright: ['button', {}], ch: EL(22e-6), soft: ['button', {}], cl: EL(220e-6),
            spk: ['speaker', { ohms: 8 }], scope: ['oscilloscope', {}] },
        nets: [
            ['bat.pos', 'u.vs'],
            ['u.vout', 'cf.a', 'co.pos'], ['cf.b', 'u.inp', 'rb.a'],
            ['co.neg', 'rser.a', 'bright.a', 'scope.ch1'], ['bright.b', 'ch.pos'],
            ['rser.b', 'ch.neg', 'spk.a', 'soft.a', 'scope.ch2'], ['soft.b', 'cl.pos'],
            ['bat.neg', 'u.gnd', 'u.inn', 'rb.b', 'spk.b', 'cl.neg', 'scope.gnd'],
        ],
        open: ['u.gain1', 'u.gain8', 'u.bypass'],
    },

    // Microphone amplifier. A loudspeaker is the microphone (it hears the
    // learner's voice: soundDb). 10 µF couples its fraction of a millivolt
    // into a one-transistor preamp: common emitter, 4.7 kΩ collector load,
    // biased by 470 kΩ from its own collector (the feedback keeps the
    // collector near 2–3 V whatever the transistor's gain). 1 µF takes the
    // amplified signal to a 10 kΩ volume pot, whose wiper feeds the LM386
    // (gain 20). The amplifier drives the earphone through 100 µF.
    'lab-mic-preamp': {
        vcc: 9, supply: SUP,
        parts: { bat: BAT9, mic: ['speaker', { ohms: 8, soundDb: 80, soundWave: 'voice' }], ci: C(220e-9),
            rf: R(470000), rc: R(4700), q: NPN, ck: EL(1e-6), vol: POT(10000, 1),
            u: LM386, co: EL(100e-6), ep: ['earphone', { type: 'magnetic', ohms: 2000, henrys: 0.1 }],
            cs: EL(100e-6) },
        nets: [
            ['mic.a', 'ci.a'], ['ci.b', 'q.base', 'rf.a'], ['q.collector', 'rf.b', 'rc.a', 'ck.pos'],
            ['ck.neg', 'vol.a'], ['vol.wiper', 'u.inp'],
            ['u.vout', 'co.pos'], ['co.neg', 'ep.a'],
            ['bat.pos', 'rc.b', 'u.vs', 'cs.pos'],
            ['bat.neg', 'mic.b', 'q.emitter', 'vol.b', 'u.gnd', 'u.inn', 'ep.b', 'cs.neg'],
        ],
        open: ['u.gain1', 'u.gain8', 'u.bypass'],
    },

    // The same preamp and amp IC turned round: a magnetic earphone is the
    // microphone and the loudspeaker the output. The earphone hears the
    // speaker from distanceCm. The volume pot between preamp and amp IC sets
    // the loop gain: close and loud, the loop howls by itself.
    'lab-preamp-howl': {
        vcc: 9, supply: SUP,
        parts: { bat: BAT9, ep: ['earphone', { type: 'magnetic', ohms: 2000, henrys: 0.1, hears: '@spk', distanceCm: 5 }], ci: C(220e-9),
            rf: R(470000), rc: R(4700), q: NPN, re: R(100), ck: EL(1e-6), vol: POT(10000, 1),
            u: LM386, co: EL(220e-6), spk: ['speaker', { ohms: 8 }], cs: EL(100e-6) },
        nets: [
            ['ep.a', 'ci.a'], ['ci.b', 'q.base', 'rf.a'], ['q.collector', 'rf.b', 'rc.a', 'ck.pos'], ['q.emitter', 're.a'],
            ['ck.neg', 'vol.a'], ['vol.wiper', 'u.inp'],
            ['u.vout', 'co.pos'], ['co.neg', 'spk.a'],
            ['bat.pos', 'rc.b', 'u.vs', 'cs.pos'],
            ['bat.neg', 'ep.b', 're.b', 'vol.b', 'u.gnd', 'u.inn', 'spk.b', 'cs.neg'],
        ],
        open: ['u.gain1', 'u.gain8', 'u.bypass'],
    },

    // An untuned ferrite rod on the preamp: its 250 µH main winding, one end
    // grounded, couples through 10 nF into the base of the one-transistor
    // preamp (collector feedback bias as above). Nothing is tuned, so every
    // station the rod picks up swings the base, and the base–emitter
    // junction rectifies them all at once: their programmes come out of the
    // collector mixed together. The slide switch puts 4.7 nF from the base to
    // ground: a short for the carriers (34 Ω at 1 MHz) that leaves the audio
    // alone, and the stations are gone. The field probe is the learner's hand
    // cupped round the rod (up to 150 pF through paper): the body carries the room's
    // mains hum, which the base picks up as a 50 Hz drone. The LM386 (gain
    // 20) drives the speaker; an LED on the output through 100 µF and 470 Ω
    // (a diode across it for the other half-wave) flickers with the level.
    'lab-rod-pickup': {
        vcc: 9, supply: SUP,
        parts: { bat: BAT9, l: ['ferrite_coil', {}], cc: C(10e-9), sw: SW, cr: C(4.7e-9),
            hand: ['field_probe', { source: 'body', contact: 'paper', paperFarads: 150e-12, position: 0 }],
            rf: R(470000), rc: R(4700), q: NPN, ck: EL(1e-6), vol: POT(10000, 1),
            u: LM386, co: EL(220e-6), spk: ['speaker', { ohms: 8 }], cl: EL(100e-6), rl: R(470), led: LED('red'),
            dl: ['diode', { part: '1N4148' }], cs: EL(100e-6) },
        nets: [
            ['l.b', 'cc.a'], ['cc.b', 'q.base', 'rf.a', 'sw.com', 'hand.a'], ['sw.b', 'cr.a'],
            ['q.collector', 'rf.b', 'rc.a', 'ck.pos'], ['ck.neg', 'vol.a'], ['vol.wiper', 'u.inp'],
            ['u.vout', 'co.pos', 'cl.pos'], ['co.neg', 'spk.a'], ['cl.neg', 'rl.a'], ['rl.b', 'led.anode', 'dl.cathode'],
            ['bat.pos', 'rc.b', 'u.vs', 'cs.pos'],
            ['bat.neg', 'l.a', 'cr.b', 'q.emitter', 'vol.b', 'u.gnd', 'u.inn', 'spk.b', 'led.cathode', 'dl.anode', 'cs.neg'],
        ],
        open: ['l.tap', 'l.c1', 'l.c2', 'sw.a', 'u.gain1', 'u.gain8', 'u.bypass'],
    },

    // Faster magnet, bigger pulse. Two identical 500-turn coils; a magnet
    // falls through each, from 2 cm above the first (it is still slow when it
    // passes) and from 40 cm above the second (four and a half times faster).
    // The slide switch puts one of them on the LM386's +IN (gain 20). The
    // output, biased at 4.5 V, kicks a transistor through 10 µF and 4.7 kΩ;
    // the transistor lights the LED, and a diode from ground to its base
    // takes the negative half of each pulse.
    'lab-magnet-speed': {
        vcc: 9, supply: SUP,
        parts: { bat: BAT9,
            slow: ['air_coil', { turns: 500, radiusM: 0.015, lengthM: 0.03, wireMm: 0.2, dropHeightM: 0.02, magnetAm2: 0.05 }],
            fast: ['air_coil', { turns: 500, radiusM: 0.015, lengthM: 0.03, wireMm: 0.2, dropHeightM: 0.4, magnetAm2: 0.05 }],
            sw: SW, u: LM386, ck: EL(2.2e-6), rb: R(10000), dc: ['diode', { part: '1N4148' }], q: NPN,
            rl: R(470), led: LED('red'), cs: EL(100e-6) },
        nets: [
            ['slow.a', 'sw.a'], ['fast.a', 'sw.b'], ['sw.com', 'u.inp'],
            ['u.vout', 'ck.pos'], ['ck.neg', 'rb.a'], ['rb.b', 'q.base', 'dc.cathode'],
            ['rl.b', 'led.anode'], ['led.cathode', 'q.collector'],
            ['bat.pos', 'u.vs', 'rl.a', 'cs.pos'],
            ['bat.neg', 'slow.b', 'fast.b', 'u.gnd', 'u.inn', 'dc.anode', 'q.emitter', 'cs.neg'],
        ],
        open: ['u.gain1', 'u.gain8', 'u.bypass'],
    },

    // A magnet dropped through a coil triggers a two-transistor monostable.
    // At rest Q2 is held on by 47 kΩ from the supply; its collector is low,
    // so Q1 has only what the sensitivity pot gives its base (through
    // 47 kΩ) and stays off. The coil's pulse reaches Q1's base through
    // 1 µF; if pot + pulse open Q1, its collector falls, the 10 µF timing
    // capacitor pulls Q2's base below ground, Q2 lets go and its collector,
    // through 47 kΩ, holds Q1 on: the red LED in Q1's collector is lit until
    // the timing capacitor has recharged through Q2's 47 kΩ (≈ 0.3 s), then
    // the circuit falls back and waits for the next magnet.
    'lab-magnet-monostable': {
        vcc: 9, supply: SUP,
        parts: { bat: BAT9,
            coil: ['air_coil', { turns: 500, radiusM: 0.015, lengthM: 0.03, wireMm: 0.2, dropHeightM: 0.2, magnetAm2: 0.2 }],
            ci: EL(1e-6), rp: R(82000), sens: POT(10000, 0.9), rs: R(22000), q1: NPN, rc1: R(1000), red: LED('red'), ct: EL(10e-6),
            rb2: R(47000), q2: NPN, rc2: R(2200), rfb: R(47000), cs: EL(100e-6) },
        nets: [
            ['coil.a', 'ci.pos'], ['ci.neg', 'q1.base', 'rs.b', 'rfb.b'], ['sens.wiper', 'rs.a'],
            ['rc1.b', 'red.anode'], ['red.cathode', 'q1.collector', 'ct.pos'], ['ct.neg', 'q2.base', 'rb2.b'],
            ['q2.collector', 'rc2.b', 'rfb.a'],
            ['bat.pos', 'rp.a', 'rc1.a', 'rb2.a', 'rc2.a', 'cs.pos'], ['rp.b', 'sens.a'],
            ['bat.neg', 'coil.b', 'sens.b', 'q1.emitter', 'q2.emitter', 'cs.neg'],
        ],
    },

    // Isolated triggering: 100 µF, kept charged through 1 kΩ, is dumped by
    // the "pulse" button into the small winding of a transformer (10 mH,
    // 2.2 Ω for the wire). The large winding (40 mH, twice the turns) is
    // wired to nothing on the battery side but its own ground return; its
    // pulse goes through a diode and 10 kΩ into Q1 of a two-transistor
    // flip-flop (cross-coupled through 22 kΩ, 100 kΩ ‖ 1 µF at Q1's base).
    // At rest Q2 conducts (green). One pulse sets it: red, and it stays red
    // until the reset button grounds Q1's base.
    'lab-pulse-flipflop': {
        vcc: 9, supply: SUP,
        parts: { bat: BAT9, rch: R(1000), cp: EL(100e-6), pulse: ['button', {}], rw: R(2.2),
            t: ['transformer', { l1: 0.01, l2: 0.04, k: 0.9 }], d: ['diode', { part: '1N4148' }], ri: R(10000),
            rp: R(100000), cb: C(1e-6), q1: NPN, q2: NPN, r1: R(1000), red: LED('red'), r2: R(1000), green: LED('green'),
            x1: R(22000), x2: R(22000), reset: ['button', {}] },
        nets: [
            ['bat.pos', 'rch.a', 'r1.a', 'r2.a'], ['rch.b', 'cp.pos', 'pulse.a'], ['pulse.b', 'rw.a'], ['rw.b', 't.p1'],
            ['t.s1', 'd.anode'], ['d.cathode', 'ri.a'], ['ri.b', 'q1.base', 'rp.a', 'cb.a', 'x2.b', 'reset.a'],
            ['r1.b', 'red.anode'], ['red.cathode', 'q1.collector', 'x1.a'],
            ['r2.b', 'green.anode'], ['green.cathode', 'q2.collector', 'x2.a'], ['x1.b', 'q2.base'],
            ['bat.neg', 'cp.neg', 't.p2', 't.s2', 'rp.b', 'cb.b', 'q1.emitter', 'q2.emitter', 'reset.b'],
        ],
    },

    // An audio link through two windings with no wire between them. The
    // generator stands for a radio's loudspeaker output (1 kHz, 20 mV). It
    // drives two identical transformers at once, one into its small winding
    // (10 mH; out of the 40 mH winding: stepped up) and one into its large
    // winding (40 mH; out of the 10 mH winding: stepped down), the windings
    // swapped. The slide switch picks which output goes to the preamp
    // (220 nF in; collector feedback bias; 100 Ω in the emitter for a gain
    // of about 35), the volume pot and the LM386 (gain 20) into the speaker.
    'lab-coil-audio-link': {
        vcc: 9, supply: SUP,
        parts: { bat: BAT9, fg: ['function_gen', { wave: 'sine', freq: 1000, amplitude: 0.01, offset: 0 }],
            up: ['transformer', { l1: 0.01, l2: 0.04, k: 0.9 }], down: ['transformer', { l1: 0.04, l2: 0.01, k: 0.9 }],
            sw: SW, ci: C(220e-9), rf: R(470000), rc: R(4700), q: NPN, re: R(100), ck: EL(1e-6), vol: POT(10000, 0.2),
            u: LM386, co: EL(220e-6), spk: ['speaker', { ohms: 8 }], cs: EL(100e-6) },
        nets: [
            ['fg.out', 'up.p1', 'down.p1'], ['up.s1', 'sw.a'], ['down.s1', 'sw.b'], ['sw.com', 'ci.a'],
            ['ci.b', 'q.base', 'rf.a'], ['q.collector', 'rf.b', 'rc.a', 'ck.pos'], ['q.emitter', 're.a'],
            ['ck.neg', 'vol.a'], ['vol.wiper', 'u.inp'], ['u.vout', 'co.pos'], ['co.neg', 'spk.a'],
            ['bat.pos', 'rc.b', 'u.vs', 'cs.pos'],
            ['bat.neg', 'fg.gnd', 'up.p2', 'down.p2', 'up.s2', 'down.s2', 're.b', 'vol.b', 'u.gnd', 'u.inn', 'spk.b', 'cs.neg'],
        ],
        open: ['u.gain1', 'u.gain8', 'u.bypass'],
    },

    // Junction threshold tester. Q2, collector tied to base and fed through
    // 10 kΩ, is a diode: its base–emitter drop (≈ 0.6 V) is the bottom of
    // the 10 kΩ test pot (22 kΩ above it from the supply). The pot's wiper
    // feeds the indicator transistor Q1 (LED in its collector) through
    // 10 kΩ, directly or through a junction under test picked by three slide
    // switches: a germanium diode, a red LED or a green LED. The voltmeter
    // reads the wiper against the pot's bottom: with the reference switch on
    // "junction" (Q2), Q1's own threshold is already cancelled by Q2's, so
    // the reading where the LED switches on is the junction under test's
    // own threshold (≈ 0 with nothing in between). With the reference switch
    // on "ground" the reading carries Q1's 0.6 V as well. Q1 and Q2 sit side
    // by side (both have a temperature slider): warm both and the
    // compensated reading stays put, the uncompensated one drops 2 mV/K.
    'lab-threshold-tester': {
        vcc: 9, supply: SUP,
        parts: { bat: BAT9, rq2: R(10000), q2: ['npn', { beta: 100, surroundC: 25, thermalTau: 1 }], ref: SW,
            rtop: R(10000), pot: POT(10000, 0), vm: ['voltmeter', {}],
            swd: SW, swj: SW, swl: SW, ge: ['diode', { part: '1N34A' }], lr: LED('red'), lg: LED('green'),
            rb: R(10000), q1: ['npn', { beta: 100, surroundC: 25, thermalTau: 1 }], rl: R(4700), led: LED('yellow') },
        nets: [
            ['bat.pos', 'rq2.a', 'rtop.a', 'rl.a'], ['rq2.b', 'q2.collector', 'q2.base', 'ref.a'],
            ['ref.com', 'pot.b', 'vm.b'], ['rtop.b', 'pot.a'], ['pot.wiper', 'vm.a', 'swd.com'],
            ['swd.a', 'rb.a', 'ge.cathode', 'lr.cathode', 'lg.cathode'], ['swd.b', 'swj.com'],
            ['swj.a', 'ge.anode'], ['swj.b', 'swl.com'], ['swl.a', 'lr.anode'], ['swl.b', 'lg.anode'],
            ['rb.b', 'q1.base'], ['rl.b', 'led.anode'], ['led.cathode', 'q1.collector'],
            ['bat.neg', 'q2.emitter', 'ref.b', 'q1.emitter'],
        ],
    },

    // Depletion-mode dual-gate MOSFET, normally on. Drain to the supply
    // through a red LED and 1 kΩ, source to ground, gate 2 tied to the
    // source. Gate 1 is bare: it sits at the source potential through the
    // "touch" button (a finger bridging gate and source) and otherwise keeps
    // whatever charge it holds. The field probe is a charged fingertip
    // (−50 V, up to 1 pF to the gate) the knob brings towards gate 1: the charge it
    // induces takes the gate below pinch-off and the LED goes out; taken
    // away again, the gate returns to the source potential and the LED
    // lights. The channel conducts with nothing on its gates: that is the
    // depletion mode.
    'lab-depletion-touch': {
        vcc: 9, supply: SUP,
        parts: { bat: BAT9, rl: R(1000), led: LED('red'), m: ['dual_gate_mosfet', {}],
            touch: ['button', {}], comb: ['field_probe', { source: 'charge', rodVolts: -50, position: 0, maxFarads: 1e-12 }] },
        nets: [
            ['bat.pos', 'rl.a'], ['rl.b', 'led.anode'], ['led.cathode', 'm.drain'],
            ['m.gate1', 'touch.a', 'comb.a'],
            ['bat.neg', 'm.source', 'm.gate2', 'touch.b'],
        ],
    },

    // Either gate pinches the channel off. The source is lifted to about
    // 2.9 V by a stiff divider (470 Ω / 220 Ω), so the gates can go below it:
    // each gate has its own 10 kΩ pot across the supply (0–9 V), both set to
    // the source's level (0.36 of the way up) as authored. Drain to the
    // supply through 1 kΩ and a red LED. Turn either pot down by more than
    // the pinch-off voltage (1.2 V) and the LED goes out, whatever the other
    // gate does; with one gate left at the source, the other dims the LED
    // smoothly on the way down.
    'lab-dual-gate-pinch': {
        vcc: 9, supply: SUP,
        parts: { bat: BAT9, rl: R(1000), led: LED('red'), m: ['dual_gate_mosfet', {}],
            rt: R(470), rb: R(220), g1: POT(10000, 0.36), g2: POT(10000, 0.36) },
        nets: [
            ['bat.pos', 'rl.a', 'rt.a', 'g1.a', 'g2.a'], ['rl.b', 'led.anode'], ['led.cathode', 'm.drain'],
            ['rt.b', 'rb.a', 'm.source'], ['g1.wiper', 'm.gate1'], ['g2.wiper', 'm.gate2'],
            ['bat.neg', 'rb.b', 'g1.b', 'g2.b'],
        ],
    },
};

// Resolve '@name' params to engine ids.
for (const b of Object.values(BENCHES)) {
    const ids = benchIds(b);
    for (const [, params] of Object.values(b.parts)) {
        for (const [k, v] of Object.entries(params)) if (typeof v === 'string' && v.startsWith('@')) params[k] = ids[v.slice(1)];
    }
}
