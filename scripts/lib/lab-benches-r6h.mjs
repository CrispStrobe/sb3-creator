/**
 * Netlists for the r6h lab benches, written by
 * `node scripts/gen-lab-circuits-4.mjs --set=r6h`.
 *
 * Two families. The first is built from a power-amplifier IC (LM386) and NPN
 * transistors: a continuity beeper that tests diodes and transistor
 * junctions, a slow pot-tuned relaxation oscillator (metronome, engine,
 * siren), an input amplifier ahead of a two-band light organ, a light switch
 * that holds itself on through its own infrared beam, and the amplifier's
 * half-supply output used as the midpoint of a split supply for an op-amp.
 * The second is built from one quad op-amp (LM324) and transistors: a
 * Schmitt trigger, a sound-switched relay, a half-hour relay timer and a
 * three-stage shift register made of three op-amp latches.
 *
 * Same shape as lab-benches-4.mjs: pure data, so
 * test/lab-circuits-r6h.test.mjs names parts by role. Ids follow benchIds
 * (breadboard first, then the parts in the order listed). A param written
 * '@name' (a light path's from / to) is resolved to that part's engine id
 * at the end of this file.
 *
 * THE LM386 OSCILLATOR. bw-board's LM386 (src/lm386.js) has 50 kΩ from each
 * input to ground and swings 0.9 V .. Vs − 0.9 V. 47 kΩ from the output and
 * 100 kΩ from +9 V give its + input a threshold that moves with the output
 * (about 5.1 V high, 2.1 V low); an RC from the output to the − input makes
 * it a relaxation oscillator. An NPN from the + input to ground ("kill")
 * holds it silent while it conducts.
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
const D = ['diode', { part: '1N4148' }];
const LM386 = ['lm386', {}];
const LM324 = ['lm324', {}];
const BTN = ['button', {}];
const SW = (closed = false) => ['switch', { closed }];
const SLIDE = (position = 0) => ['slide_switch', { position }];
const SPK = ['speaker', { ohms: 8 }];

/** The beeper: LM386 tone held off by a kill NPN, which a sense NPN releases. */
const BEEPER_PARTS = {
    u: LM386, rh: R(47000), cf: C(1e-9), rv: R(100000), rt: R(10000), ct: C(100e-9),
    co: EL(47e-6), rs: R(47), spk: SPK,
    rk: R(47000), qk: NPN, rsb: R(4700), rbe: R(47000), qs: NPN, rsrc: R(1000), rsg: R(1000),
};
const BEEPER_NETS = [
    ['u.inp', 'rh.b', 'cf.b', 'rv.b', 'qk.collector'],
    ['u.vout', 'rh.a', 'cf.a', 'rt.a', 'co.pos'], ['u.inn', 'rt.b', 'ct.a'],
    ['co.neg', 'rs.a'], ['rs.b', 'spk.a'],
    ['rk.b', 'qk.base', 'qs.collector'], ['rsb.b', 'qs.base', 'rbe.a'],
];
const BEEPER_POS = ['u.vs', 'rv.a', 'rk.a', 'rsrc.a'];
const BEEPER_NEG = ['u.gnd', 'ct.b', 'spk.b', 'qk.emitter', 'qs.emitter', 'rbe.b', 'rsg.b'];

export const BENCHES = {
    // Continuity beeper as a diode tester. The red probe is 4.5 V from two
    // 1 kΩ (low enough that no junction under test is driven into reverse
    // breakdown); the black probe feeds the sense NPN's base through 4.7 kΩ. When
    // current flows from red to black the sense NPN pulls the kill NPN's base
    // low and the LM386 tone sounds. The device under test sits in a socket:
    // four buttons put a silicon diode, a germanium diode, a red LED or an
    // infrared LED between the socket's anode row (A) and its common cathode
    // row (K). Two slide switches say where each probe is clipped: left, red
    // on A and black on K (forward); right, red on K and black on A (reverse).
    // A voltmeter across the socket (A against K) shows each diode's drop.
    'lab-beeper-diode-check': {
        vcc: 9, supply: SUP,
        parts: { bat: BAT9, ...BEEPER_PARTS,
            redclip: SLIDE(0), blackclip: SLIDE(0),
            bsi: BTN, dsi: D, bge: BTN, dge: ['diode', { part: '1N34A' }], bled: BTN, led: LED('red'),
            bir: BTN, ir: ['ir_transmitter', {}], vm: ['voltmeter', {}] },
        nets: [
            ['bat.pos', ...BEEPER_POS],
            ...BEEPER_NETS,
            ['rsrc.b', 'rsg.a', 'redclip.com'], ['rsb.a', 'blackclip.com'],
            ['redclip.a', 'blackclip.b', 'bsi.b', 'bge.b', 'bled.b', 'bir.b', 'vm.a'],
            ['bsi.a', 'dsi.anode'], ['bge.a', 'dge.anode'], ['bled.a', 'led.anode'], ['bir.a', 'ir.anode'],
            ['redclip.b', 'blackclip.a', 'dsi.cathode', 'dge.cathode', 'led.cathode', 'ir.cathode', 'vm.b'],
            ['bat.neg', ...BEEPER_NEG],
        ],
        open: ['u.gain1', 'u.gain8', 'u.bypass'],
    },

    // The same beeper on a transistor. Six toggle switches are the probe
    // clips: red to base, collector or emitter, black to base, collector or
    // emitter. Close one red and one black: base→emitter and base→collector
    // beep (two diodes with their anodes on the base), the reverse directions
    // and collector↔emitter stay silent.
    'lab-beeper-transistor-check': {
        vcc: 9, supply: SUP,
        parts: { bat: BAT9, ...BEEPER_PARTS, dut: NPN,
            rb: SW(), rc: SW(), re: SW(), kb: SW(), kc: SW(), ke: SW() },
        nets: [
            ['bat.pos', ...BEEPER_POS],
            ...BEEPER_NETS,
            ['rsrc.b', 'rsg.a', 'rb.a', 'rc.a', 're.a'], ['rsb.a', 'kb.a', 'kc.a', 'ke.a'],
            ['rb.b', 'kb.b', 'dut.base'], ['rc.b', 'kc.b', 'dut.collector'], ['re.b', 'ke.b', 'dut.emitter'],
            ['bat.neg', ...BEEPER_NEG],
        ],
        open: ['u.gain1', 'u.gain8', 'u.bypass'],
    },

    // One LM386 relaxation oscillator, three speeds. The timing resistor is
    // 15 kΩ plus a 47 kΩ RATE rheostat; the capacitor on the − input is
    // 47 nF, plus 1 µF with the ENGINE switch, plus 22 µF with the TICK
    // switch. 22 µF: a metronome, one tick at each edge, about 220 down to
    // 55 a minute. 1 µF: a putt-putt of 10 to 40 beats a second that the
    // knob revs like a throttle. 47 nF alone: a tone the knob sweeps from
    // about 200 Hz to 850 Hz — a siren by hand. The red LED shows the
    // output.
    'lab-amp-metronome': {
        vcc: 9, supply: SUP,
        parts: { bat: BAT9, u: LM386, rh: R(47000), cf: C(1e-9), rv: R(100000),
            rmin: R(2200), rate: POT(15000, 0.5), ct: C(100e-9),
            engine: SW(), ce: EL(2.2e-6), tick: SW(true), cm: EL(100e-6),
            rl: R(1000), led: LED('red'), co: EL(47e-6), rs: R(47), spk: SPK },
        nets: [
            ['bat.pos', 'u.vs', 'rv.a'],
            ['u.vout', 'rh.a', 'cf.a', 'rmin.a', 'rl.a', 'co.pos'], ['u.inp', 'rh.b', 'cf.b', 'rv.b'],
            ['rmin.b', 'rate.a'], ['rate.wiper', 'rate.b', 'u.inn', 'ct.a', 'engine.a', 'tick.a'],
            ['engine.b', 'ce.pos'], ['tick.b', 'cm.pos'],
            ['rl.b', 'led.anode'], ['co.neg', 'rs.a'], ['rs.b', 'spk.a'],
            ['bat.neg', 'u.gnd', 'ct.b', 'ce.neg', 'cm.neg', 'led.cathode', 'spk.b'],
        ],
        open: ['u.gain1', 'u.gain8', 'u.bypass'],
    },

    // Two-band light organ with an amplifier in front. The function
    // generator is the music player (150 mV); the LM386 (gain 20) lifts it to
    // about 3 V. From its output, through 47 µF: a high-pass (22 nF into
    // 10 kΩ) feeds the treble NPN, a low-pass (1 kΩ into 1 µF) the bass NPN,
    // each through 4.7 kΩ. Each NPN lights its LED (blue treble, red bass)
    // on the positive peaks that reach its base.
    'lab-amp-light-organ': {
        vcc: 9, supply: SUP,
        parts: { bat: BAT9, fg: ['function_gen', { wave: 'sine', freq: 80, amplitude: 0.15 }], cin: C(1e-6), u: LM386,
            ch: C(22e-9), rhp: R(10000), bh: R(4700), qh: NPN, r1: R(470), treble: LED('blue'),
            co: C(2.2e-6), rlp: R(1000), cl: C(1e-6), rd: R(4700), bl: R(4700), ql: NPN, r2: R(470), bass: LED('red') },
        nets: [
            ['bat.pos', 'u.vs', 'r1.a', 'r2.a'],
            ['fg.out', 'cin.a'], ['cin.b', 'u.inp'],
            ['u.vout', 'ch.a', 'co.a'],
            ['ch.b', 'rhp.a', 'bh.a'], ['bh.b', 'qh.base'], ['r1.b', 'treble.anode'], ['treble.cathode', 'qh.collector'],
            ['co.b', 'rlp.a'], ['rlp.b', 'cl.a', 'rd.a', 'bl.a'], ['bl.b', 'ql.base'], ['r2.b', 'bass.anode'], ['bass.cathode', 'ql.collector'],
            ['bat.neg', 'fg.gnd', 'u.gnd', 'u.inn', 'rhp.b', 'cl.b', 'rd.b', 'qh.emitter', 'ql.emitter'],
        ],
        open: ['u.gain1', 'u.gain8', 'u.bypass'],
    },

    // A light amplifier that holds itself on. A phototransistor and an NPN
    // form a Darlington: the phototransistor's emitter current is the NPN's
    // base current, the NPN lights the yellow LED in its collector and makes
    // a voltage across 220 Ω in its emitter. That voltage is the LM386's +
    // input; its − input sits at 0.6 V (680 kΩ from +9 V against its own
    // 50 kΩ). A flame (the phototransistor's light slider) lifts the + input
    // past the − input and the output jumps high: it lights a red LED and,
    // in series, an infrared LED aimed at the phototransistor 4 cm away. Now
    // the circuit's own infrared keeps the Darlington on after the flame has
    // gone. Only a hand in the beam (the light path's knob) breaks the loop.
    'lab-flame-ir-latch': {
        vcc: 9, supply: SUP,
        parts: { bat: BAT9, pt: ['phototransistor', { light: 0 }], q: NPN, rled: R(1000), amp: LED('yellow'), re: R(220),
            u: LM386, rv: R(680000), rtx: R(470), red: LED('red'), irled: ['ir_transmitter', {}],
            beam: ['light_path', { from: '@irled', to: '@pt', medium: 'air', distanceCm: 4, knob: 'blocked', knobMin: 0, knobMax: 1 }] },
        nets: [
            ['bat.pos', 'pt.collector', 'rled.a', 'u.vs', 'rv.a'],
            ['pt.emitter', 'q.base'], ['rled.b', 'amp.anode'], ['amp.cathode', 'q.collector'],
            ['q.emitter', 're.a', 'u.inp'], ['rv.b', 'u.inn'],
            ['u.vout', 'rtx.a'], ['rtx.b', 'red.anode'], ['red.cathode', 'irled.anode'],
            ['bat.neg', 're.b', 'u.gnd', 'irled.cathode'],
        ],
        open: ['u.gain1', 'u.gain8', 'u.bypass'],
    },

    // The power amplifier as a split supply. The LM386 with both inputs
    // grounded settles its output near half the supply (its internal bias
    // network) and holds it there against half an amp:
    // the midpoint (0 V) of a ±4.5 V supply from one 9 V battery. The slide
    // switch takes the midpoint from the LM386 (left) or from two 10 kΩ
    // resistors (right). An LM358 inverting amplifier (10 kΩ / 10 kΩ, + input
    // on the midpoint) mirrors the INPUT pot about the midpoint; its output
    // drives two LEDs back to back to the midpoint through 470 Ω: red when
    // the output is above the midpoint, green when below. The voltmeter
    // reads the output against the midpoint, with its sign.
    'lab-amp-midpoint': {
        vcc: 9, supply: SUP,
        parts: { bat: BAT9, u: LM386, rd1: R(10000), rd2: R(10000), sel: SLIDE(0),
            pin: POT(10000, 0.25), rin: R(10000), rf: R(10000), op: ['lm358', {}],
            rl: R(470), pos: LED('red'), neg: LED('green'), vm: ['voltmeter', {}] },
        nets: [
            ['bat.pos', 'u.vs', 'rd1.a', 'pin.a', 'op.vcc'],
            ['u.vout', 'sel.a'], ['rd1.b', 'rd2.a', 'sel.b'],
            ['sel.com', 'op.1_pos', 'pos.cathode', 'neg.anode', 'vm.b', 'op.2_pos'],
            ['pin.wiper', 'rin.a'], ['rin.b', 'rf.a', 'op.1_neg'], ['rf.b', 'op.1_out', 'rl.a', 'vm.a'],
            ['rl.b', 'pos.anode', 'neg.cathode'],
            ['op.2_neg', 'op.2_out'],
            ['bat.neg', 'u.gnd', 'u.inp', 'u.inn', 'rd2.b', 'pin.b', 'op.gnd'],
        ],
        open: ['u.gain1', 'u.gain8', 'u.bypass'],
    },

    // The op-amp Schmitt trigger. The − input sits at half the supply (two
    // 10 kΩ). The INPUT pot reaches the + input through 22 kΩ; with the
    // FEEDBACK switch closed, 100 kΩ from the output adds to it, so the
    // input must pass about 5.5 V to switch the output high and fall below
    // about 3.8 V to switch it low again: two thresholds. Switch open: a
    // plain comparator, one threshold at 4.5 V. Red LED: output high; green:
    // output low. The voltmeter shows the input.
    'lab-opamp-schmitt': {
        vcc: 9, supply: SUP,
        parts: { bat: BAT9, pin: POT(10000, 0.5), vm: ['voltmeter', {}], rin: R(22000), u: LM324,
            fb: SW(true), rfb: R(100000), r1: R(10000), r2: R(10000),
            rl1: R(1000), hi: LED('red'), rl2: R(1000), lo: LED('green') },
        nets: [
            ['bat.pos', 'pin.a', 'r1.a', 'u.vcc', 'rl2.a'],
            ['pin.wiper', 'rin.a', 'vm.a'], ['rin.b', 'u.1_pos', 'fb.a'], ['fb.b', 'rfb.a'],
            ['rfb.b', 'u.1_out', 'rl1.a', 'lo.cathode'], ['r1.b', 'r2.a', 'u.1_neg'],
            ['rl1.b', 'hi.anode'], ['rl2.b', 'lo.anode'],
            ['u.2_neg', 'u.2_out'], ['u.3_neg', 'u.3_out'], ['u.4_neg', 'u.4_out'],
            ['bat.neg', 'pin.b', 'vm.b', 'r2.b', 'u.gnd', 'hi.cathode', 'u.2_pos', 'u.3_pos', 'u.4_pos'],
        ],
    },

    // A telephone bell switches a lamp. The loudspeaker is the microphone
    // (10 µF into the base of a self-biased NPN stage, 10 kΩ / 1 MΩ, a gain of
    // a few hundred); an LM324 inverting stage (2.2 kΩ in, 100 kΩ feedback,
    // + input on a half-supply divider) lifts it further. 1 µF and two
    // diodes pump the bursts into 2.2 µF (220 kΩ drains it): a second LM324
    // section compares that with the SENSITIVITY pot's voltage and, through
    // an NPN, pulls in a relay whose contact lights the lamp. Between the
    // strokes of the bell the 2.2 µF holds the relay in.
    'lab-opamp-sound-relay': {
        vcc: 9, supply: SUP,
        parts: { bat: BAT9, mic: ['speaker', { ohms: 8, soundDb: 0, soundWave: 'ring', soundHz: 900 }],
            cin: C(1e-6), rb1: R(47000), rb2: R(6800), q1: NPN, rc1: R(4700), re1: R(470), ce1: EL(22e-6),
            c1: C(1e-6), u: LM324, ri: R(2200), rf: R(220000), rm1: R(10000), rm2: R(10000), cm: EL(1e-6),
            cp: C(1e-6), dp1: D, dp2: D, ra: R(47000), ch: EL(2.2e-6), rdis: R(220000),
            sens: POT(10000, 0.25), rb: R(4700), qr: NPN, k: ['relay', { coilR: 200 }], df: D,
            lamp: ['light_bulb', { ohms: 90, vRated: 9 }] },
        nets: [
            ['bat.pos', 'rb1.a', 'rc1.a', 'u.vcc', 'rm1.a', 'sens.a', 'k.coil_a', 'df.cathode', 'k.com'],
            ['mic.a', 'cin.a'], ['cin.b', 'q1.base', 'rb1.b', 'rb2.a'], ['q1.emitter', 're1.a', 'ce1.pos'],
            ['q1.collector', 'rc1.b', 'c1.a'],
            ['c1.b', 'ri.a'], ['ri.b', 'rf.a', 'u.1_neg'], ['rm1.b', 'rm2.a', 'cm.pos', 'u.1_pos'],
            ['rf.b', 'u.1_out', 'cp.a'], ['cp.b', 'dp1.cathode', 'dp2.anode'],
            ['dp2.cathode', 'ra.a'], ['ra.b', 'ch.pos', 'rdis.a', 'u.2_pos'], ['sens.wiper', 'u.2_neg'],
            ['u.2_out', 'rb.a'], ['rb.b', 'qr.base'], ['qr.collector', 'k.coil_b', 'df.anode'], ['k.no', 'lamp.a'],
            ['u.3_neg', 'u.3_out'], ['u.4_neg', 'u.4_out'],
            ['bat.neg', 'mic.b', 'rb2.b', 're1.b', 'ce1.neg', 'rm2.b', 'cm.neg', 'dp1.anode', 'ch.neg', 'rdis.b', 'sens.b', 'qr.emitter',
                'lamp.b', 'u.gnd', 'u.3_pos', 'u.4_pos'],
        ],
        open: ['k.nc'],
    },

    // Half-hour timer with a relay. 470 µF charges from +9 V through 100 kΩ
    // and a 4.7 MΩ TIME rheostat; an LM324 section compares it (− input)
    // with 6 V (100 kΩ / 200 kΩ, plus 1 MΩ from the output for a little
    // hysteresis). While the capacitor is below, the output is high, an NPN
    // holds the relay in and its contact lights the lamp. When the capacitor
    // passes 6 V (after 1.13 R C: about a minute at one end of the knob, 42
    // minutes at the other, 30 minutes as built) the relay drops out. START
    // empties the capacitor through 100 Ω and the time begins again;
    // switching on starts it too.
    'lab-opamp-relay-timer': {
        vcc: 9, supply: SUP,
        parts: { bat: BAT9, rmin: R(100000), time: POT(4700000, 0.3), range: SLIDE(0), ct: EL(470e-6), cs: EL(4.7e-6), start: BTN, rdis: R(100),
            u: LM324, rt1: R(100000), rt2: R(200000), rhy: R(1000000),
            rled: R(1000), led: LED('yellow'), rb: R(4700), qr: NPN, k: ['relay', { coilR: 200 }], df: D,
            lamp: ['light_bulb', { ohms: 90, vRated: 9 }] },
        nets: [
            ['bat.pos', 'rmin.a', 'u.vcc', 'rt1.a', 'k.coil_a', 'df.cathode', 'k.com'],
            ['rmin.b', 'time.a'], ['time.wiper', 'time.b', 'range.com', 'start.a', 'u.1_neg'], ['range.a', 'ct.pos'], ['range.b', 'cs.pos'],
            ['start.b', 'rdis.a'],
            ['rt1.b', 'rt2.a', 'rhy.a', 'u.1_pos'], ['rhy.b', 'u.1_out', 'rled.a', 'rb.a'],
            ['rled.b', 'led.anode'], ['rb.b', 'qr.base'], ['qr.collector', 'k.coil_b', 'df.anode'], ['k.no', 'lamp.a'],
            ['u.2_neg', 'u.2_out'], ['u.3_neg', 'u.3_out'], ['u.4_neg', 'u.4_out'],
            ['bat.neg', 'ct.neg', 'cs.neg', 'rdis.b', 'rt2.b', 'led.cathode', 'qr.emitter', 'lamp.b', 'u.gnd', 'u.2_pos', 'u.3_pos', 'u.4_pos'],
        ],
        open: ['k.nc'],
    },

    // A three-stage shift register from three op-amp latches. Each latch is
    // an LM324 section whose + input hangs between its own output (100 kΩ)
    // and ground (100 kΩ): 3.75 V while the output is high, 0 V while it is
    // low, against a common − input at 1.9 V (100 kΩ / 27 kΩ, 33 nF) — it
    // holds either state. CLOCK lifts the clock line to +9 V. That edge does
    // two things at once. Through 22 nF and a diode it kicks the common −
    // input up by about 3 V: every latch is pushed low. And through 47 nF
    // and a diode into each latch's + input, a much larger kick — but only
    // where the steering diode lets it: each kick node is clamped by a diode
    // to the PREVIOUS stage's delayed output (10 kΩ into 1 µF), so it rises
    // only when that stage was high. A latch whose predecessor was high is
    // pushed high harder than the − input rises: it ends high. The 10 ms
    // delay keeps the steering at the old values while the latches flip, so
    // each value moves exactly one place per press. DATA is the first
    // stage's input.
    'lab-opamp-shift-register': {
        vcc: 9, supply: SUP,
        parts: { bat: BAT9, clock: BTN, rclk: R(10000),
            data: SW(), rdat: R(10000), rdg: R(47000), cdat: EL(1e-6),
            u: LM324, rn1: R(100000), rn2: R(27000), cn: C(33e-9), ckn: C(22e-9), dkn: D, rkn: R(100000),
            f1: R(100000), g1: R(100000), k1: C(47e-9), s1: D, dc1: D, rb1: R(100000), rm1: R(10000), cm1: EL(1e-6), l1: R(1000), q1: LED('red'),
            f2: R(100000), g2: R(100000), k2: C(47e-9), s2: D, dc2: D, rb2: R(100000), rm2: R(10000), cm2: EL(1e-6), l2: R(1000), q2: LED('red'),
            f3: R(100000), g3: R(100000), k3: C(47e-9), s3: D, dc3: D, rb3: R(100000), l3: R(1000), q3: LED('red') },
        nets: [
            ['bat.pos', 'clock.a', 'data.a', 'u.vcc', 'rn1.a', 'cn.b'],
            ['clock.b', 'rclk.a', 'ckn.a', 'k1.a', 'k2.a', 'k3.a'],
            ['data.b', 'rdat.a'], ['rdat.b', 'rdg.a', 'cdat.pos', 'dc1.cathode'],
            ['rn1.b', 'rn2.a', 'cn.a', 'dkn.cathode', 'u.1_neg', 'u.2_neg', 'u.3_neg'], ['ckn.b', 'dkn.anode', 'rkn.a'],
            // stage 1
            ['k1.b', 's1.anode', 'dc1.anode', 'rb1.a'], ['s1.cathode', 'f1.b', 'g1.a', 'u.1_pos'],
            ['f1.a', 'u.1_out', 'rm1.a', 'l1.a'], ['l1.b', 'q1.anode'], ['rm1.b', 'cm1.pos', 'dc2.cathode'],
            // stage 2
            ['k2.b', 's2.anode', 'dc2.anode', 'rb2.a'], ['s2.cathode', 'f2.b', 'g2.a', 'u.2_pos'],
            ['f2.a', 'u.2_out', 'rm2.a', 'l2.a'], ['l2.b', 'q2.anode'], ['rm2.b', 'cm2.pos', 'dc3.cathode'],
            // stage 3
            ['k3.b', 's3.anode', 'dc3.anode', 'rb3.a'], ['s3.cathode', 'f3.b', 'g3.a', 'u.3_pos'],
            ['f3.a', 'u.3_out', 'l3.a'], ['l3.b', 'q3.anode'],
            ['u.4_neg', 'u.4_out'],
            ['bat.neg', 'rclk.b', 'rdg.b', 'cdat.neg', 'rn2.b', 'rkn.b', 'u.gnd', 'u.4_pos',
                'g1.b', 'rb1.b', 'cm1.neg', 'q1.cathode', 'g2.b', 'rb2.b', 'cm2.neg', 'q2.cathode', 'g3.b', 'rb3.b', 'q3.cathode'],
        ],
    },
};

// Resolve '@name' params to engine ids.
for (const spec of Object.values(BENCHES)) {
    const ids = benchIds(spec);
    for (const [, params] of Object.values(spec.parts))
        for (const [k, v] of Object.entries(params || {}))
            if (typeof v === 'string' && v.startsWith('@')) {
                if (!ids[v.slice(1)]) throw new Error(`${k}: unknown role ${v}`);
                params[k] = ids[v.slice(1)];
            }
}
