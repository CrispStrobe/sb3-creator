/**
 * Netlists for the r10d lab benches, written by
 * `node scripts/gen-lab-circuits-4.mjs --set=r10d`.
 *
 * Five benches built around a power-amplifier IC (LM386), each doing the
 * job with the amplifier itself: a tone generator keyed by a depletion
 * dual-gate MOSFET whose gate is a bare antenna wire, a two-transistor
 * monoflop that sounds a short chime, the amplifier at high gain fed from a
 * weak battery or an unsmoothed adaptor (motor-boating and hum, cured by
 * decoupling), the amplifier as a Schmitt trigger swept by a pot, and its
 * DC gain read on a meter for several resistors across the gain pins.
 *
 * Same shape as lab-benches-4.mjs: pure data, so
 * test/lab-circuits-r10d.test.mjs names parts by role. Ids follow benchIds
 * (breadboard first, then the parts in the order listed).
 *
 * THE LM386 OSCILLATOR (as in lab-benches-r6h.mjs). bw-board's LM386 has
 * 50 kΩ from each input to ground and swings 0.9 V .. Vs − 0.9 V. 47 kΩ from
 * the output and 100 kΩ from +9 V give its + input a threshold that moves
 * with the output (about 5.1 V high, 2.1 V low); an RC from the output to
 * the − input makes it a relaxation oscillator. Anything that holds the
 * + input below the − input's lowest value (the output floor, 0.9 V) keeps
 * it silent.
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
const BTN = ['button', {}];
const SW = (closed = false) => ['switch', { closed }];
const SLIDE = (position = 0) => ['slide_switch', { position }];
const SPK = ['speaker', { ohms: 8 }];
const GE = ['diode', { part: '1N34A' }];

/** LM386 relaxation oscillator: + input threshold net, RC on the − input. */
const OSC = (ct) => ({ u: LM386, rh: R(47000), cf: C(1e-9), rv: R(100000), rt: R(10000), ct: C(ct),
    co: EL(47e-6), rs: R(47), spk: SPK });
const OSC_NETS = (...inp) => [
    ['u.inp', 'rh.b', 'cf.b', 'rv.b', ...inp],
    ['u.vout', 'rh.a', 'cf.a', 'rt.a', 'co.pos'], ['u.inn', 'rt.b', 'ct.a'],
    ['co.neg', 'rs.a'], ['rs.b', 'spk.a'],
];
const OSC_POS = ['u.vs', 'rv.a'];
const OSC_NEG = ['u.gnd', 'ct.b', 'spk.b'];

export const BENCHES = {
    // A tone keyed by an electric field. The LM386 oscillator (10 kΩ,
    // 220 nF: a few hundred Hz) is held silent while a depletion dual-gate
    // MOSFET conducts: its drain pulls the + input down through a germanium
    // diode. The MOSFET's gate 1 is a bare antenna wire (field_probe); gate 2
    // sits on the source. A red LED with 4.7 kΩ from +9 V is the drain load,
    // so it shows the channel current. Bring a negatively charged ruler near
    // the antenna (the knob is its distance): the induced charge takes gate 1
    // below the pinch-off voltage, the channel closes, the LED goes out, the
    // drain rises, the diode lets go of the + input and the tone sounds. The
    // gate keeps its charge while the ruler is held still; take the ruler
    // away and the tone stops. The ruler's sign is the field_probe's
    // rodVolts: a positive ruler only opens the channel further.
    'lab-mosfet-tone-key': {
        vcc: 9, supply: SUP,
        parts: { bat: BAT9, ...OSC(220e-9),
            pr: ['field_probe', { source: 'charge', position: 0, rodVolts: -2000, maxFarads: 1e-13, strayFarads: 20e-12 }],
            m: ['dual_gate_mosfet', {}], rl: R(4700), led: LED('red'), dk: GE },
        nets: [
            ['bat.pos', ...OSC_POS, 'rl.a'],
            ...OSC_NETS('dk.anode'),
            ['dk.cathode', 'm.drain', 'led.cathode'], ['rl.b', 'led.anode'],
            ['pr.a', 'm.gate1'],
            ['bat.neg', ...OSC_NEG, 'm.source', 'm.gate2'],
        ],
        open: ['u.gain1', 'u.gain8', 'u.bypass'],
    },

    // Shop-door chime: a two-NPN monoflop starts a short tone. Q2 is held on
    // by 100 kΩ from +9 V; its collector (4.7 kΩ) feeds Q1's base through
    // 47 kΩ. Q1's collector (4.7 kΩ) reaches Q2's base through 4.7 µF. The
    // DOOR button lifts Q1's base through 10 kΩ: Q1 turns on, its falling
    // collector drives Q2's base below zero, Q2 turns off and holds Q1 on
    // until the 4.7 µF has recharged through 100 kΩ (about 0.7·R·C =
    // 0.33 s). The kill NPN sits on the LM386 oscillator's + input with its
    // base on Q1's collector (47 kΩ): at rest Q1 is off, its collector high,
    // the kill NPN on and the amplifier silent; during the pulse the tone
    // sounds. However long the door stays open, the chime is the same
    // length... as long as the button is let go before the pulse ends.
    'lab-door-chime': {
        vcc: 9, supply: SUP,
        parts: { bat: BAT9, ...OSC(220e-9),
            door: BTN, rtr: R(10000), q1: NPN, rc1: R(4700), ctm: EL(4.7e-6), rb2: R(100000), q2: NPN, rc2: R(4700),
            rf: R(47000), rbe: R(47000), rk: R(47000), qk: NPN },
        nets: [
            ['bat.pos', ...OSC_POS, 'door.a', 'rc1.a', 'rb2.a', 'rc2.a'],
            ...OSC_NETS('qk.collector'),
            ['door.b', 'rtr.a'], ['rtr.b', 'rf.b', 'rbe.a', 'q1.base'],
            ['q1.collector', 'rc1.b', 'ctm.pos', 'rk.a'], ['ctm.neg', 'rb2.b', 'q2.base'],
            ['q2.collector', 'rc2.b', 'rf.a'], ['rk.b', 'qk.base'],
            ['bat.neg', ...OSC_NEG, 'rbe.b', 'q1.emitter', 'q2.emitter', 'qk.emitter'],
        ],
        open: ['u.gain1', 'u.gain8', 'u.bypass'],
    },

    // The amplifier at gain 200 (10 µF across pins 1 and 8) with its input
    // biased from its own supply: 100 kΩ and 4.7 kΩ divide the supply, and
    // 1 µF carries that node to the + input, as a microphone's feed would.
    // Whatever wobbles on the supply reaches the input at 1/22 and comes out
    // 200 times larger. SUPPLY (slide switch): left the battery, right an
    // unsmoothed adaptor (the battery plus 0.5 V of 100 Hz ripple from the
    // function generator in series). WEAK (slide switch): right puts 47 Ω in
    // series, a run-down battery's internal resistance; the output current
    // through the speaker (220 µF) then pulls the supply down, the divider
    // passes the dip back to the input, and below the coupling capacitors'
    // corner frequencies the loop turns positive: motor-boating. DECOUPLE
    // (slide switch): right feeds the divider through 1 kΩ and 470 µF, which
    // the slow wobble and the 100 Hz ripple cannot get through.
    'lab-amp-supply-decoupling': {
        vcc: 9, supply: SUP,
        parts: { bat: BAT9, fg: ['function_gen', { wave: 'sine', freq: 100, amplitude: 0.5, offset: 0, rOut: 1 }],
            src: SLIDE(0), weak: SLIDE(0), rw: R(47), dec: SLIDE(0), rd: R(10000), cd: EL(470e-6),
            rtop: R(100000), rbot: R(4700), cin: EL(1e-6), u: LM386, cg: EL(10e-6), cb: EL(1e-6),
            co: EL(220e-6), spk: SPK },
        nets: [
            ['bat.pos', 'src.a', 'fg.gnd'], ['fg.out', 'src.b'],
            ['src.com', 'weak.a', 'rw.a'], ['rw.b', 'weak.b'],
            ['weak.com', 'u.vs', 'dec.a', 'rd.a'], ['rd.b', 'dec.b', 'cd.pos'],
            ['dec.com', 'rtop.a'], ['rtop.b', 'rbot.a', 'cin.pos'], ['cin.neg', 'u.inn'],
            ['u.gain1', 'cg.pos'], ['u.gain8', 'cg.neg'], ['u.bypass', 'cb.pos'],
            ['u.vout', 'co.pos'], ['co.neg', 'spk.a'],
            ['bat.neg', 'cd.neg', 'rbot.b', 'u.inp', 'u.gnd', 'cb.neg', 'spk.b'],
        ],
    },

    // The amplifier as a Schmitt trigger. Gain 200, at DC too: a wire joins
    // pins 1 and 8 (a capacitor there would give 200 only for AC).
    // The − input is the reference: 330 kΩ from +9 V against the chip's own
    // 50 kΩ to ground, about 1.2 V. The INPUT pot (10 kΩ, under 22 kΩ from
    // +9 V: 0 to 2.8 V) feeds the + input through 47 kΩ; 470 kΩ from the
    // output adds positive feedback, so the output snaps and the + input
    // jumps with it. The voltmeter shows the pot's voltage: turn up slowly
    // and the red LED (output high) comes on near 2.3 V; turn back and it
    // goes out only near 1.6 V, where the green LED (output low) takes over.
    'lab-amp-schmitt-sweep': {
        vcc: 9, supply: SUP,
        parts: { bat: BAT9, u: LM386, rref: R(330000),
            rtop: R(22000), pot: POT(10000, 0), rin: R(47000), rfb: R(470000), vm: ['voltmeter', {}],
            rr: R(1000), red: LED('red'), rg: R(1000), green: LED('green') },
        nets: [
            ['bat.pos', 'u.vs', 'rref.a', 'rtop.a', 'rg.a'],
            ['rref.b', 'u.inn'], ['rtop.b', 'pot.a'], ['pot.wiper', 'rin.a', 'vm.a'], ['rin.b', 'rfb.b', 'u.inp'],
            ['u.gain1', 'u.gain8'],
            ['u.vout', 'rfb.a', 'rr.a', 'green.cathode'], ['rr.b', 'red.anode'], ['rg.b', 'green.anode'],
            ['bat.neg', 'pot.b', 'vm.b', 'u.gnd', 'red.cathode'],
        ],
        open: ['u.bypass'],
    },

    // DC gain of the amplifier, read on a meter. The INPUT pot (100 Ω under
    // 47 kΩ from +9 V) gives 0 to 19 mV at the + input; the − input is
    // grounded. The output sits at half the supply plus gain × input, so the
    // moving-coil meter (3 V full scale, 20 kΩ/V) is wired from the output to
    // a 1 kΩ / 1 kΩ half-supply divider and reads gain × input directly; a
    // voltmeter shows the input. With pins 1 and 8 open the gain is 20. Four
    // switches each put a resistor across pins 1 and 8 (1 kΩ, 220 Ω, 47 Ω, a
    // wire): the lower the resistance, the higher the gain, up to 200.
    'lab-amp-dc-gain': {
        vcc: 9, supply: SUP,
        parts: { bat: BAT9, rsrc: R(47000), pin: POT(100, 0.5), vin: ['voltmeter', {}], u: LM386,
            s1: SW(), r1: R(1000), s2: SW(), r2: R(220), s3: SW(), r3: R(47), s4: SW(),
            rr1: R(1000), rr2: R(1000), meter: ['analog_meter', { fullScale: 3, ifs: 50e-6 }] },
        nets: [
            ['bat.pos', 'u.vs', 'rsrc.a', 'rr1.a'],
            ['rsrc.b', 'pin.a'], ['pin.wiper', 'u.inp', 'vin.a'],
            ['u.gain1', 's1.a', 's2.a', 's3.a', 's4.a'], ['s1.b', 'r1.a'], ['s2.b', 'r2.a'], ['s3.b', 'r3.a'],
            ['u.gain8', 'r1.b', 'r2.b', 'r3.b', 's4.b'],
            ['u.vout', 'meter.a'], ['rr1.b', 'rr2.a', 'meter.b'],
            ['bat.neg', 'pin.b', 'vin.b', 'u.inn', 'u.gnd', 'rr2.b'],
        ],
        open: ['u.bypass'],
    },
};
