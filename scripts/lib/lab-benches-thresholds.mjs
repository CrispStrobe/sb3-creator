/**
 * Netlists for two threshold benches, written by
 * `node scripts/gen-lab-circuits-4.mjs --set=thresholds`.
 *
 * lab-opamp-key-finder-leds: the op-amp key finder of lab-opamp-key-finder
 * (set r10c) with its voltmeter replaced by two threshold LEDs, driven by a
 * second LM324: the sound level against the THRESHOLD knob, shown the way a
 * learner sets it, by eye.
 *
 * lab-relay-hysteresis: a relay's two thresholds. An emitter follower puts a
 * pot's voltage on the coil; the armature pulls in only above pullInV and
 * lets go only below dropOutV, so between the two it stays as it was.
 *
 * Same shape as lab-benches-4.mjs: pure data, so test/lab-circuits-thresholds.test.mjs
 * names parts by role. Ids follow benchIds (breadboard first, then the parts
 * in the order listed).
 */
import { benchIds } from './lab-benches-4.mjs';
export { benchIds };

const SUP = { pos: 'bat.pos', neg: 'bat.neg' };
const R = (ohms) => ['resistor', { ohms }];
const C = (farads) => ['capacitor', { farads }];
const EL = (farads) => ['polarized_cap', { farads }];
const LED = (color) => ['led', { color }];
const POT = (ohms, position) => ['potentiometer', { ohms, position }];
const SLIDE = (position = 0) => ['slide_switch', { position }];
const BTN = ['button', {}];
const SI = ['diode', { part: '1N4148' }];
const BAT9 = ['vsource', { volts: 9, variant: '9v' }];
const QUAD = ['lm324', {}];
const NPN = ['npn', { beta: 100 }];
const VM = ['voltmeter', {}];

export const BENCHES = {
    // A key finder with threshold LEDs. The gain chain and the latch are
    // lab-opamp-key-finder's: the loudspeaker as microphone, LM324 section 1
    // ×100 and section 2 ×30 around a 4.5 V midpoint, SENSITIVE (slide
    // switch) adding section 3 (×10); section 4 latches the ALARM once the
    // signal's peaks (through a diode, 1 MΩ to ground) pass THRESHOLD, holds
    // itself through a diode and 47 kΩ, and only RESET clears it.
    //
    // The threshold LEDs. A second diode charges 470 nF from the same signal
    // (1 MΩ drains it in about half a second): the sound LEVEL, a line the
    // latch's feedback never touches. A second LM324 compares it with the
    // THRESHOLD wiper both ways: section 1 lights the red OVER LED when the
    // level is above it, section 2 the green UNDER LED when below. Exactly
    // one is lit; the knob is set where a sound that must not count leaves
    // UNDER lit and the whistle turns OVER on. Sections 3 and 4 are parked.
    'lab-opamp-key-finder-leds': {
        vcc: 9, supply: SUP,
        parts: { bat: BAT9, mic: ['speaker', { ohms: 8, soundDb: 0, soundWave: 'tone', soundHz: 2000 }], u: QUAD,
            ma: R(10000), mb: R(10000), mc: EL(1e-6),
            c1: EL(4.7e-6), r1: R(1000), f1: R(100000), c2: EL(4.7e-6), r2: R(3300), f2: R(100000),
            c3: EL(4.7e-6), r3: R(10000), f3: R(100000), sens: SLIDE(0),
            dpk: SI, rpk: R(1000000), thr: POT(10000, 0.55), dh: SI, rh: R(47000), reset: BTN, rrs: R(1000),
            ra: R(1000), alarm: LED('red'),
            dl: SI, cl: C(470e-9), rl: R(1000000), w: QUAD, ro: R(1000), over: LED('red'), rn: R(1000), under: LED('green') },
        nets: [
            ['bat.pos', 'u.vcc', 'w.vcc', 'ma.a', 'thr.a'], ['ma.b', 'mb.a', 'mc.pos', 'u.1_pos', 'u.2_pos', 'u.3_pos', 'mic.b'],
            ['mic.a', 'c1.neg'], ['c1.pos', 'r1.a'], ['r1.b', 'f1.a', 'u.1_neg'],
            ['u.1_out', 'f1.b', 'c2.pos'], ['c2.neg', 'r2.a'], ['r2.b', 'f2.a', 'u.2_neg'],
            ['u.2_out', 'f2.b', 'c3.pos', 'sens.a'], ['c3.neg', 'r3.a'], ['r3.b', 'f3.a', 'u.3_neg'], ['u.3_out', 'f3.b', 'sens.b'],
            ['sens.com', 'dpk.anode', 'dl.anode'],
            ['dpk.cathode', 'rpk.a', 'dh.cathode', 'u.4_pos', 'reset.a'], ['thr.wiper', 'u.4_neg', 'w.1_neg', 'w.2_pos'],
            ['u.4_out', 'rh.a', 'ra.a'], ['rh.b', 'dh.anode'], ['reset.b', 'rrs.a'], ['ra.b', 'alarm.anode'],
            ['dl.cathode', 'cl.a', 'rl.a', 'w.1_pos', 'w.2_neg'],
            ['w.1_out', 'ro.a'], ['ro.b', 'over.anode'], ['w.2_out', 'rn.a'], ['rn.b', 'under.anode'],
            ['bat.neg', 'u.gnd', 'w.gnd', 'mb.b', 'mc.neg', 'rpk.b', 'thr.b', 'rrs.b', 'alarm.cathode',
                'cl.b', 'rl.b', 'over.cathode', 'under.cathode',
                'w.3_pos', 'w.3_neg', 'w.3_out', 'w.4_pos', 'w.4_neg', 'w.4_out'],
        ],
    },

    // A relay's hysteresis. LEVEL (10 kΩ pot across the 9 V battery) feeds
    // an NPN emitter follower through 1 kΩ; its emitter drives the 200 Ω
    // coil (a 1N4148 across it for the switch-off spike), and the voltmeter
    // reads the coil. The relay pulls in above 6 V and drops out below
    // 2.5 V: in between it keeps whatever state it had. Its changeover
    // contact (common on +9 V) lights the red IN LED (make side) or the green
    // OUT LED (rest side), each through 1 kΩ.
    //
    // TAP gives the coil a short push without touching LEVEL: the button
    // joins +9 V through 4.7 µF to the base, which jumps to the supply and
    // falls back to the LEVEL setting as the capacitor charges (about
    // 10 ms); 100 kΩ empties it again once the button is let go. With LEVEL
    // between the two thresholds one tap pulls the relay in for good.
    'lab-relay-hysteresis': {
        vcc: 9, supply: SUP,
        parts: { bat: BAT9, level: POT(10000, 0.5), rb: R(1000), q: NPN,
            k: ['relay', { coilR: 200, pullInV: 6, dropOutV: 2.5 }], df: SI, vm: VM,
            tap: BTN, ck: C(4.7e-6), rk: R(100000),
            rin: R(1000), lin: LED('red'), rout: R(1000), lout: LED('green') },
        nets: [
            ['bat.pos', 'level.a', 'q.collector', 'tap.a', 'k.com'],
            ['level.wiper', 'rb.a'], ['rb.b', 'q.base', 'ck.b'], ['tap.b', 'ck.a', 'rk.a'],
            ['q.emitter', 'k.coil_a', 'df.cathode', 'vm.a'],
            ['k.no', 'rin.a'], ['rin.b', 'lin.anode'], ['k.nc', 'rout.a'], ['rout.b', 'lout.anode'],
            ['bat.neg', 'level.b', 'k.coil_b', 'df.anode', 'vm.b', 'rk.b', 'lin.cathode', 'lout.cathode'],
        ],
    },
};

// Labels the learner sees on the controls and readouts the pages name.
const LABELS = {
    'lab-opamp-key-finder-leds': { mic: 'loudspeaker as microphone', sens: 'SENSITIVE', thr: 'THRESHOLD', reset: 'RESET',
        alarm: 'ALARM', over: 'OVER', under: 'UNDER' },
    'lab-relay-hysteresis': { level: 'LEVEL', tap: 'TAP', vm: 'coil volts', lin: 'IN', lout: 'OUT' },
};
for (const [id, names] of Object.entries(LABELS))
    for (const [name, label] of Object.entries(names)) {
        const [kind, params] = BENCHES[id].parts[name];
        BENCHES[id].parts[name] = [kind, params, label];
    }
