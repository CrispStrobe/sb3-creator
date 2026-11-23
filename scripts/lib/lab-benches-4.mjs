/**
 * Netlists for the lab-* benches written by scripts/gen-lab-circuits-4.mjs.
 *
 * Pure data, so test/lab-circuits-4.test.mjs can name parts by their role
 * (`q1`, `set`) instead of by engine id. `benchIds` reproduces the ids the
 * generator assigns: resetIds(), the breadboard first, then the parts in the
 * order listed here — `${kind}_${n}` with one counter for the whole circuit.
 */

const SUP = { pos: 'bat.pos', neg: 'bat.neg' };
const R = (ohms) => ['resistor', { ohms }];
const LED = (color) => ['led', { vf: 2, color }];
const NPN = ['npn', { beta: 100 }];
// Both junctions modelled (Ebers-Moll): the default npn has no B-C diode.
const NPN_EM = ['npn', { model: 'shockley', is: 1e-14, beta: 100, br: 1, n: 1 }];
const PNP = ['pnp', { beta: 100 }];
const BAT9 = ['vsource', { volts: 9, variant: '9v' }];

export const BENCHES = {
    // Set/reset bistable: each collector feeds the other base. The larger 27 k
    // feed into Q1 lets Q2 win the power-on race, so the latch starts with
    // green lit. No base capacitors: the engine powers a capacitor-free
    // bistable up in one state (bw-board e339fcb).
    'lab-transistor-flip-flop': {
        vcc: 9, supply: SUP,
        parts: { bat: BAT9, q1: NPN, q2: NPN,
            r1: R(1000), r2: R(1000), l1: LED('red'), l2: LED('green'),
            x1: R(22000), x2: R(27000),
            set: ['button', {}], reset: ['button', {}] },
        nets: [
            ['bat.pos', 'r1.a', 'r2.a'], ['r1.b', 'l1.anode'], ['r2.b', 'l2.anode'],
            ['l1.cathode', 'q1.collector', 'x1.a'], ['l2.cathode', 'q2.collector', 'x2.a'],
            ['x1.b', 'q2.base', 'set.a'], ['x2.b', 'q1.base', 'reset.a'],
            ['bat.neg', 'q1.emitter', 'q2.emitter', 'set.b', 'reset.b'],
        ],
    },

    // Base current set by 10 k + a 1 MΩ rheostat (pot b tied to its wiper), or
    // by a "fingertip" (2.2 MΩ behind a button). Ammeters in base and collector.
    'lab-base-current': {
        vcc: 9, supply: SUP,
        parts: { bat: BAT9, amb: ['ammeter', {}], amc: ['ammeter', {}],
            rmin: R(10000), pot: ['potentiometer', { ohms: 1000000, position: 0.8 }],
            sw: ['slide_switch', { position: 0 }], finger: ['button', {}], rskin: R(2200000),
            rc: R(1000), led: LED('red'), q: NPN },
        nets: [
            ['bat.pos', 'amb.a', 'finger.a', 'amc.a'], ['amb.b', 'rmin.a'], ['rmin.b', 'pot.a'],
            ['pot.wiper', 'pot.b', 'sw.a'], ['finger.b', 'rskin.a'], ['rskin.b', 'sw.b'],
            ['sw.com', 'q.base'], ['amc.b', 'rc.a'], ['rc.b', 'led.anode'], ['led.cathode', 'q.collector'],
            ['bat.neg', 'q.emitter'],
        ],
    },

    // Output characteristic: base current from 9 V through 47 k + 1 MΩ
    // rheostat, collector on an adjustable source through a 100 Ω limiter;
    // the voltmeter reads the real V_CE.
    'lab-transistor-curves': {
        vcc: 9, supply: SUP,
        parts: { bat: BAT9, vce: ['vsource', { volts: 5 }], amb: ['ammeter', {}], amc: ['ammeter', {}],
            vm: ['voltmeter', {}], rmin: R(47000), pot: ['potentiometer', { ohms: 1000000, position: 0.9 }], rs: R(100), q: NPN },
        nets: [
            ['bat.pos', 'amb.a'], ['amb.b', 'rmin.a'], ['rmin.b', 'pot.a'], ['pot.wiper', 'pot.b', 'q.base'],
            ['vce.pos', 'amc.a'], ['amc.b', 'rs.a'], ['rs.b', 'q.collector', 'vm.a'],
            ['bat.neg', 'vce.neg', 'q.emitter', 'vm.b'],
        ],
    },

    // Button charges a 100 µF electrolytic at once; it drains through 47 k into a Darlington.
    'lab-delay-off-timer': {
        vcc: 9, supply: SUP,
        parts: { bat: BAT9, btn: ['button', {}], rs: R(100), ct: ['polarized_cap', { farads: 100e-6 }],
            rb: R(47000), q1: NPN, q2: NPN, rl: R(1000), led: LED('yellow') },
        nets: [
            ['bat.pos', 'btn.a', 'rl.a'], ['btn.b', 'rs.a'], ['rs.b', 'ct.pos', 'rb.a'], ['rb.b', 'q1.base'],
            ['q1.emitter', 'q2.base'], ['rl.b', 'led.anode'], ['led.cathode', 'q1.collector', 'q2.collector'],
            ['bat.neg', 'ct.neg', 'q2.emitter'],
        ],
    },

    // Four transistors, each used as ONE junction with the third lead open:
    // B-E forward, B-C forward, B-E reversed, B-C reversed.
    'lab-transistor-two-diodes': {
        vcc: 5, supply: SUP,
        parts: { bat: ['vsource', { volts: 5 }],
            ra: R(470), la: LED('green'), qa: NPN_EM, rb: R(470), lb: LED('green'), qb: NPN_EM,
            rc: R(470), lc: LED('red'), qc: NPN_EM, rd: R(470), ld: LED('red'), qd: NPN_EM },
        nets: [
            ['bat.pos', 'ra.a', 'rb.a', 'rc.a', 'rd.a'],
            ['ra.b', 'la.anode'], ['la.cathode', 'qa.base'],
            ['rb.b', 'lb.anode'], ['lb.cathode', 'qb.base'],
            ['rc.b', 'lc.anode'], ['lc.cathode', 'qc.emitter'],
            ['rd.b', 'ld.anode'], ['ld.cathode', 'qd.collector'],
            ['bat.neg', 'qa.emitter', 'qb.collector', 'qc.base', 'qd.base'],
        ],
        open: ['qa.collector', 'qb.emitter', 'qc.collector', 'qd.emitter'],
    },

    // Three dividers onto three bases: each LED lights above its own voltage.
    'lab-battery-threshold': {
        vcc: 6, supply: SUP,
        parts: { bat: ['vsource', { volts: 6 }],
            u1: R(22000), d1: R(4700), q1: NPN, r1: R(1000), l1: LED('red'),
            u2: R(22000), d2: R(3300), q2: NPN, r2: R(1000), l2: LED('yellow'),
            u3: R(22000), d3: R(2200), q3: NPN, r3: R(1000), l3: LED('green') },
        nets: [
            ['bat.pos', 'u1.a', 'u2.a', 'u3.a', 'r1.a', 'r2.a', 'r3.a'],
            ['u1.b', 'd1.a', 'q1.base'], ['u2.b', 'd2.a', 'q2.base'], ['u3.b', 'd3.a', 'q3.base'],
            ['r1.b', 'l1.anode'], ['l1.cathode', 'q1.collector'],
            ['r2.b', 'l2.anode'], ['l2.cathode', 'q2.collector'],
            ['r3.b', 'l3.anode'], ['l3.cathode', 'q3.collector'],
            ['bat.neg', 'd1.b', 'd2.b', 'd3.b', 'q1.emitter', 'q2.emitter', 'q3.emitter'],
        ],
    },

    // Sensor transistor Q1 biased by NTC (top) and 1 k + trim rheostat
    // (bottom). Warm NTC -> Q1 conducts -> steals Q2's base current -> LED out.
    'lab-heat-alarm': {
        vcc: 9, supply: SUP,
        parts: { bat: BAT9, ntc: ['ntc', { rCold: 47000, rHot: 2200 }],
            trim: ['potentiometer', { ohms: 2200, position: 0.77 }], rt: R(470), q1: NPN,
            rb2: R(10000), q2: NPN, rl: R(1000), led: LED('green') },
        nets: [
            ['bat.pos', 'ntc.a', 'rb2.a', 'rl.a'], ['ntc.b', 'q1.base', 'trim.a'], ['trim.wiper', 'trim.b', 'rt.a'],
            ['q1.collector', 'rb2.b', 'q2.base'], ['rl.b', 'led.anode'], ['led.cathode', 'q2.collector'],
            ['bat.neg', 'rt.b', 'q1.emitter', 'q2.emitter'],
        ],
    },

    // One input voltage, two transistors: common emitter (2.2 k / 1 k, gain
    // about -2.2, inverting) and emitter follower (gain about 1).
    'lab-ce-vs-follower': {
        vcc: 9, supply: SUP,
        parts: { bat: BAT9, rtop: R(22000), pot: ['potentiometer', { ohms: 10000, position: 0.5 }],
            q1: NPN, rc: R(2200), re: R(1000), q2: NPN, re2: R(1000),
            vin: ['voltmeter', {}], vc: ['voltmeter', {}], ve: ['voltmeter', {}] },
        nets: [
            ['bat.pos', 'rtop.a', 'rc.a', 'q2.collector'], ['rtop.b', 'pot.a'],
            ['pot.wiper', 'q1.base', 'q2.base', 'vin.a'], ['rc.b', 'q1.collector', 'vc.a'],
            ['q1.emitter', 're.a'], ['q2.emitter', 're2.a', 've.a'],
            ['bat.neg', 'pot.b', 're.b', 're2.b', 'vin.b', 'vc.b', 've.b'],
        ],
    },

    // Same 50 Hz sine into a class B pair (no bias) and a class AB pair
    // (two diodes between the bases, 22 Ω emitter resistors). ±9 V.
    'lab-push-pull': {
        vcc: 9, supply: { pos: 'bp.pos', neg: 'gnd.gnd' },
        parts: { gnd: ['gnd', {}], bp: ['vsource', { volts: 9 }], bn: ['vsource', { volts: 9 }],
            sig: ['function_gen', { wave: 'sine', freq: 50, amplitude: 4, offset: 0 }],
            qn1: NPN, qp1: PNP, rl1: R(1000),
            r1: R(10000), d1: ['diode', { vf: 0.7 }], d2: ['diode', { vf: 0.7 }], r2: R(10000),
            qn2: NPN, qp2: PNP, re1: R(22), re2: R(22), rl2: R(1000) },
        nets: [
            ['gnd.gnd', 'bp.neg', 'bn.pos', 'sig.gnd', 'rl1.b', 'rl2.b'],
            ['bp.pos', 'qn1.collector', 'qn2.collector', 'r1.a'],
            ['bn.neg', 'qp1.collector', 'qp2.collector', 'r2.b'],
            ['sig.out', 'qn1.base', 'qp1.base', 'd1.cathode', 'd2.anode'],
            ['qn1.emitter', 'qp1.emitter', 'rl1.a'],
            ['r1.b', 'd1.anode', 'qn2.base'], ['d2.cathode', 'r2.a', 'qp2.base'],
            ['qn2.emitter', 're1.a'], ['qp2.emitter', 're2.a'], ['re1.b', 're2.b', 'rl2.a'],
        ],
    },

    // Op-amp monostable: button tops up a 22 µF electrolytic, 470 k bleeds
    // it; half of an LM358 compares it with 3 V and holds green while the
    // capacitor is above. The parked half is a grounded follower.
    'lab-two-led-monostable': {
        vcc: 9, supply: SUP,
        parts: { bat: BAT9, u: ['lm358', {}], ra: R(20000), rb: R(10000), go: ['button', {}], rch: R(100),
            ct: ['polarized_cap', { farads: 22e-6 }], rt: R(470000),
            rr: R(1000), red: LED('red'), rg: R(1000), green: LED('green') },
        nets: [
            ['bat.pos', 'u.vcc', 'ra.a', 'go.a', 'rr.a'],
            ['bat.neg', 'u.gnd', 'rb.b', 'ct.neg', 'rt.b', 'green.cathode', 'u.2_pos'],
            ['ra.b', 'rb.a', 'u.1_neg'], ['go.b', 'rch.a'], ['rch.b', 'ct.pos', 'rt.a', 'u.1_pos'],
            ['rr.b', 'red.anode'], ['red.cathode', 'u.1_out', 'rg.a'], ['rg.b', 'green.anode'],
            ['u.2_neg', 'u.2_out'],
        ],
    },

    // Buffered half-supply reference with uneven loads on both sides, next to
    // a bare 10 k / 10 k divider carrying one load.
    'lab-virtual-ground': {
        vcc: 9, supply: SUP,
        parts: { bat: BAT9, u: ['lm358', {}], ra: R(10000), rb: R(10000),
            rA: R(470), lA: LED('red'), rB: R(1000), lB: LED('green'),
            rc: R(10000), rd: R(10000), rE: R(1000), lE: LED('yellow'),
            vm1: ['voltmeter', {}], vm2: ['voltmeter', {}] },
        nets: [
            ['bat.pos', 'u.vcc', 'ra.a', 'rA.a', 'rc.a', 'rE.a'],
            ['bat.neg', 'u.gnd', 'rb.b', 'lB.cathode', 'rd.b', 'vm1.b', 'vm2.b'],
            ['ra.b', 'rb.a', 'u.1_pos'], ['u.1_neg', 'u.1_out', 'lA.cathode', 'rB.a', 'vm1.a'],
            ['rA.b', 'lA.anode'], ['rB.b', 'lB.anode'],
            ['rc.b', 'rd.a', 'lE.cathode', 'vm2.a'], ['rE.b', 'lE.anode'],
            ['u.2_pos', 'u.2_neg', 'u.2_out'],
        ],
    },

    // 10 k known, 6.8 k or 4.7 k unknown (slide switch), 10 k pot as the
    // ratio arm, voltmeter between the two midpoints.
    'lab-wheatstone-bridge': {
        vcc: 9, supply: SUP,
        parts: { bat: BAT9, rn: R(10000), sw: ['slide_switch', { position: 0 }], rx1: R(6800), rx2: R(4700),
            pot: ['potentiometer', { ohms: 10000, position: 0.5 }], vm: ['voltmeter', {}] },
        nets: [
            ['bat.pos', 'rn.a', 'pot.a'], ['rn.b', 'sw.com', 'vm.a'], ['sw.a', 'rx1.a'], ['sw.b', 'rx2.a'],
            ['pot.wiper', 'vm.b'], ['bat.neg', 'rx1.b', 'rx2.b', 'pot.b'],
        ],
    },

    // Phototransistor (0.5 mA at full light) into a 10 k emitter load, so the
    // sensor node reads about 5 V x light; two comparators (LM393, open
    // collector, outputs tied) release the shared node only while
    // 1.5 V < sensor < 3.5 V.
    'lab-window-comparator': {
        vcc: 5, supply: SUP,
        parts: { bat: ['vsource', { volts: 5 }], pt: ['phototransistor', { iMax: 0.5e-3, light: 0 }], rs: R(10000),
            rh: R(15000), rm: R(20000), rl: R(15000), u: ['lm393', {}],
            pu: R(4700), rbq: R(10000), q: NPN, rled: R(330), led: LED('green') },
        nets: [
            ['bat.pos', 'pt.collector', 'rh.a', 'u.vcc', 'pu.a', 'rled.a'],
            ['pt.emitter', 'rs.a', 'u.1_pos', 'u.2_neg'],
            ['rh.b', 'rm.a', 'u.2_pos'], ['rm.b', 'rl.a', 'u.1_neg'],
            ['u.1_out', 'u.2_out', 'pu.b', 'rbq.a'], ['rbq.b', 'q.base'],
            ['rled.b', 'led.anode'], ['led.cathode', 'q.collector'],
            ['bat.neg', 'rs.b', 'rl.b', 'u.gnd', 'q.emitter'],
        ],
    },

    // Two-bit DAC: slide switches put a 1.5 V reference on 15 k (bit 1) and
    // 30 k (bit 0) into a summing amplifier (10 k feedback), then a unity
    // inverter. LM324 on ±9 V.
    'lab-2bit-dac': {
        vcc: 9, supply: { pos: 'bp.pos', neg: 'gnd.gnd' },
        parts: { gnd: ['gnd', {}], bp: ['vsource', { volts: 9 }], bn: ['vsource', { volts: 9 }],
            ref: ['vsource', { volts: 1.5, variant: 'aa' }],
            s1: ['slide_switch', { position: 1 }], s0: ['slide_switch', { position: 0 }],
            r1: R(15000), r0: R(30000), rf: R(10000), r3: R(10000), r4: R(10000),
            u: ['lm324', {}], vm: ['voltmeter', {}] },
        nets: [
            ['gnd.gnd', 'bp.neg', 'bn.pos', 'ref.neg', 's1.a', 's0.a', 'u.1_pos', 'u.2_pos', 'u.3_pos', 'u.4_pos', 'vm.b'],
            ['bp.pos', 'u.vcc'], ['bn.neg', 'u.gnd'], ['ref.pos', 's1.b', 's0.b'],
            ['s1.com', 'r1.a'], ['s0.com', 'r0.a'], ['r1.b', 'r0.b', 'rf.a', 'u.1_neg'],
            ['rf.b', 'u.1_out', 'r3.a'], ['r3.b', 'r4.a', 'u.2_neg'], ['r4.b', 'u.2_out', 'vm.a'],
            ['u.3_neg', 'u.3_out'], ['u.4_neg', 'u.4_out'],
        ],
    },

    // Two-bit flash ADC: a 4 × 10 k ladder gives 1.25 / 2.5 / 3.75 V, three
    // comparators (an LM339, open collector, 10 k pull-ups to 5 V) give a
    // thermometer code, gates turn it into binary:
    // MSB = C2, LSB = (C1 AND NOT C2) OR C3.
    'lab-2bit-adc': {
        vcc: 5, supply: SUP,
        parts: { bat: ['vsource', { volts: 5 }], pot: ['potentiometer', { ohms: 10000, position: 0.6 }],
            k: ['lm339', {}], p1: R(10000), p2: R(10000), p3: R(10000),
            inv: ['74hc14', {}], and: ['74hc08', {}], or: ['74hc32', {}],
            l4: R(10000), l3: R(10000), l2: R(10000), l1: R(10000),
            rm: R(470), lm: LED('red'), rl: R(470), ll: LED('red') },
        nets: [
            ['bat.pos', 'pot.a', 'l4.a', 'k.vcc', 'p1.a', 'p2.a', 'p3.a', 'inv.vcc', 'and.vcc', 'or.vcc'],
            ['l4.b', 'l3.a', 'k.3_neg'], ['l3.b', 'l2.a', 'k.2_neg'], ['l2.b', 'l1.a', 'k.1_neg'],
            ['pot.wiper', 'k.1_pos', 'k.2_pos', 'k.3_pos'],
            ['k.2_out', 'p2.b', 'inv.1a'], ['inv.1y', 'inv.2a', 'and.1b'], ['inv.2y', 'rm.a'],
            ['k.1_out', 'p1.b', 'and.1a'], ['and.1y', 'or.1a'], ['k.3_out', 'p3.b', 'or.1b'], ['or.1y', 'rl.a'],
            ['rm.b', 'lm.anode'], ['rl.b', 'll.anode'],
            ['bat.neg', 'pot.b', 'l1.b', 'lm.cathode', 'll.cathode', 'k.gnd', 'k.4_pos', 'k.4_neg',
                'inv.gnd', 'and.gnd', 'or.gnd',
                'inv.3a', 'inv.4a', 'inv.5a', 'inv.6a', 'and.2a', 'and.2b', 'and.3a', 'and.3b', 'and.4a', 'and.4b',
                'or.2a', 'or.2b', 'or.3a', 'or.3b', 'or.4a', 'or.4b'],
        ],
        open: ['k.4_out', 'inv.3y', 'inv.4y', 'inv.5y', 'inv.6y', 'and.2y', 'and.3y', 'and.4y', 'or.2y', 'or.3y', 'or.4y'],
    },

    // Triangle/square generator on one LM358: half 2 integrates, half 1 is a
    // comparator with hysteresis whose output drives the integrator.
    'lab-function-generator': {
        vcc: 9, supply: SUP,
        parts: { bat: BAT9, ra: R(10000), rb: R(10000), us: ['lm358', {}],
            rmin: R(22000), pot: ['potentiometer', { ohms: 100000, position: 0.3 }], ci: ['capacitor', { farads: 1e-6 }],
            r1: R(10000), r2: R(22000), rq: R(1000), lq: LED('red'), rt: R(1000), lt: LED('yellow') },
        nets: [
            ['bat.pos', 'ra.a', 'us.vcc'], ['bat.neg', 'rb.b', 'us.gnd', 'lq.cathode', 'lt.cathode'],
            ['ra.b', 'rb.a', 'us.2_pos', 'us.1_neg'],
            ['us.1_out', 'r2.b', 'rq.a', 'rmin.a'], ['rmin.b', 'pot.a'], ['pot.wiper', 'pot.b', 'ci.a', 'us.2_neg'],
            ['us.2_out', 'ci.b', 'r1.a', 'rt.a'], ['r1.b', 'r2.a', 'us.1_pos'],
            ['rq.b', 'lq.anode'], ['rt.b', 'lt.anode'],
        ],
    },
    // Treble path: 22 nF + 10 k high-pass; bass path: 4.7 k + 1 µF low-pass.
    // 47 k base resistors keep both drivers out of saturation. The source is a
    // function_gen (50 ohm output); the scenario sweeps its live freq param.
    'lab-two-band-light-organ': {
        vcc: 9, supply: SUP,
        parts: { bat: BAT9, sig: ['function_gen', { wave: 'sine', freq: 50, amplitude: 4, offset: 0, rOut: 50 }],
            ch: ['capacitor', { farads: 22e-9 }], rh: R(10000), bh: R(47000), qh: NPN, r1: R(470), l1: LED('blue'),
            rlp: R(4700), cl: ['capacitor', { farads: 1e-6 }], bl: R(47000), ql: NPN, r2: R(470), l2: LED('red') },
        nets: [
            ['bat.pos', 'r1.a', 'r2.a'],
            ['bat.neg', 'sig.gnd', 'rh.b', 'cl.b', 'qh.emitter', 'ql.emitter'],
            ['sig.out', 'ch.a', 'rlp.a'], ['ch.b', 'rh.a', 'bh.a'], ['bh.b', 'qh.base'],
            ['rlp.b', 'cl.a', 'bl.a'], ['bl.b', 'ql.base'],
            ['r1.b', 'l1.anode'], ['l1.cathode', 'qh.collector'],
            ['r2.b', 'l2.anode'], ['l2.cathode', 'ql.collector'],
        ],
    },
    // Voltage-to-frequency: the input (pot, measured from a buffered 4.5 V
    // reference) drives an integrator ramp down; a Schmitt trigger flips at
    // 4.0 V and, through a diode and 15 k, pulls the ramp back up to 5.5 V,
    // then lets go. Pulses per second follow the input voltage. Two LM358s:
    // kref half 1 buffers the reference, us half 2 integrates, us half 1 is
    // the trigger.
    'lab-v-to-f': {
        vcc: 9, supply: SUP,
        parts: { bat: BAT9, ra: R(10000), rb: R(10000), kref: ['lm358', {}], us: ['lm358', {}],
            pot: ['potentiometer', { ohms: 10000, position: 0.4 }], ri: R(100000), ci: ['capacitor', { farads: 2.2e-6 }],
            d: ['diode', { vf: 0.7 }], rd: R(15000), r1: R(10000), r2: R(47000), rq: R(1000), lq: LED('green') },
        nets: [
            ['bat.pos', 'ra.a', 'pot.a', 'kref.vcc', 'us.vcc', 'rq.a'], ['bat.neg', 'rb.b', 'kref.gnd', 'us.gnd'],
            ['ra.b', 'rb.a', 'kref.1_pos'], ['kref.1_out', 'kref.1_neg', 'pot.b', 'us.2_pos', 'us.1_neg'],
            ['pot.wiper', 'ri.a'], ['ri.b', 'ci.a', 'us.2_neg', 'd.anode'], ['d.cathode', 'rd.a'],
            ['us.2_out', 'ci.b', 'r1.a'], ['r1.b', 'r2.a', 'us.1_pos'],
            ['us.1_out', 'r2.b', 'rd.b', 'lq.cathode'], ['rq.b', 'lq.anode'], ['kref.2_pos', 'kref.2_neg', 'kref.2_out'],
        ],
    },
};

/** The engine ids the generator gives each named part of a bench. */
export function benchIds(spec) {
    let n = 2; // breadboard_1 comes first
    const ids = {};
    for (const [name, [kind]] of Object.entries(spec.parts)) ids[name] = `${kind}_${n++}`;
    return ids;
}
