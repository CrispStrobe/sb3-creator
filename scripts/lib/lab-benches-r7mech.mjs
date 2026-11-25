/**
 * Netlists for the magnetic-coupling benches: a pickup coil that overhears
 * the magnetic field of a loaded cable and of a telephone's coil, a coil that
 * kicks a paper-clip pendulum in step with its swing, and a click sent across
 * a hand's width by a coil's current pulse. Written by
 * `node scripts/gen-lab-circuits-4.mjs --set=r7mech`.
 *
 * Same shape as lab-benches-8.mjs: pure data, so
 * test/lab-circuits-r7mech.test.mjs names parts by role. Ids follow benchIds
 * (breadboard first, then the parts in the order listed); a field source's
 * `pickup` names its pickup coil's id, filled in from that order below.
 *
 * The engine (bw-board src/magnetic-coupling.js): a field source
 * (`induction_loop`: a loop, a wire or a two-core cable) couples to the
 * hand-wound pickup coil it names by the mutual inductance its geometry
 * gives at the distance its knob sets, solved as a transformer in the
 * transient solve; a `coil_pendulum` is an electromagnet with a pendulum
 * beside its pole, integrated with the coil's current.
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
const PICKUP = ['air_coil', { turns: 1000, radiusM: 0.015, lengthM: 0.03, wireMm: 0.2 }];

/** Point each field source's `pickup` at the id its coil gets. */
function linked(spec, pairs) {
    const ids = benchIds(spec);
    for (const [src, coil] of pairs) spec.parts[src][1].pickup = ids[coil];
    return spec;
}

export const BENCHES = {
    // Cable tracer and telephone listener. A 1000-turn pickup coil feeds a
    // one-transistor preamplifier (base divider 100 kΩ / 15 kΩ, 470 nF in,
    // 4.7 kΩ collector, 100 Ω + 390 Ω ‖ 47 µF emitter: gain ≈ 40) and,
    // through 100 nF and a 100 kΩ volume pot (resting at 80 %), an LM386
    // (gain 200: 10 µF across pins 1–8) driving the loudspeaker. Small
    // coupling capacitors keep the switch-on transient short. Two field
    // sources, each with a distance dial: a two-core cable carrying a 12 V
    // AC lamp's current (50 Hz; the lamp switched by a slide switch) and a
    // telephone's coil carrying an 800 Hz tone (0.3 V through 100 Ω into a
    // 200-turn loop; its dial reaches out to 60 cm). The generators stand
    // in for the lamp transformer and the telephone line.
    'lab-cable-tracer': linked({
        vcc: 9, supply: SUP,
        parts: { bat: BAT9, coil: PICKUP,
            ci: C(470e-9), q: NPN, r1: R(100000), r2: R(15000), rc: R(4700), re1: R(100), re2: R(390), ce: EL(47e-6),
            co: C(100e-9), vol: POT(100000, 0.8),
            u: ['lm386', {}], cg: EL(10e-6), cb: EL(10e-6), cout: EL(220e-6), spk: ['speaker', { ohms: 8 }], cs: EL(100e-6),
            mains: ['function_gen', { wave: 'sine', freq: 50, amplitude: 17, offset: 0, rOut: 0.5 }],
            cable: ['induction_loop', { shape: 'cable', spacingMm: 6, position: 0.2 }],
            lampsw: ['slide_switch', { position: 0 }], lamp: ['light_bulb', { ohms: 7.2 }],
            line: ['function_gen', { wave: 'sine', freq: 800, amplitude: 0.3, offset: 0, rOut: 0 }], rl: R(100),
            phone: ['induction_loop', { shape: 'loop', turns: 200, radiusM: 0.02, wireMm: 0.3, farCm: 60, position: 0.2 }] },
        nets: [
            ['coil.a', 'ci.a'], ['ci.b', 'q.base', 'r1.b', 'r2.a'], ['q.collector', 'rc.b', 'co.a'], ['q.emitter', 're1.a'], ['re1.b', 're2.a', 'ce.pos'],
            ['co.b', 'vol.a'], ['vol.wiper', 'u.inp'], ['u.gain1', 'cg.pos'], ['cg.neg', 'u.gain8'],
            ['u.bypass', 'cb.pos'], ['u.vout', 'cout.pos'], ['cout.neg', 'spk.a'],
            ['bat.pos', 'r1.a', 'rc.a', 'u.vs', 'cs.pos'],
            ['mains.out', 'cable.a'], ['cable.b', 'lampsw.com'], ['lampsw.a', 'lamp.a'],
            ['line.out', 'rl.a'], ['rl.b', 'phone.a'],
            ['bat.neg', 'coil.b', 'r2.b', 're2.b', 'ce.neg', 'vol.b', 'u.gnd', 'u.inn', 'cb.neg', 'spk.b', 'cs.neg',
                'mains.gnd', 'lamp.b', 'line.gnd', 'phone.b'],
        ],
        open: ['lampsw.b'],
    }, [['cable', 'coil'], ['phone', 'coil']]),

    // A coil that kicks a pendulum. Two NPN transistors as an astable: Q1
    // carries the electromagnet (a wound rod; a paper clip hangs on a 15 cm
    // thread beside its pole; 1N4148 across the winding) for ≈0.1 s
    // (10 kΩ, 15 µF), then rests for a time set by 4.7 kΩ plus the 47 kΩ
    // pot and 220 µF (pot position 1: 4.7 kΩ, pulses ≈2.6 Hz; position 0:
    // 51.7 kΩ, ≈0.35 Hz); the LED in Q2's collector lights during the
    // rest. The clip hangs 8 mm above and 20 mm beside the pole.
    'lab-pendulum-kick': {
        vcc: 9, supply: SUP,
        parts: { bat: BAT9, pend: ['coil_pendulum', { bob: 'iron', lengthM: 0.15, gapMm: 8 }], d: ['diode', { part: '1N4148' }],
            q1: NPN, q2: NPN, c1: EL(15e-6), c2: EL(220e-6), rb2: R(10000), rb1: R(4700), pot: POT(47000, 1),
            rled: R(1000), led: LED('green') },
        nets: [
            ['bat.pos', 'pend.a', 'd.cathode', 'rb2.a', 'rb1.a', 'rled.a'],
            ['pend.b', 'd.anode', 'q1.collector', 'c1.pos'], ['c1.neg', 'q2.base', 'rb2.b'],
            ['rled.b', 'led.anode'], ['led.cathode', 'q2.collector', 'c2.pos'], ['c2.neg', 'q1.base', 'pot.wiper'],
            ['rb1.b', 'pot.a'],
            ['bat.neg', 'q1.emitter', 'q2.emitter'],
        ],
        open: ['pot.b'],
    },

    // A click without a wire. Pressing the button sends 9 V through 10 Ω
    // into a 20-turn coil 6 cm across; a second coil (1000 turns) a hand's
    // width away (8 cm, its knob) feeds a germanium diode and a crystal
    // earphone with 100 kΩ across it. The current step's changing field
    // induces a pulse in the second coil: the earphone clicks.
    'lab-wireless-click': linked({
        vcc: 9, supply: SUP,
        parts: { bat: BAT9, key: ['button', {}], rs: R(10),
            tx: ['induction_loop', { shape: 'loop', turns: 20, radiusM: 0.03, wireMm: 0.5, position: 0.76 }],
            coil: PICKUP, d: ['diode', { part: '1N34A' }], ep: ['earphone', { type: 'crystal' }], rl: R(100000) },
        nets: [
            ['bat.pos', 'key.a'], ['key.b', 'rs.a'], ['rs.b', 'tx.a'],
            ['coil.a', 'd.anode'], ['d.cathode', 'ep.a', 'rl.a'],
            ['bat.neg', 'tx.b', 'coil.b', 'ep.b', 'rl.b'],
        ],
    }, [['tx', 'coil']]),
};
