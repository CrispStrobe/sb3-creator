/**
 * Netlists for the r6g lab benches: NPN transistors and an LM386 power
 * amplifier only (no 555, no op-amp, no logic IC), written by
 * `node scripts/gen-lab-circuits-4.mjs --set=r6g`.
 *
 * Same shape as lab-benches-4.mjs: pure data, so
 * test/lab-circuits-r6g.test.mjs names parts by role. Ids follow benchIds
 * (breadboard first, then the parts in the order listed).
 *
 * Two jobs for the LM386 here:
 *
 *   - MICROPHONE AMPLIFIER. A loudspeaker is the microphone (bw-board
 *     src/acoustics.js: 0.5 mV per pascal). 10 µF across the gain pins 1 and
 *     8 sets the chip's gain to 200, so a loud sound's few millivolts become
 *     a swing of a volt or more around half the supply at pin 5: enough to
 *     drive a transistor stage behind it.
 *   - SWITCHING STAGE. With pins 1 and 8 open the output is
 *     Vs/2 + 20·(v+ − v−) inside 0.9 V .. Vs − 0.9 V. A divider from the
 *     output back to +IN gives hysteresis and an RC from the output to −IN
 *     makes a relaxation oscillator. Each input has 50 kΩ to ground inside
 *     the chip, so the timing resistance must stay well below about 29 kΩ or
 *     the capacitor never reaches the upper switching point.
 *
 * Wired as a follower (−IN tied to pin 5) the chip's gain is one: it copies
 * its + input to the speaker with the current a loudspeaker needs.
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
const SLIDE = (position = 0) => ['slide_switch', { position }];
const BTN = ['button', {}];
const D4148 = ['diode', { part: '1N4148' }];
const GE = ['diode', { part: '1N34A' }];
const SPK = ['speaker', { ohms: 8 }];
/**
 * A loudspeaker used as a microphone; as authored the room is quiet. The
 * sound it hears is the engine's default (a sung vowel) unless a scenario
 * picks another waveform.
 */
const MIC = () => ['speaker', { ohms: 8, soundDb: 0 }];

export const BENCHES = {
    // Two-tone horn. Two NPNs cross-coupled through 22 nF (1 kΩ collector
    // resistors, 47 kΩ base resistors) make the tone. The HIGH button puts
    // 47 kΩ beside Q1's base resistor, the slide switch swaps Q2's base
    // resistor from 47 kΩ to 22 kΩ: both shorten a half-period, so both
    // raise the pitch. The LM386 only drives the speaker: −IN tied to its
    // output makes it a follower (gain one), +IN held at about 4.6 V by
    // 47 kΩ from +9 V against the chip's own 50 kΩ, the square wave from Q2's
    // collector brought in through 100 nF and 47 kΩ (about a third of it
    // arrives). Pin 5 drives the speaker through 220 µF.
    'lab-npn-horn-follower': {
        vcc: 9, supply: SUP,
        parts: { bat: BAT9, q1: NPN, q2: NPN, rc1: R(1000), rc2: R(1000), c1: C(22e-9), c2: C(22e-9),
            rb1: R(47000), high: BTN, rh: R(47000), pick: SLIDE(0), rb2a: R(47000), rb2b: R(22000),
            cc: C(100e-9), rin: R(47000), rbias: R(47000), u: LM386, co: EL(220e-6), spk: SPK },
        nets: [
            ['bat.pos', 'rc1.a', 'rc2.a', 'rb1.a', 'high.a', 'pick.com', 'rbias.a', 'u.vs'],
            ['rc1.b', 'q1.collector', 'c1.a'], ['c1.b', 'q2.base', 'rb2a.b', 'rb2b.b'],
            ['pick.a', 'rb2a.a'], ['pick.b', 'rb2b.a'],
            ['rc2.b', 'q2.collector', 'c2.a', 'cc.a'], ['c2.b', 'q1.base', 'rb1.b', 'rh.b'],
            ['high.b', 'rh.a'],
            ['cc.b', 'rin.a'], ['rin.b', 'rbias.b', 'u.inp'],
            ['u.vout', 'u.inn', 'co.pos'], ['co.neg', 'spk.a'],
            ['bat.neg', 'q1.emitter', 'q2.emitter', 'u.gnd', 'spk.b'],
        ],
        open: ['u.gain1', 'u.gain8', 'u.bypass'],
    },

    // Light organ. A loudspeaker hears the music. Slide switch left: it feeds
    // +IN of the LM386 directly (gain 200). Right: a transistor preamp comes
    // first (Q1, 10 kΩ collector resistor, 1 MΩ from collector to base,
    // input through 1 µF) and the SENSITIVITY pot takes as much of its output
    // (through 1 µF) as the learner wants. The amplifier's output reaches
    // the LED driver Q2 through 10 µF and 1 kΩ; a 1N4148 from ground lets the
    // capacitor recharge on the negative half-waves. Q2 conducts on the
    // positive peaks: the red LED (470 Ω) flashes with the loud parts.
    'lab-amp-ic-light-organ': {
        vcc: 9, supply: SUP,
        parts: { bat: BAT9, mic: MIC(), c1: C(100e-9), q1: NPN, rc1: R(10000), rf1: R(1000000), c2: C(1e-6),
            sens: POT(10000, 0.5), pre: SLIDE(0), u: LM386, cg: EL(10e-6),
            cd: EL(2.2e-6), rb: R(1000), dc: D4148, rbe: R(10000), q2: NPN, rl: R(470), led: LED('red') },
        nets: [
            ['bat.pos', 'rc1.a', 'u.vs', 'rl.a'],
            ['mic.a', 'c1.a', 'pre.a'], ['c1.b', 'q1.base', 'rf1.b'], ['q1.collector', 'rc1.b', 'rf1.a', 'c2.a'],
            ['c2.b', 'sens.a'], ['sens.wiper', 'pre.b'], ['pre.com', 'u.inp'],
            ['u.gain1', 'cg.pos'], ['u.gain8', 'cg.neg'],
            ['u.vout', 'cd.pos'], ['cd.neg', 'rb.a', 'dc.cathode'], ['rb.b', 'rbe.a', 'q2.base'],
            ['rl.b', 'led.anode'], ['led.cathode', 'q2.collector'],
            ['bat.neg', 'mic.b', 'q1.emitter', 'sens.b', 'u.gnd', 'u.inn', 'dc.anode', 'rbe.b', 'q2.emitter'],
        ],
        open: ['u.bypass'],
    },

    // Applause meter. Speaker as microphone, LM386 at gain 200. Its output
    // pumps the hold capacitor through 10 µF and two 1N4148s (one from
    // ground lets the coupling capacitor recharge, one lets charge only into
    // the hold capacitor). The hold capacitor (slide switch: 10 µF, or 47 µF
    // for a longer hold) feeds the LED driver Q1 through 22 kΩ; Q1's base
    // current and 220 kΩ empty it slowly. While the applause goes on, every
    // peak tops it up and the green LED (470 Ω) stays lit; when it stops the
    // LED fades out over a second or so.
    'lab-amp-ic-applause': {
        vcc: 9, supply: SUP,
        parts: { bat: BAT9, mic: MIC(), u: LM386, cg: EL(10e-6), cp: C(1e-6), dg: GE, dp: GE,
            hold: SLIDE(0), ch1: EL(10e-6), ch2: EL(47e-6), rbl: R(220000), rb: R(22000), q1: NPN,
            rl: R(470), led: LED('green') },
        nets: [
            ['bat.pos', 'u.vs', 'rl.a'],
            ['mic.a', 'u.inp'], ['u.gain1', 'cg.pos'], ['u.gain8', 'cg.neg'],
            ['u.vout', 'cp.a'], ['cp.b', 'dg.cathode', 'dp.anode'],
            ['dp.cathode', 'hold.com', 'rbl.a', 'rb.a'], ['hold.a', 'ch1.pos'], ['hold.b', 'ch2.pos'],
            ['rb.b', 'q1.base'], ['rl.b', 'led.anode'], ['led.cathode', 'q1.collector'],
            ['bat.neg', 'mic.b', 'u.gnd', 'u.inn', 'dg.anode', 'ch1.neg', 'ch2.neg', 'rbl.b', 'q1.emitter'],
        ],
        open: ['u.bypass'],
    },

    // Clap switch. Speaker as microphone, LM386 at gain 200, its output
    // through 220 nF (held at the bias voltage by 47 kΩ) and a 1N4148
    // diode onto the input of an emitter-coupled Schmitt trigger — the
    // diode passes only the upward swings, so the clap's downward half
    // cannot flip the trigger back:
    // Q1 and Q2 share 2.2 kΩ in their emitters; Q1's collector load is
    // 2.2 kΩ and the red LED, and the top of the LED drives Q2's base
    // through 10 kΩ against 10 kΩ. At rest Q1 is off and Q2 conducts; Q1's
    // base sits where the THRESHOLD pot puts it (1 kΩ between 3.3 kΩ to +9 V
    // and 1.8 kΩ to ground, through 4.7 kΩ), below the trigger's upper
    // switching point. A clap's upward swing lifts Q1's base past that
    // point: Q1 takes over the emitter current and the LED lights — and
    // stays lit, because the bias alone sits above the lower switching
    // point. The nearer the pot puts the bias to the upper point, the
    // smaller the clap that will do. RESET pulls Q1's base to ground through
    // 470 Ω: the trigger flips back. 10 µF on the amplifier's bypass pin
    // lets its output rise slowly at switch-on, so the coupling capacitor
    // follows and the trigger powers up armed (LED dark).
    // A 1 MΩ collector-to-emitter path keeps Q1's collector defined at
    // power-on. Its few microamps leave the LED dark until Q1 switches on.
    'lab-amp-ic-clap-latch': {
        vcc: 9, supply: SUP,
        parts: { bat: BAT9, mic: MIC(), u: LM386, cg: EL(10e-6), cc: C(220e-9),
            rtop: R(3300), thr: POT(1000, 0.5), rbot: R(1800), rbias: R(4700), rk: R(47000), dk: D4148,
            q1: NPN, q2: NPN, rc1: R(2200), led: LED('red'), r12: R(10000), r2g: R(10000), re: R(2200),
            rc2: R(2200), reset: BTN, rr: R(470), cb: EL(10e-6), bleed: R(1e6) },
        nets: [
            ['bat.pos', 'u.vs', 'rtop.a', 'rc1.a', 'rc2.a'],
            ['mic.a', 'u.inp'], ['u.gain1', 'cg.pos'], ['u.gain8', 'cg.neg'],
            ['u.vout', 'cc.a'], ['u.bypass', 'cb.pos'],
            ['rtop.b', 'thr.a'], ['thr.b', 'rbot.a'], ['thr.wiper', 'rbias.a', 'rk.a'], ['cc.b', 'rk.b', 'dk.anode'],
            ['dk.cathode', 'rbias.b', 'q1.base', 'reset.a'], ['reset.b', 'rr.a'],
            ['rc1.b', 'led.anode', 'r12.a'], ['led.cathode', 'q1.collector', 'bleed.a'], ['r12.b', 'r2g.a', 'q2.base'],
            ['q1.emitter', 'q2.emitter', 're.a', 'bleed.b'], ['rc2.b', 'q2.collector'],
            ['bat.neg', 'mic.b', 'u.gnd', 'u.inn', 'rbot.b', 'r2g.b', 're.b', 'rr.b', 'cb.neg'],
        ],
    },

    // Pot piano. LM386 relaxation oscillator: 47 kΩ (with 1 nF speed-up)
    // from the output and 100 kΩ from +9 V set the + input's two switching
    // levels; the timing capacitor on −IN charges and discharges from the
    // output through the RANGE resistor (slide switch: 2.2 kΩ, or 470 Ω for
    // a wider range) and the TUNE pot (10 kΩ rheostat). The note sounds only
    // while the KEY button joins that timing path to the output. OCTAVE puts
    // a second 100 nF beside the first: twice the capacitance, half the
    // pitch. Speaker through 47 µF and 47 Ω.
    'lab-amp-ic-pot-piano': {
        vcc: 9, supply: SUP,
        parts: { bat: BAT9, u: LM386, rh: R(47000), cf: C(1e-9), rv: R(100000),
            key: BTN, range: SLIDE(0), rn: R(2200), rw: R(470), tune: POT(10000, 0.5),
            ct: C(100e-9), octave: SLIDE(0), cx: C(100e-9), co: EL(47e-6), rs: R(47), spk: SPK },
        nets: [
            ['bat.pos', 'u.vs', 'rv.a'],
            ['u.vout', 'rh.a', 'cf.a', 'key.a', 'co.pos'], ['u.inp', 'rh.b', 'cf.b', 'rv.b'],
            ['key.b', 'range.com'], ['range.a', 'rn.a'], ['range.b', 'rw.a'], ['rn.b', 'rw.b', 'tune.a'],
            ['tune.wiper', 'tune.b', 'u.inn', 'ct.a', 'octave.com'], ['octave.b', 'cx.a'],
            ['co.neg', 'rs.a'], ['rs.b', 'spk.a'],
            ['bat.neg', 'u.gnd', 'ct.b', 'cx.b', 'spk.b'],
        ],
        open: ['u.gain1', 'u.gain8', 'u.bypass', 'octave.a'],
    },
};
