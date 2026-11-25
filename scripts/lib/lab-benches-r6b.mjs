/**
 * Netlists for the r6b lab benches: circuits built from NPN transistors and
 * an LM386 power amplifier only (no 555, no op-amp, no logic IC), written by
 * `node scripts/gen-lab-circuits-4.mjs --set=r6b`.
 *
 * Same shape as lab-benches-4.mjs: pure data, so
 * test/lab-circuits-r6b.test.mjs names parts by role. Ids follow benchIds
 * (breadboard first, then the parts in the order listed). A param written
 * '@name' (heatedBy) is resolved to that part's engine id below.
 *
 * THE LM386 AS A SWITCHING STAGE (bw-board src/lm386.js). With pins 1 and 8
 * open its output is vout = Vs/2 + 20·(v+ − v−), held inside 0.9 V .. Vs − 0.9 V.
 * A divider from the output back to +IN therefore gives it hysteresis, and an
 * RC from the output to −IN turns it into a relaxation oscillator. Each input
 * has 50 kΩ to ground inside the chip: the timing resistor from the output to
 * the capacitor must stay well below that, or the capacitor never reaches the
 * upper switching point.
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

function resolveRefs(benches) {
    for (const spec of Object.values(benches)) {
        const ids = benchIds(spec);
        for (const [, [, params]] of Object.entries(spec.parts)) {
            for (const k of ['heatedBy']) {
                const v = params?.[k];
                if (typeof v === 'string' && v.startsWith('@')) {
                    if (!ids[v.slice(1)]) throw new Error(`${k}: unknown role ${v}`);
                    params[k] = ids[v.slice(1)];
                }
            }
        }
    }
    return benches;
}

const PT = ['phototransistor', {}];
const SPK = ['speaker', { ohms: 8 }];
const EAR = ['earphone', { type: 'magnetic', ohms: 2000, henrys: 0.1 }];
const D4148 = ['diode', { part: '1N4148' }];
const VM = ['voltmeter', {}];

export const BENCHES = resolveRefs({
    // LM386 relaxation blinker: the output kicks +IN through the slide-switched
    // electrolytic (10 / 4.7 uF), the kick decays through 10 k || 50 k. Red LED
    // to ground, green from the battery: they alternate.
    'lab-amp-ic-blinker': {
        vcc: 9, supply: SUP,
        parts: { bat: BAT9, u: LM386, cs: SLIDE(0), c1: EL(10e-6), c2: EL(4.7e-6), rb: R(10000),
            rs1: R(1000), red: LED('red'), rs2: R(1000), green: LED('green') },
        nets: [
            ['bat.pos', 'u.vs', 'rs2.a'],
            ['u.vout', 'c1.pos', 'c2.pos', 'rs1.a', 'green.cathode'],
            ['cs.a', 'c1.neg'], ['cs.b', 'c2.neg'], ['cs.com', 'u.inp', 'rb.a'],
            ['rs1.b', 'red.anode'], ['rs2.b', 'green.anode'],
            ['bat.neg', 'u.gnd', 'u.inn', 'rb.b', 'red.cathode'],
        ],
        open: ['u.gain1', 'u.gain8', 'u.bypass'],
    },

    // The 10 uF blinker also feeds a speaker through 47 uF + 47 ohm: one tick per
    // output edge, silence in between.
    'lab-amp-ic-ticker': {
        vcc: 9, supply: SUP,
        parts: { bat: BAT9, u: LM386, cf: EL(10e-6), rb: R(10000),
            rs1: R(1000), red: LED('red'), rs2: R(1000), green: LED('green'),
            co: EL(47e-6), rsp: R(47), spk: SPK },
        nets: [
            ['bat.pos', 'u.vs', 'rs2.a'],
            ['u.vout', 'cf.pos', 'rs1.a', 'green.cathode', 'co.pos'],
            ['cf.neg', 'u.inp', 'rb.a'], ['co.neg', 'rsp.a'], ['rsp.b', 'spk.a'],
            ['rs1.b', 'red.anode'], ['rs2.b', 'green.anode'],
            ['bat.neg', 'u.gnd', 'u.inn', 'rb.b', 'red.cathode', 'spk.b'],
        ],
        open: ['u.gain1', 'u.gain8', 'u.bypass'],
    },

    // Blinker whose +IN resistance is 1 k + a 47 k pot (variable resistor):
    // ticks at 2.5 Hz at one end, a 60 Hz buzz at the other.
    'lab-amp-ic-spokes': {
        vcc: 9, supply: SUP,
        parts: { bat: BAT9, u: LM386, cf: EL(2.2e-6), rf: R(1000), rate: POT(47000, 0),
            rs: R(1000), led: LED('yellow'), co: EL(47e-6), rsp: R(47), spk: SPK },
        nets: [
            ['bat.pos', 'u.vs'],
            ['u.vout', 'cf.pos', 'rs.a', 'co.pos'],
            ['cf.neg', 'u.inp', 'rf.a'], ['rf.b', 'rate.a'], ['co.neg', 'rsp.a'], ['rsp.b', 'spk.a'],
            ['rs.b', 'led.anode'],
            ['bat.neg', 'u.gnd', 'u.inn', 'rate.wiper', 'led.cathode', 'spk.b'],
        ],
        open: ['u.gain1', 'u.gain8', 'u.bypass', 'rate.b'],
    },

    // LM386 one-shot: -IN held at 1.49 V, 100 uF from the output to +IN, the
    // button lifts +IN through 2.2 k; the green time follows 10 k + pot.
    'lab-amp-ic-pedestrian': {
        vcc: 9, supply: SUP,
        parts: { bat: BAT9, u: LM386, ra: R(100000), rn: R(33000), btn: ['button', {}], rt: R(2200),
            ct: EL(100e-6), rd: R(10000), time: POT(100000, 1),
            rs1: R(1000), red: LED('red'), rs2: R(1000), green: LED('green') },
        nets: [
            ['bat.pos', 'u.vs', 'ra.a', 'btn.a', 'rs1.a'],
            ['ra.b', 'rn.a', 'u.inn'], ['btn.b', 'rt.a'],
            ['rt.b', 'u.inp', 'ct.neg', 'rd.a'], ['rd.b', 'time.wiper'],
            ['u.vout', 'ct.pos', 'red.cathode', 'rs2.a'],
            ['rs1.b', 'red.anode'], ['rs2.b', 'green.anode'],
            ['bat.neg', 'u.gnd', 'rn.b', 'time.b', 'green.cathode'],
        ],
        open: ['u.gain1', 'u.gain8', 'u.bypass', 'time.a'],
    },

    // The same one-shot with a phototransistor (1 mA at full light) as the
    // timing discharge: brighter, shorter.
    'lab-amp-ic-exposure': {
        vcc: 9, supply: SUP,
        parts: { bat: BAT9, u: LM386, ra: R(100000), rn: R(33000), btn: ['button', {}], rt: R(2200),
            ct: EL(47e-6), pt: ['phototransistor', { iMax: 0.001 }],
            rs1: R(1000), red: LED('red'), rs2: R(1000), green: LED('green') },
        nets: [
            ['bat.pos', 'u.vs', 'ra.a', 'btn.a', 'rs1.a'],
            ['ra.b', 'rn.a', 'u.inn'], ['btn.b', 'rt.a'],
            ['rt.b', 'u.inp', 'ct.neg', 'pt.collector'],
            ['u.vout', 'ct.pos', 'red.cathode', 'rs2.a'],
            ['rs1.b', 'red.anode'], ['rs2.b', 'green.anode'],
            ['bat.neg', 'u.gnd', 'rn.b', 'pt.emitter', 'green.cathode'],
        ],
        open: ['u.gain1', 'u.gain8', 'u.bypass'],
    },

    // LM386 follower (-IN tied to the output) copying a pot's wiper to an LED.
    'lab-amp-ic-dimmer': {
        vcc: 9, supply: SUP,
        parts: { bat: BAT9, knob: POT(10000, 0.5), u: LM386, rs: R(470), led: LED('red'), vm: VM },
        nets: [
            ['bat.pos', 'u.vs', 'knob.a'], ['knob.wiper', 'u.inp'],
            ['u.vout', 'u.inn', 'rs.a', 'vm.a'], ['rs.b', 'led.anode'],
            ['bat.neg', 'u.gnd', 'knob.b', 'led.cathode', 'vm.b'],
        ],
        open: ['u.gain1', 'u.gain8', 'u.bypass'],
    },

    // Follower with a red LED to ground and a green one from the battery; the
    // slide switch grounds 470 uF at +IN (through 2.2 k) to make it lag.
    'lab-amp-ic-balance': {
        vcc: 9, supply: SUP,
        parts: { bat: BAT9, knob: POT(10000, 0.5), rl: R(2200), lag: SLIDE(0), cl: EL(470e-6), u: LM386,
            rs1: R(470), red: LED('red'), rs2: R(470), green: LED('green') },
        nets: [
            ['bat.pos', 'u.vs', 'knob.a', 'rs2.a'], ['knob.wiper', 'rl.a'],
            ['rl.b', 'u.inp', 'cl.pos'], ['cl.neg', 'lag.b'],
            ['u.vout', 'u.inn', 'rs1.a', 'green.cathode'], ['rs1.b', 'red.anode'], ['rs2.b', 'green.anode'],
            ['bat.neg', 'u.gnd', 'knob.b', 'lag.com', 'red.cathode'],
        ],
        open: ['u.gain1', 'u.gain8', 'u.bypass', 'lag.a'],
    },

    // LM386 Schmitt-trigger oscillator charging through 4.7 k and an LED (red or
    // green): the LED's forward voltage sets the pitch; discharge via 1N4148.
    'lab-amp-ic-colour-pitch': {
        vcc: 9, supply: SUP,
        parts: { bat: BAT9, u: LM386, r1: R(47000), r2: R(100000), rt: R(4700), colour: SLIDE(0),
            red: LED('red'), green: LED('green'), d: D4148, rd: R(4700),
            size: SLIDE(0), ct1: C(100e-9), ct2: C(470e-9), co: EL(47e-6), rsp: R(47), spk: SPK },
        nets: [
            ['bat.pos', 'u.vs', 'r2.a'], ['r1.b', 'r2.b', 'u.inp'],
            ['u.vout', 'r1.a', 'rt.a', 'rd.b', 'co.pos'],
            ['rt.b', 'colour.com'], ['colour.a', 'red.anode'], ['colour.b', 'green.anode'],
            ['red.cathode', 'green.cathode', 'u.inn', 'd.anode', 'size.com'], ['d.cathode', 'rd.a'],
            ['size.a', 'ct1.a'], ['size.b', 'ct2.a'], ['co.neg', 'rsp.a'], ['rsp.b', 'spk.a'],
            ['bat.neg', 'u.gnd', 'ct1.b', 'ct2.b', 'spk.b'],
        ],
        open: ['u.gain1', 'u.gain8', 'u.bypass'],
    },

    // Schmitt-trigger oscillator with a phototransistor beside the 10 k charging
    // resistor: light raises the pitch.
    'lab-amp-ic-light-tone': {
        vcc: 9, supply: SUP,
        parts: { bat: BAT9, u: LM386, r1: R(47000), r2: R(47000), rt: R(10000), pt: PT,
            size: SLIDE(0), ct1: C(100e-9), ct2: C(470e-9), co: EL(47e-6), rsp: R(47), spk: SPK },
        nets: [
            ['bat.pos', 'u.vs', 'r2.a'], ['r1.b', 'r2.b', 'u.inp'],
            ['u.vout', 'r1.a', 'rt.a', 'pt.collector', 'co.pos'],
            ['rt.b', 'pt.emitter', 'u.inn', 'size.com'],
            ['size.a', 'ct1.a'], ['size.b', 'ct2.a'], ['co.neg', 'rsp.a'], ['rsp.b', 'spk.a'],
            ['bat.neg', 'u.gnd', 'ct1.b', 'ct2.b', 'spk.b'],
        ],
        open: ['u.gain1', 'u.gain8', 'u.bypass'],
    },

    // Speaker as microphone, pot across its coil as sensitivity, LM386 at gain
    // 200, earphone through 220 uF.
    'lab-amp-ic-baby-monitor': {
        vcc: 9, supply: SUP,
        parts: { bat: BAT9, mic: ['speaker', { ohms: 8, soundDb: 85, soundWave: 'voice', soundHz: 200 }],
            sens: POT(10000, 1), u: LM386, cg: EL(10e-6), co: EL(220e-6), ep: EAR },
        nets: [
            ['bat.pos', 'u.vs'], ['mic.a', 'sens.a'], ['sens.wiper', 'u.inp'],
            ['u.gain1', 'cg.pos'], ['u.gain8', 'cg.neg'], ['u.vout', 'co.pos'], ['co.neg', 'ep.a'],
            ['bat.neg', 'mic.b', 'sens.b', 'u.gnd', 'u.inn', 'ep.b'],
        ],
        open: ['u.bypass'],
    },

    // Two-NPN astable keyed by a button, switchable attenuator (220 k / 10 k into
    // 1 k), LM386 with an optional gain resistor across pins 1-8, speaker.
    'lab-morse-power-amp': {
        vcc: 9, supply: SUP,
        parts: { bat: BAT9, key: ['button', {}], q1: NPN, q2: NPN, rc1: R(1000), rc2: R(1000),
            rb1: R(27000), rb2: R(27000), c1: C(33e-9), c2: C(33e-9), cc: C(100e-9),
            att: SLIDE(0), ra1: R(220000), ra2: R(10000), rg: R(1000),
            u: LM386, gain: SLIDE(0), cg: EL(10e-6), rgn: R(470), co: EL(220e-6), spk: SPK },
        nets: [
            ['bat.pos', 'u.vs', 'key.a'], ['key.b', 'rc1.a', 'rc2.a', 'rb1.a', 'rb2.a'],
            ['q1.collector', 'rc1.b', 'c1.a'], ['c1.b', 'q2.base', 'rb2.b'],
            ['q2.collector', 'rc2.b', 'c2.a', 'cc.a'], ['c2.b', 'q1.base', 'rb1.b'],
            ['cc.b', 'att.com'], ['att.a', 'ra1.a'], ['att.b', 'ra2.a'], ['ra1.b', 'ra2.b', 'rg.a', 'u.inp'],
            ['u.gain1', 'cg.pos'], ['cg.neg', 'rgn.a'], ['rgn.b', 'gain.b'], ['gain.com', 'u.gain8'],
            ['u.vout', 'co.pos'], ['co.neg', 'spk.a'],
            ['bat.neg', 'q1.emitter', 'q2.emitter', 'rg.b', 'u.gnd', 'u.inn', 'spk.b'],
        ],
        open: ['u.bypass', 'gain.a'],
    },

    // Slow two-NPN astable (red / blue LEDs); while Q2 is off its collector adds
    // charging current through 1N4148 + 2.2 k + pot to the LM386 oscillator,
    // which discharges fast through 1N4148 + 1 k: the tone doubles.
    'lab-amp-ic-siren': {
        vcc: 9, supply: SUP,
        parts: { bat: BAT9, q1: NPN, q2: NPN, rc1: R(1000), rc2: R(1000), rl1: R(1000), l1: LED('red'), rl2: R(1000), l2: LED('blue'),
            rb1: R(33000), rb2: R(33000), c1: EL(22e-6), c2: EL(22e-6),
            dm: D4148, rm: R(2200), pm: POT(22000, 0.5),
            u: LM386, r1: R(47000), r2: R(47000), rt: R(10000), dd: D4148, rd: R(1000), ct: C(100e-9),
            co: EL(47e-6), rsp: R(47), spk: SPK },
        nets: [
            ['bat.pos', 'rc1.a', 'rc2.a', 'rl1.a', 'rl2.a', 'rb1.a', 'rb2.a', 'u.vs', 'r2.a'],
            ['rl1.b', 'l1.anode'], ['rl2.b', 'l2.anode'],
            ['q1.collector', 'rc1.b', 'l1.cathode', 'c1.pos'], ['c1.neg', 'q2.base', 'rb2.b'],
            ['q2.collector', 'rc2.b', 'l2.cathode', 'c2.pos', 'dm.anode'], ['c2.neg', 'q1.base', 'rb1.b'],
            ['dm.cathode', 'rm.a'], ['rm.b', 'pm.a'], ['pm.wiper', 'u.inn', 'rt.b', 'ct.a', 'dd.anode'], ['dd.cathode', 'rd.a'],
            ['r1.b', 'r2.b', 'u.inp'], ['u.vout', 'r1.a', 'rt.a', 'rd.b', 'co.pos'], ['co.neg', 'rsp.a'], ['rsp.b', 'spk.a'],
            ['bat.neg', 'q1.emitter', 'q2.emitter', 'u.gnd', 'ct.b', 'spk.b'],
        ],
        open: ['u.gain1', 'u.gain8', 'u.bypass', 'pm.b'],
    },

    // Slow two-NPN astable; a 1N4148 from the LM386 timing capacitor to Q1's
    // collector clamps it while Q1 is on: tone fully on / off.
    'lab-amp-ic-beeps': {
        vcc: 9, supply: SUP,
        parts: { bat: BAT9, q1: NPN, q2: NPN, rc1: R(2200), rl2: R(1000), l2: LED('green'),
            rb1: R(47000), rb2: R(47000), c1: EL(10e-6), c2: EL(10e-6), dg: D4148,
            u: LM386, r1: R(47000), r2: R(47000), rt: R(10000), ct: C(100e-9), co: EL(47e-6), rsp: R(47), spk: SPK },
        nets: [
            ['bat.pos', 'rc1.a', 'rl2.a', 'rb1.a', 'rb2.a', 'u.vs', 'r2.a'], ['rl2.b', 'l2.anode'],
            ['q1.collector', 'rc1.b', 'c1.pos', 'dg.cathode'], ['c1.neg', 'q2.base', 'rb2.b'],
            ['q2.collector', 'l2.cathode', 'c2.pos'], ['c2.neg', 'q1.base', 'rb1.b'],
            ['dg.anode', 'u.inn', 'rt.b', 'ct.a'],
            ['r1.b', 'r2.b', 'u.inp'], ['u.vout', 'r1.a', 'rt.a', 'co.pos'], ['co.neg', 'rsp.a'], ['rsp.b', 'spk.a'],
            ['bat.neg', 'q1.emitter', 'q2.emitter', 'u.gnd', 'ct.b', 'spk.b'],
        ],
        open: ['u.gain1', 'u.gain8', 'u.bypass'],
    },

    // Slow two-NPN astable; each rising edge of Q2's collector, buffered by
    // the follower Q3 and passed through 22 uF onto node K (10 k to ground, clamp diode), lifts the gate diode off the
    // LM386 timing capacitor and injects charging current: a falling chirp.
    'lab-amp-ic-chirp': {
        vcc: 9, supply: SUP,
        parts: { bat: BAT9, q1: NPN, q2: NPN, rc1: R(2200), rc2: R(2200),
            rb1: R(100000), rb2: R(100000), c1: EL(22e-6), c2: EL(2.2e-6),
            q3: NPN, re: R(2200), ck: C(22e-6), rk: R(10000), dr: D4148, dg: D4148, di: D4148, ri: R(4700),
            u: LM386, r1: R(47000), r2: R(47000), rt: R(4700), pitch: POT(10000, 0.5), ct: C(100e-9),
            dd: D4148, rd: R(1000), co: EL(47e-6), rsp: R(47), spk: SPK },
        nets: [
            ['bat.pos', 'rc1.a', 'rc2.a', 'rb1.a', 'rb2.a', 'q3.collector', 'u.vs', 'r2.a'],
            ['q1.collector', 'rc1.b', 'c1.pos'], ['c1.neg', 'q2.base', 'rb2.b'],
            ['q2.collector', 'rc2.b', 'c2.pos', 'q3.base'], ['q3.emitter', 're.a', 'ck.a'], ['c2.neg', 'q1.base', 'rb1.b'],
            ['ck.b', 'rk.a', 'dr.cathode', 'dg.cathode', 'di.anode'], ['di.cathode', 'ri.a'],
            ['u.inn', 'dg.anode', 'ri.b', 'pitch.wiper', 'ct.a', 'dd.anode'], ['pitch.a', 'rt.b'], ['dd.cathode', 'rd.a'],
            ['r1.b', 'r2.b', 'u.inp'], ['u.vout', 'r1.a', 'rt.a', 'rd.b', 'co.pos'], ['co.neg', 'rsp.a'], ['rsp.b', 'spk.a'],
            ['bat.neg', 'q1.emitter', 'q2.emitter', 're.b', 'rk.b', 'dr.anode', 'u.gnd', 'ct.b', 'spk.b'],
        ],
        open: ['u.gain1', 'u.gain8', 'u.bypass', 'pitch.b'],
    },

    // Q1 biased by a divider with a trim pot and 220 ohm emitter feedback just
    // inside the range where the Q1-Q2 loop (47 uF back to Q1's base) has gain.
    // Q1 has its own surroundings: warm, it conducts more and the loop stalls.
    'lab-warm-stops-blinker': {
        vcc: 9, supply: SUP,
        parts: { bat: BAT9, r1: R(18000), trim: POT(10000, 0.65), r2: R(2200),
            q1: ['npn', { beta: 100, surroundC: 25, thermalTau: 1.5 }], re: R(220), rc: R(10000),
            rb2: R(4700), q2: NPN, rl: R(680), led: LED('red'), cf: C(47e-6) },
        nets: [
            ['bat.pos', 'r1.a', 'rc.a', 'rl.a'], ['r1.b', 'trim.a'],
            ['trim.wiper', 'r2.a', 'q1.base', 'cf.b'], ['q1.emitter', 're.a'],
            ['q1.collector', 'rc.b', 'rb2.a'], ['rb2.b', 'q2.base'],
            ['rl.b', 'led.anode'], ['led.cathode', 'q2.collector', 'cf.a'],
            ['bat.neg', 'r2.b', 're.b', 'q2.emitter'],
        ],
        open: ['trim.b'],
    },

    // Two-NPN astable (1 nF) whose base resistors return to a pot wiper above
    // 15 k (5.4..9 V): 12..22 kHz; the slide switch adds 2.2 nF on one side.
    'lab-ultrasonic-sweep': {
        vcc: 9, supply: SUP,
        parts: { bat: BAT9, pitch: POT(10000, 0.5), rp: R(15000), q1: NPN, q2: NPN, rc1: R(4700), rc2: R(4700),
            rb1: R(33000), rb2: R(33000), c1: C(1e-9), c2: C(1e-9), tune: SLIDE(0), cx: C(2.2e-9),
            cc: C(10e-9), re: R(10000), ep: EAR },
        nets: [
            ['bat.pos', 'pitch.a', 'rc1.a', 'rc2.a'], ['pitch.wiper', 'rb1.a', 'rb2.a'], ['pitch.b', 'rp.a'],
            ['q1.collector', 'rc1.b', 'c1.a', 'tune.com'], ['tune.b', 'cx.a'], ['c1.b', 'cx.b', 'q2.base', 'rb2.b'],
            ['q2.collector', 'rc2.b', 'c2.a', 'cc.a'], ['c2.b', 'q1.base', 'rb1.b'], ['cc.b', 're.a'], ['re.b', 'ep.a'],
            ['bat.neg', 'rp.b', 'q1.emitter', 'q2.emitter', 'ep.b'],
        ],
        open: ['tune.a'],
    },

    // LM386 Schmitt trigger with -IN between its two switching levels (a memory);
    // the button connects the output's RC to -IN and it oscillates. Green LED
    // through an NPN that shorts it while the output is high.
    'lab-amp-ic-coin-toss': {
        vcc: 9, supply: SUP,
        parts: { bat: BAT9, u: LM386, r1: R(47000), r2: R(47000), rt: R(4700), ct: C(1e-6), btn: ['button', {}],
            rbt: R(22000), rbb: R(33000), rs1: R(1000), red: LED('red'),
            rqb: R(10000), rqg: R(10000), q: NPN, rs2: R(1000), green: LED('green') },
        nets: [
            ['bat.pos', 'u.vs', 'r2.a', 'rbt.a', 'rs2.a'], ['r1.b', 'r2.b', 'u.inp'],
            ['u.vout', 'r1.a', 'rt.a', 'rs1.a', 'rqb.a'], ['rt.b', 'ct.a', 'btn.a'],
            ['btn.b', 'rbt.b', 'rbb.a', 'u.inn'], ['rs1.b', 'red.anode'],
            ['rqb.b', 'rqg.a', 'q.base'], ['rs2.b', 'green.anode', 'q.collector'],
            ['bat.neg', 'u.gnd', 'ct.b', 'rbb.b', 'red.cathode', 'rqg.b', 'q.emitter', 'green.cathode'],
        ],
        open: ['u.gain1', 'u.gain8', 'u.bypass'],
    },

    // 100 ohm or 1 k across the battery (thermal model, 40 K/W); a diode glued to
    // each (heatedBy) reads its temperature through its forward voltage.
    'lab-resistor-heat': {
        vcc: 9, supply: SUP,
        parts: { bat: BAT9, sw: SLIDE(0), rh: ['resistor', { ohms: 100, rth: 40, thermalTau: 2 }],
            rk: ['resistor', { ohms: 1000, rth: 40, thermalTau: 2 }],
            rb1: R(4700), d1: ['diode', { heatedBy: '@rh', thermalCoupling: 0.9, thermalTau: 2 }], vm1: VM,
            rb2: R(4700), d2: ['diode', { heatedBy: '@rk', thermalCoupling: 0.9, thermalTau: 2 }], vm2: VM },
        nets: [
            ['bat.pos', 'sw.com', 'rb1.a', 'rb2.a'], ['sw.a', 'rh.a'], ['sw.b', 'rk.a'],
            ['rb1.b', 'd1.anode', 'vm1.a'], ['rb2.b', 'd2.anode', 'vm2.a'],
            ['bat.neg', 'rh.b', 'rk.b', 'd1.cathode', 'd2.cathode', 'vm1.b', 'vm2.b'],
        ],
    },
});
