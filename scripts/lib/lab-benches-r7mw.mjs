/**
 * Netlists for the round-7 medium-wave radio benches: two transmitters that radiate by
 * switching a coil's current (a spark from a dumped capacitor, a coil chopped
 * by an astable), a rod whose small winding slides, and a superhet on a
 * double-balanced mixer IC. Written by
 * `node scripts/gen-lab-circuits-4.mjs --set=r7mw`.
 *
 * Same shape as lab-benches-rf.mjs: pure data, so test/lab-circuits-r7mw.test.mjs
 * names parts by role. Ids follow benchIds (breadboard first, then the parts
 * in the order listed).
 *
 * The engine (bw-board src/radio.js) carries RF as complex envelopes around
 * the circuit's resonances; a junction swinging in two bands puts its
 * products (sum, difference, harmonics) into a third; an untuned coil linked
 * to another radiates the corners of its switched current into the other's
 * bands.
 */
import { benchIds } from './lab-benches-4.mjs';
export { benchIds };

const SUP = { pos: 'bat.pos', neg: 'bat.neg' };
const R = (ohms) => ['resistor', { ohms }];
const C = (farads) => ['capacitor', { farads }];
const EL = (farads) => ['polarized_cap', { farads }];
const NPN = ['npn', { beta: 100 }];
const BAT9 = ['vsource', { volts: 9, variant: '9v' }];
const GE = ['diode', { part: '1N34A' }];
const TUNE = (position) => ['tuning_cap', { minFarads: 10e-12, maxFarads: 500e-12, position }];
const EP = ['earphone', { type: 'crystal' }];

const BAT6 = ['vsource', { volts: 6 }];

/**
 * The superhet's broadcast: the usual three medium-wave stations and one at
 * 1200 kHz (a strong one) — where the image of the 612 kHz station falls when the IF is
 * pulled down to about 295 kHz.
 */
const SUPERHET_STATIONS = [
    { id: 'rf612', name: 'Local 612 kHz', hz: 612e3, fieldVPerM: 0.02, depth: 0.5, audio: { type: 'tone', hz: 400 } },
    { id: 'rf810', name: '810 kHz', hz: 810e3, fieldVPerM: 0.008, depth: 0.6, audio: { type: 'two-tone', hz: [600, 900], period: 0.4 } },
    { id: 'rf1200', name: '1200 kHz', hz: 1200e3, fieldVPerM: 0.1, depth: 0.6, audio: { type: 'tone', hz: 1000 } },
    { id: 'rf1215', name: '1215 kHz', hz: 1215e3, fieldVPerM: 0.003, depth: 0.5, audio: { type: 'tone', hz: 1000 } },
];

/** The superhet's netlist; `games` adds the low-IF and loose-antenna switches. */
function SUPERHET(games) {
    const parts = { bat: BAT6, gnd: ['gnd', {}], ant: ['antenna', { stations: SUPERHET_STATIONS }], earth: ['earth', {}],
        l1: ['ferrite_coil', { couplingRatio: 0.15, rodHeightM: 0 }], tc1: TUNE(0.512),
        m: ['nmos', {}], rs: R(330), cs: C(100e-9), rg1: R(100000), rg2: R(68000), cg2: C(10e-9), rdr: R(2200), ck: C(1e-9),
        u: ['sa612', {}], cb: C(100e-9), co1: C(220e-12), co2: C(470e-12), cl: C(10e-9),
        l2: ['ferrite_coil', { henrys: 100e-6, rodHeightM: 0 }], tc2: TUNE(0.127),
        l3: ['ferrite_coil', { henrys: 25e-6, tap: 0.5, couplingRatio: 0.3, rodHeightM: 0 }], cif: C(4.7e-9), tc3: TUNE(0.38),
        rb1: R(47000), rb2: R(10000), cbb: C(10e-9), q: NPN, re: R(1000), ce: C(100e-9), rc: R(4700),
        cc: C(10e-9), d: GE, cd: C(2.2e-9), rd: R(47000), ci: C(100e-9), au: ['lm386', {}], cou: EL(220e-6), spk: ['speaker', { ohms: 8 }] };
    if (games) Object.assign(parts, { sif: ['slide_switch', { position: 0 }], clow: C(6.8e-9), sant: ['slide_switch', { position: 0 }], cant: C(10e-12) });
    const gndNet = ['bat.neg', 'gnd.gnd', 'earth.earth', 'l1.a', 'tc1.b', 'rs.b', 'cs.b', 'rg2.b', 'cg2.b', 'u.gnd', 'cb.b', 'co2.b',
        'l2.a', 'tc2.b', 'rb2.b', 'cbb.b', 're.b', 'ce.b', 'cd.b', 'rd.b', 'au.gnd', 'au.inn', 'spk.b'];
    const nets = [
        games ? ['ant.a', 'sant.com'] : ['ant.a', 'l1.tap'],
        ['l1.b', 'tc1.a'], ['l1.c1', 'm.gate'], ['m.source', 'rs.a', 'cs.a'], ['rg1.b', 'rg2.a', 'cg2.a', 'l1.c2'],
        ['m.drain', 'rdr.b', 'ck.a'], ['ck.b', 'u.in_a'], ['u.in_b', 'cb.a'],
        ['u.osc_b', 'co1.a', 'cl.a'], ['u.osc_e', 'co1.b', 'co2.a'], ['cl.b', 'l2.b', 'tc2.a'],
        ['u.out_a', 'l3.a', 'cif.a', 'tc3.a'], ['u.out_b', 'l3.b', 'cif.b', 'tc3.b', ...(games ? ['sif.b'] : [])],
        ['l3.c1', 'q.base'], ['l3.c2', 'rb1.b', 'rb2.a', 'cbb.a'], ['q.emitter', 're.a', 'ce.a'], ['q.collector', 'rc.b', 'cc.a'],
        ['cc.b', 'd.anode'], ['d.cathode', 'cd.a', 'rd.a', 'ci.a'], ['ci.b', 'au.inp'], ['au.vout', 'cou.pos'], ['cou.neg', 'spk.a'],
        ['bat.pos', 'rg1.a', 'rdr.a', 'u.vcc', 'l3.tap', 'rb1.a', 'rc.a', 'au.vs'],
        gndNet,
    ];
    if (games) {
        nets.push(['sif.com', 'clow.a'], ['sant.a', 'l1.tap', 'cant.b'], ['sant.b', 'cant.a']);
        nets.find(n => n.includes('u.out_a')).push('clow.b');
    }
    return { vcc: 6, supply: SUP, parts, nets,
        open: ['l2.tap', 'l2.c1', 'l2.c2', 'au.gain1', 'au.gain8', 'au.bypass', ...(games ? ['sif.a'] : [])] };
}

export const BENCHES = {
    // A spark transmitter. 470 µF charged from the 9 V battery through 1 kΩ
    // is dumped by a push button through the winding of an UNTUNED ferrite
    // rod. The button's contact bounces (four reversals within 3 ms): each
    // make and break switches the coil's current in well under a
    // microsecond, and a current that steps carries every frequency at
    // once. A receiver 30 cm away — a second rod with its tuning
    // capacitor, an antenna on its tap for the stations, a germanium
    // diode into 47 kΩ ‖ 2.2 nF and an LM386 driving a loudspeaker — clicks
    // at every setting of its dial, while a broadcast station is heard only
    // at its own setting.
    'lab-spark-transmitter': {
        vcc: 9, supply: SUP,
        parts: { bat: BAT9, gnd: ['gnd', {}], rc: R(1000), cs: EL(470e-6), key: ['button', { bounceMs: 3, bounces: 4 }],
            lt: ['ferrite_coil', { rodHeightM: 0 }],
            ant: ['antenna', {}], earth: ['earth', {}],
            lr: ['ferrite_coil', { linkTo: 'ferrite_coil_7', distanceM: 0.3 }], tc: TUNE(0.5),
            d: GE, cd: C(2.2e-9), rd: R(47000), ci: C(100e-9), u: ['lm386', {}], co: EL(220e-6), spk: ['speaker', { ohms: 8 }] },
        nets: [
            ['bat.pos', 'rc.a', 'u.vs'], ['rc.b', 'cs.pos', 'key.a'], ['key.b', 'lt.b'],
            ['ant.a', 'lr.tap'], ['lr.b', 'tc.a', 'd.anode'], ['d.cathode', 'cd.a', 'rd.a', 'ci.a'], ['ci.b', 'u.inp'],
            ['u.vout', 'co.pos'], ['co.neg', 'spk.a'],
            ['bat.neg', 'gnd.gnd', 'cs.neg', 'lt.a', 'earth.earth', 'lr.a', 'tc.b', 'cd.b', 'rd.b', 'u.gnd', 'u.inn', 'spk.b'],
        ],
        open: ['lt.tap', 'lt.c1', 'lt.c2', 'lr.c1', 'lr.c2', 'u.gain1', 'u.gain8', 'u.bypass'],
    },

    // The chopped spark: a two-transistor astable (47 kΩ, 10 nF: about
    // 1.5 kHz) with an untuned ferrite rod and 1 kΩ as one collector load.
    // Every time that transistor switches, the rod's current jumps and its
    // field steps: the receiver 30 cm away (the spark transmitter's) rings
    // 1500 times a second and plays a musical tone at any setting of its
    // dial. The astable takes its supply through 47 Ω and 22 µF, so its
    // current steps do not reach the amplifier's supply.
    'lab-chopped-spark': {
        vcc: 9, supply: SUP,
        parts: { bat: BAT9, gnd: ['gnd', {}], rf: R(47), cf: EL(22e-6),
            lt: ['ferrite_coil', { rodHeightM: 0 }], rl: R(1000), rc2: R(1000), rb1: R(47000), rb2: R(47000),
            c1: C(10e-9), c2: C(10e-9), q1: NPN, q2: NPN,
            ant: ['antenna', {}], earth: ['earth', {}],
            lr: ['ferrite_coil', { linkTo: 'ferrite_coil_6', distanceM: 0.3 }], tc: TUNE(0.5),
            d: GE, cd: C(2.2e-9), rd: R(47000), ci: C(100e-9), u: ['lm386', {}], co: EL(220e-6), spk: ['speaker', { ohms: 8 }] },
        nets: [
            ['bat.pos', 'rf.a', 'u.vs'], ['rf.b', 'cf.pos', 'lt.a', 'rc2.a', 'rb1.a', 'rb2.a'],
            ['lt.b', 'rl.a'], ['rl.b', 'q1.collector', 'c1.a'], ['c1.b', 'rb2.b', 'q2.base'],
            ['rc2.b', 'q2.collector', 'c2.a'], ['c2.b', 'rb1.b', 'q1.base'],
            ['ant.a', 'lr.tap'], ['lr.b', 'tc.a', 'd.anode'], ['d.cathode', 'cd.a', 'rd.a', 'ci.a'], ['ci.b', 'u.inp'],
            ['u.vout', 'co.pos'], ['co.neg', 'spk.a'],
            ['bat.neg', 'gnd.gnd', 'cf.neg', 'q1.emitter', 'q2.emitter', 'earth.earth', 'lr.a', 'tc.b', 'cd.b', 'rd.b', 'u.gnd', 'u.inn', 'spk.b'],
        ],
        open: ['lt.tap', 'lt.c1', 'lt.c2', 'lr.c1', 'lr.c2', 'u.gain1', 'u.gain8', 'u.bypass'],
    },

    // Tuning with the coil. A ferrite rod whose small winding (0.3 of the
    // main winding's turns) slides along it: the rod's dial moves it from
    // the middle (0) to the end (1). Two slide switches put the small
    // winding in series with the main one, either way round: both at
    // 0 (b to c1, the top at c2) the windings aid, both at 1 (b to c2, the
    // top at c1) they oppose. The series pair with the tuning capacitor is
    // the tank of a crystal set (antenna on the tap) feeding an LM386 and
    // a loudspeaker.
    'lab-sliding-winding': {
        vcc: 9, supply: SUP,
        parts: { bat: BAT9, gnd: ['gnd', {}], ant: ['antenna', {}], earth: ['earth', {}],
            l: ['ferrite_coil', { couplingRatio: 0.3, slideWinding: true, slide: 0 }],
            s1: ['slide_switch', { position: 0 }], s2: ['slide_switch', { position: 0 }], tc: TUNE(0.5),
            d: GE, cd: C(2.2e-9), rd: R(47000), ci: C(100e-9), u: ['lm386', {}], co: EL(220e-6), spk: ['speaker', { ohms: 8 }] },
        nets: [
            ['ant.a', 'l.tap'], ['l.b', 's1.com'], ['s1.a', 'l.c1', 's2.b'], ['s1.b', 'l.c2', 's2.a'],
            ['s2.com', 'tc.a', 'd.anode'], ['d.cathode', 'cd.a', 'rd.a', 'ci.a'], ['ci.b', 'u.inp'],
            ['bat.pos', 'u.vs'], ['u.vout', 'co.pos'], ['co.neg', 'spk.a'],
            ['bat.neg', 'gnd.gnd', 'earth.earth', 'l.a', 'tc.b', 'cd.b', 'rd.b', 'u.gnd', 'u.inn', 'spk.b'],
        ],
        open: ['u.gain1', 'u.gain8', 'u.bypass'],
    },
    // A medium-wave superhet. Antenna on the tap of a ferrite rod tuned by
    // the first tuning capacitor; its coupling winding drives the gate of an
    // n-channel MOSFET, biased at 2.4 V from a divider (100 kΩ / 68 kΩ held
    // by 10 nF at the winding's cold end; source 330 Ω ‖ 100 nF), whose
    // drain (2.2 kΩ) feeds input A of the mixer IC through 1 nF. The mixer's
    // own transistor is a Colpitts oscillator (220 pF / 470 pF, 100 µH ‖ the
    // second tuning capacitor, through 10 nF) running 455 kHz above the
    // station. Its two outputs drive the ends of the IF coil (25 µH, tap at
    // its middle to the supply) in push-pull, so only their difference — the
    // mixing product — reaches the IF tank (4.7 nF plus a trimmer), and
    // whatever reaches both outputs alike cancels. The IF coil's coupling
    // winding drives a one-transistor IF amplifier, a germanium diode
    // detects its collector, an LM386 plays it. 6 V supply.
    //
    // Two slide switches for the superhet's games. "Low IF" (right): 6.8 nF
    // across the IF tank pulls the IF from 455 kHz down to about 295 kHz;
    // the oscillator, retuned, sits 295 kHz above the station, and the image
    // — 295 kHz above the oscillator — falls on the 1200 kHz station, which
    // the aerial tank tuned to 612 kHz does not keep out entirely. "Loose"
    // (right): the antenna moves from the rod's tap to a 10 pF capacitor.
    'lab-superhet': SUPERHET(true),
};
