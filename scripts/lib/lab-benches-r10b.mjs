/**
 * Netlists for the r10b lab benches, written by
 * `node scripts/gen-lab-circuits-4.mjs --set=r10b`.
 *
 * Every bench is built around the 555 timer, with discrete NPN/PNP
 * transistors where a sensor needs gain in front of it: a humidity switch and
 * a twilight switch (the 555 as a Schmitt trigger on a sensor divider), a
 * diode / transistor direction tester and a Morse oscillator keyed through
 * the reset pin, a siren and a wail on the control pin, a touch timer with a
 * guard against stray fields, a one-touch toggle, a sound- or light-triggered
 * switch, the hysteresis of a transistor-plus-555 trigger, a trip-wire latch,
 * a fibre-fed photo-Darlington, beats between a 555 and an LM386 oscillator,
 * a transistor microphone preamp frequency-modulating a 555, and a traffic
 * light decoded by transistors from a binary counter.
 *
 * Same shape as lab-benches-4.mjs: pure data, so
 * test/lab-circuits-r10b.test.mjs names parts by role. Ids follow benchIds
 * (breadboard first, then the parts in the order listed). A param written
 * '@name' (a light path's from / to) is resolved to that part's engine id
 * at the end of this file.
 *
 * THE 555 (bw-board src/devices/timer-555.js) is behavioural: the trigger
 * comparator sets the flip-flop below CV/2, the threshold comparator resets
 * it above CV, the trigger wins when both hold, and reset below 0.3·Vcc
 * forces the output low. CV sits at 2/3·Vcc on an internal 5 k / 10 k
 * divider, so a resistor from CV to ground narrows the window and a voltage
 * driven onto CV moves both thresholds. Its inputs draw no current.
 */
import { benchIds } from './lab-benches-4.mjs';
export { benchIds };

const SUP = { pos: 'bat.pos', neg: 'bat.neg' };
const R = (ohms) => ['resistor', { ohms }];
const C = (farads) => ['capacitor', { farads }];
const EL = (farads) => ['polarized_cap', { farads }];
const LED = (color) => ['led', { color }];
const NPN = ['npn', { beta: 100 }];
const PNP = ['pnp', { beta: 100 }];
const BAT9 = ['vsource', { volts: 9, variant: '9v' }];
const BAT5 = ['vsource', { volts: 5 }];
const POT = (ohms, position) => ['potentiometer', { ohms, position }];
const D = ['diode', { part: '1N4148' }];
const T555 = ['timer_555', {}];
const BTN = ['button', {}];
const SW = (closed = false) => ['switch', { closed }];
const SLIDE = (position = 0) => ['slide_switch', { position }];
const PIEZO = ['piezo', {}];
const RELAY = ['relay', { coilR: 200 }];
const PATH = (params) => ['light_path', params];

/**
 * A two-stage microphone preamplifier: a loudspeaker as the microphone,
 * 1 µF into an NPN with 1 MΩ collector-to-base feedback, 10 kΩ load and
 * 470 Ω in its emitter (about 0.4 mA, gain about 20), 100 nF into a second
 * stage with 100 Ω in its emitter (gain about 60): about a thousand overall,
 * so a clap (100 dB) clips at the second collector while speech (70 dB)
 * moves it by a fraction of a volt and a quiet room leaves it at its 4.9 V
 * rest. The coupling capacitors are small so the
 * bias settles within a few tenths of a second of switch-on (each charges
 * through a 1 MΩ bias resistor).
 */
const PREAMP_PARTS = (sound) => ({
    mic: ['speaker', { ohms: 8, ...sound }], c1: EL(1e-6), q1: NPN, rf1: R(1000000), rc1: R(10000), re1: R(470),
    c2: C(100e-9), q2: NPN, rf2: R(1000000), rc2: R(10000), re2: R(100),
});
const PREAMP_NETS = [
    ['mic.a', 'c1.neg'], ['c1.pos', 'q1.base', 'rf1.a'], ['q1.collector', 'rf1.b', 'rc1.b', 'c2.a'],
    ['c2.b', 'q2.base', 'rf2.a'], ['q1.emitter', 're1.a'], ['q2.emitter', 're2.a'],
];
const PREAMP_POS = ['rc1.a', 'rc2.a'];
const PREAMP_NEG = ['mic.b', 're1.b', 're2.b'];
/** The preamp's output: the second collector (also on rf2.b and rc2.b). */
const PREAMP_OUT = ['q2.collector', 'rf2.b', 'rc2.b'];

/** Replace '@role' in a light path's from / to with the bench's engine id. */
function resolveRefs(benches) {
    for (const spec of Object.values(benches)) {
        const ids = benchIds(spec);
        for (const [, [, params]] of Object.entries(spec.parts)) {
            for (const k of ['from', 'to']) {
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

export const BENCHES = resolveRefs({
    // Humidity switch. The 555's trigger and threshold are tied: a Schmitt
    // trigger with thresholds at 3 V and 6 V. Its input is a divider: the
    // salt-film humidity comb from +9 V, 100 kΩ to ground. At room humidity
    // the comb is megohms, the input sits near 0 V, the output is high and
    // the green DRY LED is lit. Breath (about 90 % RH) drops the comb to a few
    // kilohms, the input passes 6 V and the output falls: the blue WET LED
    // lights. Drying, the comb must pass about 200 kΩ (input below 3 V)
    // before it switches back: between roughly 70 and 77 % RH it keeps what
    // it was doing — the hysteresis a humidifier controller needs.
    'lab-555-humidity-switch': {
        vcc: 9, supply: SUP,
        parts: { bat: BAT9, comb: ['humidity_comb', { humidity: 50 }], rd: R(100000), u: T555, cv: C(10e-9),
            rw: R(1000), wet: LED('blue'), rdry: R(1000), dry: LED('green') },
        nets: [
            ['bat.pos', 'u.vcc', 'u.reset', 'comb.a', 'rw.a'],
            ['comb.b', 'rd.a', 'u.trigger', 'u.threshold'], ['u.control', 'cv.a'],
            ['u.output', 'rdry.a', 'wet.cathode'], ['rw.b', 'wet.anode'], ['rdry.b', 'dry.anode'],
            ['bat.neg', 'rd.b', 'u.gnd', 'cv.b', 'dry.cathode'],
        ],
        open: ['u.discharge'],
    },

    // Direction tester. A 555 astable (1 k, 10 k, 100 nF: about 690 Hz)
    // plays a piezo, but its reset pin is held low by 10 kΩ: silent. The red
    // probe is +9 V through 1 kΩ, the black probe goes to the reset pin. A
    // part that conducts from red to black lifts reset above 2.7 V and the
    // tone sounds. The socket: four buttons put a silicon diode, a red LED,
    // an NPN's base-emitter junction (base on A) or a PNP's (base on A)
    // between row A and row K (each transistor's collector sits on row K with
    // its emitter, so both of its junctions point the same way and only the
    // base decides). Two slide switches say where the clips go:
    // left, red on A and black on K; right, the other way round. The NPN beeps
    // red-on-base, the PNP black-on-base: that tells them apart.
    // LEAK: a switch puts 4.7 kΩ plus a 47 kΩ rheostat from the control pin
    // to ground — a leaky part on the CV pin — which pulls both thresholds
    // down: the pitch rises as the leak resistance falls.
    'lab-555-direction-tester': {
        vcc: 9, supply: SUP,
        parts: { bat: BAT9, u: T555, ra: R(1000), rb: R(10000), ct: C(100e-9), cv: C(10e-9), pz: PIEZO,
            rr: R(10000), rsrc: R(1000), redclip: SLIDE(0), blackclip: SLIDE(0),
            bsi: BTN, dsi: D, bled: BTN, led: LED('red'), bnpn: BTN, qn: NPN, bpnp: BTN, qp: PNP,
            leak: SW(false), rlk: R(4700), lk: POT(47000, 0.5) },
        nets: [
            ['bat.pos', 'u.vcc', 'ra.a', 'rsrc.a'],
            ['ra.b', 'rb.a', 'u.discharge'], ['rb.b', 'u.threshold', 'u.trigger', 'ct.a'],
            ['u.control', 'cv.a', 'leak.a'], ['leak.b', 'rlk.a'], ['rlk.b', 'lk.a'],
            ['u.output', 'pz.a'],
            ['rsrc.b', 'redclip.com'], ['blackclip.com', 'u.reset', 'rr.a'],
            ['redclip.a', 'blackclip.b', 'bsi.b', 'bled.b', 'bnpn.b', 'bpnp.b'],
            ['bsi.a', 'dsi.anode'], ['bled.a', 'led.anode'], ['bnpn.a', 'qn.base'], ['bpnp.a', 'qp.base'],
            ['redclip.b', 'blackclip.a', 'dsi.cathode', 'led.cathode', 'qn.emitter', 'qn.collector', 'qp.emitter', 'qp.collector'],
            ['bat.neg', 'u.gnd', 'ct.b', 'cv.b', 'pz.b', 'rr.b', 'lk.wiper', 'lk.b'],
        ],
    },

    // Morse oscillator keyed through the reset pin. The 555 astable (about
    // 690 Hz) is silent while 10 kΩ holds its reset pin low. KEY (a button
    // to +9 V) lifts reset: the tone sounds for as long as the key is down.
    // TOUCH is a second key that needs only a fingertip: the finger bridges
    // +9 V to an NPN's base through its skin, the NPN pulls a PNP's base
    // (10 kΩ to +9 V) down and the PNP lifts reset. The slide switch is the
    // finger: left a moist fingertip (1 MΩ), right a dry one (100 MΩ). The
    // pair's gain of about 10⁴ makes the moist finger key the tone; the dry
    // one does not.
    'lab-555-morse-touch': {
        vcc: 9, supply: SUP,
        parts: { bat: BAT9, u: T555, ra: R(1000), rb: R(10000), ct: C(100e-9), cv: C(10e-9), pz: PIEZO,
            rr: R(10000), key: BTN, touch: BTN, skin: SLIDE(0), rmoist: R(1000000), rdry: R(100000000),
            qn: NPN, rup: R(10000), qp: PNP },
        nets: [
            ['bat.pos', 'u.vcc', 'ra.a', 'key.a', 'touch.a', 'rup.a', 'qp.emitter'],
            ['ra.b', 'rb.a', 'u.discharge'], ['rb.b', 'u.threshold', 'u.trigger', 'ct.a'], ['u.control', 'cv.a'],
            ['u.output', 'pz.a'],
            ['key.b', 'u.reset', 'rr.a', 'qp.collector'],
            ['touch.b', 'skin.com'], ['skin.a', 'rmoist.a'], ['skin.b', 'rdry.a'], ['rmoist.b', 'rdry.b', 'qn.base'],
            ['qn.collector', 'rup.b', 'qp.base'],
            ['bat.neg', 'u.gnd', 'ct.b', 'cv.b', 'pz.b', 'rr.b', 'qn.emitter'],
        ],
    },

    // Siren and wail on the control pin. The tone 555 (1 k, 6.8 k, 100 nF:
    // about 1 kHz) has 1 kΩ from its control pin to a RAMP capacitor (220 µF,
    // charged through 4.7 kΩ). The higher the ramp pulls CV, the higher both
    // thresholds and the LOWER the pitch. The slide switch chooses what drives
    // the ramp. Left, WAIL: a slow 555 astable (10 k, 100 k, 10 µF: one cycle
    // in about 1.5 s); its square output, smoothed by the 4.7 kΩ and 220 µF,
    // becomes a slow rise and fall on CV — the pitch wails down and up by
    // itself. Right, SIREN: 4.7 kΩ to +9 V holds the ramp up (low pitch);
    // the BUTTON pulls it to ground: hold it and the pitch glides up, let go
    // and it glides back down.
    'lab-555-wail': {
        vcc: 9, supply: SUP,
        parts: { bat: BAT9, s: T555, ras: R(10000), rbs: R(100000), cs: EL(10e-6), cvs: C(10e-9),
            mode: SLIDE(0), btn: BTN, rpu: R(4700), rr: R(4700), cr: EL(220e-6), rcv: R(1000),
            t: T555, ra: R(1000), rb: R(6800), ct: C(100e-9), pz: PIEZO },
        nets: [
            ['bat.pos', 's.vcc', 's.reset', 'ras.a', 'rpu.a', 't.vcc', 't.reset', 'ra.a'],
            ['ras.b', 'rbs.a', 's.discharge'], ['rbs.b', 's.threshold', 's.trigger', 'cs.pos'], ['s.control', 'cvs.a'],
            ['s.output', 'mode.a'], ['rpu.b', 'btn.a', 'mode.b'], ['mode.com', 'rr.a'],
            ['rr.b', 'cr.pos', 'rcv.a'], ['rcv.b', 't.control'],
            ['ra.b', 'rb.a', 't.discharge'], ['rb.b', 't.threshold', 't.trigger', 'ct.a'],
            ['t.output', 'pz.a'],
            ['bat.neg', 's.gnd', 'cs.neg', 'cvs.b', 'btn.b', 'cr.neg', 't.gnd', 'ct.b', 'pz.b'],
        ],
    },

    // Touch timer with a guard. A 555 monostable (100 kΩ, 22 µF: about
    // 2.4 s) pulls in a relay whose contact lights a lamp LED. Its trigger
    // input is a sensor contact; a fingertip (BUTTON, 470 kΩ of skin) bridges
    // it to ground. A bare wire is also an antenna: the knob of the field
    // probe brings a mains cable closer to it (up to 10 pF of coupling, a
    // cable laid alongside the sensor lead). With GUARD open only 22 MΩ
    // holds the trigger up and the hum it picks up swings it below 3 V: the
    // timer fires on its own. GUARD closed adds 2.2 MΩ of pull-up and 10 nF
    // to the +9 V rail (for the hum as good as ground, and at switch-on it
    // holds the input high instead of starting the timer): the hum shrinks
    // to a fraction of a volt, while a finger still pulls the input to about
    // 1.7 V and starts the timer.
    'lab-555-touch-timer': {
        vcc: 9, supply: SUP,
        parts: { bat: BAT9, u: T555, rt: R(100000), ct: EL(22e-6), cv: C(10e-9),
            rpu: R(22000000), guard: SW(true), rg: R(2200000), cg: C(10e-9),
            finger: BTN, rskin: R(470000), pr: ['field_probe', { source: 'mains', position: 0, maxFarads: 10e-12 }],
            k: RELAY, df: D, rl: R(1000), lamp: LED('yellow') },
        nets: [
            ['bat.pos', 'u.vcc', 'u.reset', 'rt.a', 'rpu.a', 'rg.a', 'cg.b', 'k.com'],
            ['rt.b', 'u.threshold', 'u.discharge', 'ct.pos'], ['u.control', 'cv.a'],
            ['u.trigger', 'rpu.b', 'guard.a', 'finger.a', 'pr.a'], ['guard.b', 'rg.b', 'cg.a'], ['finger.b', 'rskin.a'],
            ['u.output', 'k.coil_a', 'df.cathode'], ['k.no', 'rl.a'], ['rl.b', 'lamp.anode'],
            ['bat.neg', 'u.gnd', 'ct.neg', 'cv.b', 'rskin.b', 'k.coil_b', 'df.anode', 'lamp.cathode'],
        ],
        open: ['k.nc'],
    },

    // One-touch toggle. The 555's trigger and threshold are one node held at
    // 4.5 V by two 1 MΩ: between its thresholds, so it keeps its state. The
    // output charges a 1 µF steering capacitor through 100 kΩ. TOUCH (a
    // fingertip, 220 kΩ of skin) connects the capacitor to the input node:
    // with the output high the capacitor is full and pulls the node above
    // 6 V (output goes low); with the output low it is empty and pulls the
    // node below 3 V (output goes high). Each short touch flips the LED and
    // the relay; a finger left on keeps flipping it: a blinker.
    'lab-555-touch-toggle': {
        vcc: 9, supply: SUP,
        parts: { bat: BAT9, u: T555, cv: C(10e-9), rb1: R(1000000), rb2: R(1000000),
            rc: R(100000), cm: EL(1e-6), touch: BTN, rskin: R(220000),
            rl: R(1000), led: LED('red'), k: RELAY, df: D },
        nets: [
            ['bat.pos', 'u.vcc', 'u.reset', 'rb1.a'],
            ['rb1.b', 'rb2.a', 'u.trigger', 'u.threshold', 'rskin.b'], ['u.control', 'cv.a'],
            ['u.output', 'rc.a', 'rl.a', 'k.coil_a', 'df.cathode'], ['rc.b', 'cm.pos', 'touch.a'], ['touch.b', 'rskin.a'],
            ['rl.b', 'led.anode'],
            ['bat.neg', 'u.gnd', 'cv.b', 'rb2.b', 'cm.neg', 'led.cathode', 'k.coil_b', 'df.anode'],
        ],
        open: ['u.discharge', 'k.com', 'k.nc', 'k.no'],
    },

    // Sound- or light-triggered switch. A loudspeaker is the microphone; two
    // NPN stages lift a clap to volts. 1 µF passes the
    // positive peaks to a third NPN (100 kΩ base to ground, off at rest),
    // whose collector (10 kΩ up) is the trigger of a 555 monostable
    // (100 kΩ, 22 µF: about 2.4 s): a loud sound starts it, the relay pulls
    // in and the lamp lights. The slide switch swaps the microphone chain
    // for a phototransistor (47 kΩ down) at the same NPN: then a torch
    // starts it. 100 kΩ and 10 µF hold the 555 in reset for the first
    // 0.35 s so the amplifier settling at switch-on does not fire it.
    'lab-555-sound-switch': {
        vcc: 9, supply: SUP,
        parts: { bat: BAT9, ...PREAMP_PARTS({ soundDb: 0, soundWave: 'tone', soundHz: 1000 }),
            c3: EL(1e-6), src: SLIDE(0), pt: ['phototransistor', { iMax: 0.0005, light: 0 }], rpe: R(47000),
            q3: NPN, rb3: R(100000), rt: R(10000),
            u: T555, rm: R(100000), cmono: EL(22e-6), cv: C(10e-9), rres: R(100000), cres: EL(10e-6),
            k: RELAY, df: D, rl: R(1000), lamp: LED('yellow') },
        nets: [
            ['bat.pos', ...PREAMP_POS, 'pt.collector', 'rt.a', 'u.vcc', 'rm.a', 'rres.a', 'k.com'],
            ...PREAMP_NETS, [...PREAMP_OUT, 'c3.pos'],
            ['c3.neg', 'src.a'], ['pt.emitter', 'rpe.a', 'src.b'], ['src.com', 'q3.base', 'rb3.a'],
            ['q3.collector', 'rt.b', 'u.trigger'],
            ['rm.b', 'u.threshold', 'u.discharge', 'cmono.pos'], ['u.control', 'cv.a'], ['rres.b', 'cres.pos', 'u.reset'],
            ['u.output', 'k.coil_a', 'df.cathode'], ['k.no', 'rl.a'], ['rl.b', 'lamp.anode'],
            ['bat.neg', ...PREAMP_NEG, 'rpe.b', 'q3.emitter', 'rb3.b', 'u.gnd', 'cmono.neg', 'cv.b', 'cres.neg',
                'k.coil_b', 'df.anode', 'lamp.cathode'],
        ],
        open: ['k.nc'],
    },

    // Hysteresis of a transistor-plus-555 trigger. INPUT (a 10 kΩ pot across
    // the supply) feeds an NPN through 10 kΩ; 4.7 kΩ in its emitter makes its
    // collector current follow the knob gently (about 0.2 mA per volt). Its
    // collector (10 kΩ up, 100 nF to ground) is the 555's tied trigger and
    // threshold. Turning INPUT up pulls the collector below 3 V and the output
    // goes high (LED on); turning it down lets the collector rise past 6 V and
    // the LED goes out. FEEDBACK (4.7 kΩ plus a 100 kΩ rheostat) from the
    // 555 output back onto the collector pushes the node the other way each
    // time the output switches: the bigger the feedback current, the
    // narrower the window between switching on and off. Below about 20 kΩ
    // the step outgrows the 555's own 3 V window: at the transition the
    // trigger oscillates.
    'lab-555-hysteresis-feedback': {
        vcc: 9, supply: SUP,
        parts: { bat: BAT9, vin: POT(10000, 0.2), rin: R(10000), q: NPN, re: R(4700), rc: R(10000), cn: C(100e-9),
            u: T555, cv: C(10e-9), rfmin: R(4700), fb: POT(100000, 0), rl: R(1000), led: LED('red') },
        nets: [
            ['bat.pos', 'vin.a', 'rc.a', 'u.vcc', 'u.reset'],
            ['vin.wiper', 'rin.a'], ['rin.b', 'q.base'], ['q.emitter', 're.a'],
            ['q.collector', 'rc.b', 'cn.a', 'u.trigger', 'u.threshold', 'fb.wiper'], ['u.control', 'cv.a'],
            ['u.output', 'rfmin.a', 'rl.a'], ['rfmin.b', 'fb.a'], ['rl.b', 'led.anode'],
            ['bat.neg', 'vin.b', 're.b', 'cn.b', 'u.gnd', 'cv.b', 'led.cathode'],
        ],
        open: ['u.discharge', 'fb.b'],
    },

    // Trip-wire alarm with a 555 latch. A thin wire (WIRE, a switch, closed)
    // holds the 555's trigger at +9 V against 100 kΩ to ground; its threshold
    // is grounded, so nothing but the reset pin can turn it off again. Break
    // the wire and the trigger falls: the output latches high, the red LED
    // lights and enables a second 555 (about 690 Hz) on the piezo. Joining the
    // wire again changes nothing; only RESET (a button pulling the 10 kΩ-held
    // reset pin low) silences it — and with the wire still broken the alarm
    // comes straight back.
    'lab-555-trip-latch': {
        vcc: 9, supply: SUP,
        parts: { bat: BAT9, u: T555, cv: C(10e-9), wire: SW(true), rpd: R(100000), rr: R(10000), reset: BTN,
            rl: R(1000), led: LED('red'),
            t: T555, ra: R(1000), rb: R(10000), ct: C(100e-9), cvt: C(10e-9), pz: PIEZO },
        nets: [
            ['bat.pos', 'u.vcc', 'wire.a', 'rr.a', 't.vcc', 'ra.a'],
            ['wire.b', 'rpd.a', 'u.trigger'], ['rr.b', 'u.reset', 'reset.a'], ['u.control', 'cv.a'],
            ['u.output', 'rl.a', 't.reset'], ['rl.b', 'led.anode'],
            ['ra.b', 'rb.a', 't.discharge'], ['rb.b', 't.threshold', 't.trigger', 'ct.a'], ['t.control', 'cvt.a'],
            ['t.output', 'pz.a'],
            ['bat.neg', 'u.gnd', 'u.threshold', 'rpd.b', 'reset.b', 'cv.b', 'led.cathode', 't.gnd', 'ct.b', 'cvt.b', 'pz.b'],
        ],
        open: ['u.discharge'],
    },

    // Twilight switch. A phototransistor from +9 V into 22 kΩ: the more
    // light, the higher its emitter. That node is the 555's tied trigger and
    // threshold (a Schmitt trigger, 3 V and 6 V). Dark: the output is high
    // and the yellow LAMP LED is lit; bright: the output falls, the lamp goes
    // out and the green DAY LED lights. NARROW (a switch) puts 10 kΩ from the
    // control pin to ground: CV drops from 6 V to 4.5 V, the thresholds to
    // 4.5 V and 2.25 V, and the window between switching on and off narrows
    // from 3 V to 2.25 V.
    'lab-555-twilight': {
        vcc: 9, supply: SUP,
        parts: { bat: BAT9, pt: ['phototransistor', { iMax: 0.0005, light: 0.1 }], rn: R(22000), u: T555, cv: C(10e-9),
            narrow: SW(false), rcv: R(10000), rlamp: R(1000), lamp: LED('yellow'), rday: R(1000), day: LED('green') },
        nets: [
            ['bat.pos', 'pt.collector', 'u.vcc', 'u.reset', 'rday.a'],
            ['pt.emitter', 'rn.a', 'u.trigger', 'u.threshold'], ['u.control', 'cv.a', 'narrow.a'], ['narrow.b', 'rcv.a'],
            ['u.output', 'rlamp.a', 'day.cathode'], ['rlamp.b', 'lamp.anode'], ['rday.b', 'day.anode'],
            ['bat.neg', 'rn.b', 'u.gnd', 'cv.b', 'rcv.b', 'lamp.cathode'],
        ],
        open: ['u.discharge'],
    },

    // Light guide onto a photo-Darlington. A red LED (470 Ω) shines into a
    // 0.5 m fibre; the knob is the gap between the fibre's far end and a
    // phototransistor (0 .. 10 mm). The phototransistor feeds an NPN's base
    // (10 MΩ base to emitter, so the base cannot float up in the dark):
    // together a photo-Darlington, a hundred times more current for the same
    // light. The slide switch sends its emitter current to one of two 555s.
    // Left, SWITCH: into 10 kΩ, the input of a 555 Schmitt trigger: the fibre
    // end brought near lifts it past 6 V and the green NEAR LED lights, moved
    // away below 3 V and the red FAR LED lights. Right, TONE: through 22 kΩ
    // into the charging path of a 555 astable (47 k, 1 k, 22 nF; the
    // discharge pin node): the extra charging current shortens each charge
    // and raises its pitch on the piezo as the gap closes. (During the
    // discharge the pin shorts that node, so the light does not slow it.)
    'lab-555-fibre-darlington': {
        vcc: 9, supply: SUP,
        parts: { bat: BAT9, rs: R(470), led: LED('red'), pt: ['phototransistor', { iMax: 2e-5 }], q: NPN, rbe: R(10000000),
            mode: SLIDE(0), rl: R(10000), a: T555, cva: C(10e-9), rnear: R(1000), near: LED('green'),
            rfar: R(1000), far: LED('red'),
            rinj: R(22000), b: T555, ra: R(47000), rb: R(1000), ct: C(22e-9), cvb: C(10e-9), pz: PIEZO,
            guide: PATH({ from: '@led', to: '@pt', medium: 'fibre', lengthM: 0.5, outGapMm: 10,
                knob: 'outGapMm', knobMin: 0, knobMax: 10 }) },
        nets: [
            ['bat.pos', 'rs.a', 'pt.collector', 'q.collector', 'a.vcc', 'a.reset', 'rnear.a', 'b.vcc', 'b.reset', 'ra.a'],
            ['rs.b', 'led.anode'], ['pt.emitter', 'q.base', 'rbe.a'], ['q.emitter', 'rbe.b', 'mode.com'],
            ['mode.a', 'rl.a', 'a.trigger', 'a.threshold'], ['a.control', 'cva.a'],
            ['a.output', 'near.cathode', 'rfar.a'], ['rnear.b', 'near.anode'], ['rfar.b', 'far.anode'],
            ['mode.b', 'rinj.a'], ['rinj.b', 'ra.b', 'rb.a', 'b.discharge'], ['rb.b', 'b.threshold', 'b.trigger', 'ct.a'], ['b.control', 'cvb.a'], ['b.output', 'pz.a'],
            ['bat.neg', 'led.cathode', 'rl.b', 'a.gnd', 'cva.b', 'far.cathode', 'b.gnd', 'ct.b', 'cvb.b', 'pz.b'],
        ],
        open: ['a.discharge'],
    },

    // Beats between two different oscillators. A 555 astable (1 k, 15 k,
    // 100 nF: about 450 Hz) and an LM386 relaxation oscillator (47 kΩ from
    // its output and 100 kΩ from +9 V set its + input's moving threshold;
    // 2.2 kΩ plus a 15 kΩ TUNE rheostat charge 100 nF on its − input). Each
    // square wave goes through 10 kΩ into one mixing node (10 kΩ to ground),
    // and 10 µF couples the mix into a crystal earphone. Tuned close, the two
    // drift in and out of step: the mix swells and fades at the difference
    // frequency — the beat.
    'lab-555-amp-beats': {
        vcc: 9, supply: SUP,
        parts: { bat: BAT9, t: T555, ra: R(1000), rb: R(15000), ct: C(100e-9), cv: C(10e-9),
            u: ['lm386', {}], rh: R(47000), cf: C(1e-9), rv: R(100000), rmin: R(2200), tune: POT(15000, 0.35), cu: C(100e-9),
            r1: R(10000), r2: R(10000), rmix: R(10000), cc: EL(10e-6), ear: ['earphone', { type: 'crystal' }] },
        nets: [
            ['bat.pos', 't.vcc', 't.reset', 'ra.a', 'u.vs', 'rv.a'],
            ['ra.b', 'rb.a', 't.discharge'], ['rb.b', 't.threshold', 't.trigger', 'ct.a'], ['t.control', 'cv.a'],
            ['u.vout', 'rh.a', 'cf.a', 'rmin.a', 'r2.a'], ['u.inp', 'rh.b', 'cf.b', 'rv.b'],
            ['rmin.b', 'tune.a'], ['tune.wiper', 'tune.b', 'u.inn', 'cu.a'],
            ['t.output', 'r1.a'], ['r1.b', 'r2.b', 'rmix.a', 'cc.pos'], ['cc.neg', 'ear.a'],
            ['bat.neg', 't.gnd', 'ct.b', 'cv.b', 'u.gnd', 'cu.b', 'rmix.b', 'ear.b'],
        ],
        open: ['u.gain1', 'u.gain8', 'u.bypass'],
    },

    // Speaking into the speaker frequency-modulates a 555. The two-stage
    // NPN microphone preamp lifts the voice from a fraction of a millivolt to
    // volts; 1 µF and 1 kΩ couple it onto the control pin of a 555 astable
    // (1 k, 4.7 k, 100 nF: about 1.4 kHz) on a piezo. The voice moves both
    // thresholds up and down, and the pitch with them: louder speech, a wider
    // wobble.
    'lab-555-mic-fm': {
        vcc: 9, supply: SUP,
        parts: { bat: BAT9, ...PREAMP_PARTS({ soundDb: 0, soundWave: 'voice', soundHz: 150 }),
            cc: EL(1e-6), rcc: R(1000),
            u: T555, ra: R(1000), rb: R(4700), ct: C(100e-9), pz: PIEZO },
        nets: [
            ['bat.pos', ...PREAMP_POS, 'u.vcc', 'u.reset', 'ra.a'],
            ...PREAMP_NETS, [...PREAMP_OUT, 'cc.pos'],
            ['cc.neg', 'rcc.a'], ['rcc.b', 'u.control'],
            ['ra.b', 'rb.a', 'u.discharge'], ['rb.b', 'u.threshold', 'u.trigger', 'ct.a'], ['u.output', 'pz.a'],
            ['bat.neg', ...PREAMP_NEG, 'u.gnd', 'ct.b', 'pz.b'],
        ],
    },

    // Traffic light from a counter. A 555 astable (10 k, 68 k, 4.7 µF:
    // about 2 steps a second) clocks a 4-bit binary counter (74HC93, QA into
    // its own second input), and only its two lowest outputs are used: four
    // states that repeat. Transistors decode them: QB high switches on an NPN
    // across the red LED (red lights only while QB is low); QA drives the
    // amber LED's NPN; QB drives the green LED's NPN unless a fourth NPN,
    // switched by QA, shorts that NPN's base. QB QA = 00 red, 01 red + amber,
    // 10 green, 11 amber, then red again.
    'lab-counter-traffic-lights': {
        vcc: 5, supply: SUP,
        parts: { bat: BAT5, osc: T555, ra: R(10000), rb: R(68000), ct: EL(4.7e-6), cv: C(10e-9), cnt: ['74hc93', {}],
            rr: R(220), red: LED('red'), qr: NPN, rbr: R(10000),
            ry: R(220), amber: LED('yellow'), qy: NPN, rby: R(10000),
            rg: R(220), green: LED('green'), qg: NPN, rbg: R(10000), qs: NPN, rbs: R(10000) },
        nets: [
            ['bat.pos', 'osc.vcc', 'osc.reset', 'ra.a', 'cnt.vcc', 'rr.a', 'ry.a', 'rg.a'],
            ['ra.b', 'rb.a', 'osc.discharge'], ['rb.b', 'osc.threshold', 'osc.trigger', 'ct.pos'], ['osc.control', 'cv.a'],
            ['osc.output', 'cnt.clk_a'], ['cnt.qa', 'cnt.clk_b', 'rby.a', 'rbs.a'], ['cnt.qb', 'rbr.a', 'rbg.a'],
            ['rr.b', 'red.anode', 'qr.collector'], ['rbr.b', 'qr.base'],
            ['ry.b', 'amber.anode'], ['amber.cathode', 'qy.collector'], ['rby.b', 'qy.base'],
            ['rg.b', 'green.anode'], ['green.cathode', 'qg.collector'], ['rbg.b', 'qg.base', 'qs.collector'], ['rbs.b', 'qs.base'],
            ['bat.neg', 'osc.gnd', 'ct.neg', 'cv.b', 'cnt.gnd', 'cnt.r0_1', 'cnt.r0_2', 'red.cathode', 'qr.emitter',
                'qy.emitter', 'qg.emitter', 'qs.emitter'],
        ],
        open: ['cnt.qc', 'cnt.qd', 'cnt.nc1', 'cnt.nc2', 'cnt.nc3', 'cnt.nc4'],
    },
});
