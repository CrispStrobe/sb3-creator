/**
 * Which script writes which `lab-*` circuit.json.
 *
 * A bench a generator owns is re-laid out by running that generator; every
 * other lab bench is hand-authored and re-seated by scripts/seat-lab-benches.mjs.
 * Both go through scripts/lib/bench-layout.mjs.
 */
import { BENCHES as SET4 } from './lab-benches-4.mjs';
import { BENCHES as SET5 } from './lab-benches-5.mjs';
import { BENCHES as SET6 } from './lab-benches-6.mjs';
import { BENCHES as SET8 } from './lab-benches-8.mjs';
import { BENCHES as SET_OPTICS } from './lab-benches-optics.mjs';
import { BENCHES as SET_FIELDS } from './lab-benches-fields.mjs';
import { BENCHES as SET_RF } from './lab-benches-rf.mjs';
import { BENCHES as SET_R6H } from './lab-benches-r6h.mjs';
import { BENCHES as SET_R6G } from './lab-benches-r6g.mjs';
import { BENCHES as SET_R6I } from './lab-benches-r6i.mjs';
import { BENCHES as SET_R6F } from './lab-benches-r6f.mjs';
import { BENCHES as SET_R6E } from './lab-benches-r6e.mjs';
import { BENCHES as SET_R6B } from './lab-benches-r6b.mjs';
import { BENCHES as SET_R6C } from './lab-benches-r6c.mjs';
import { BENCHES as SET_R6D } from './lab-benches-r6d.mjs';
import { BENCHES as SET_R6XN1 } from './lab-benches-r6a.mjs';
import { BENCHES as SET_MOSFET } from './lab-benches-mosfet.mjs';
import { BENCHES as SET_DISCRETE } from './lab-benches-discrete.mjs';
import { BENCHES as SET_OPAMP } from './lab-benches-opamp.mjs';
import { BENCHES as SET_COUNTING } from './lab-benches-counting.mjs';
import { BENCHES as SET_R7MECH } from './lab-benches-r7mech.mjs';
import { BENCHES as SET_R7VHF } from './lab-benches-r7vhf.mjs';
import { BENCHES as SET_R7MIX } from './lab-benches-r7mix.mjs';
import { BENCHES as SET_R7MW } from './lab-benches-r7mw.mjs';
import { BENCHES as SET_R7B } from './lab-benches-r7b.mjs';
import { BENCHES as SET_R10B } from './lab-benches-r10b.mjs';
import { BENCHES as SET_R10C } from './lab-benches-r10c.mjs';
import { BENCHES as SET_R10D } from './lab-benches-r10d.mjs';
import { BENCHES as SET_R10A } from './lab-benches-r10a.mjs';
import { BENCHES as SET_R9 } from './lab-benches-r9.mjs';
import { BENCHES as SET_R11 } from './lab-benches-r11.mjs';
import { BENCHES as SET_THRESHOLDS } from './lab-benches-thresholds.mjs';
import { BENCHES as SET_R7A } from './lab-benches-r7a.mjs';

/** scripts/gen-lab-batch2.mjs — kept in step with its `B[...]` table. */
export const BATCH2_BENCHES = Object.freeze([
    'lab-nand-code-lock', 'lab-first-press-wins', 'lab-mosfet-memory', 'lab-lamp-monitor',
    'lab-meter-multiplier', 'lab-meter-shunt', 'lab-led-threshold', 'lab-colour-pitch',
    'lab-light-tone', 'lab-exposure-timer', 'lab-hearing-sweep', 'lab-flicker-fusion',
    'lab-level-crossing', 'lab-led-light-sensor', 'lab-log-amp', 'lab-hall-poles',
    'lab-listening-amp', 'lab-lc-ringing',
]);

/** scripts/gen-lab-circuits-4.mjs --set=4|5|6|8|optics|fields|rf|r6a|r7mech|mosfet|discrete|opamp|counting|r7vhf|r7mix|r7mw|r7b|r10b|r10c|r10d|r11|thresholds|r7a */
export const CIRCUITS4_BENCHES = Object.freeze({
    4: Object.keys(SET4), 5: Object.keys(SET5), 6: Object.keys(SET6), 8: Object.keys(SET8), optics: Object.keys(SET_OPTICS),
    fields: Object.keys(SET_FIELDS), rf: Object.keys(SET_RF),
    r6h: Object.keys(SET_R6H),
    r9: Object.keys(SET_R9),
    r6g: Object.keys(SET_R6G),
    r6i: Object.keys(SET_R6I),
    r6f: Object.keys(SET_R6F),
    r6e: Object.keys(SET_R6E),
    r6b: Object.keys(SET_R6B),
    r6c: Object.keys(SET_R6C),
    r6d: Object.keys(SET_R6D), r6a: Object.keys(SET_R6XN1),
    r7mech: Object.keys(SET_R7MECH), r7vhf: Object.keys(SET_R7VHF),
    mosfet: Object.keys(SET_MOSFET), discrete: Object.keys(SET_DISCRETE), opamp: Object.keys(SET_OPAMP),
    counting: Object.keys(SET_COUNTING),
    r7mix: Object.keys(SET_R7MIX),
    r7mw: Object.keys(SET_R7MW),
    r7b: Object.keys(SET_R7B),
    r10b: Object.keys(SET_R10B),
    r10c: Object.keys(SET_R10C),
    r10d: Object.keys(SET_R10D),
    r10a: Object.keys(SET_R10A),
    r11: Object.keys(SET_R11),
    thresholds: Object.keys(SET_THRESHOLDS),
    r7a: Object.keys(SET_R7A),
});

export const GENERATED_LAB_BENCHES = new Set([
    ...BATCH2_BENCHES, ...Object.values(CIRCUITS4_BENCHES).flat(),
]);

/**
 * Lab benches whose layout is left alone for now: on 2026-11-23 a parallel
 * measurement pass owned them (lab-amp-horn: its button is drawn over its
 * electrolytic; lab-am-detector: its earpiece is off the board). The layout
 * gates skip them and the re-seater leaves them out of its default run.
 * Re-seat with `node scripts/seat-lab-benches.mjs lab-am-detector` and
 * `node scripts/gen-lab-circuits-4.mjs --set=6 lab-amp-horn` once that pass
 * has landed, then empty this list.
 */
export const LAYOUT_PENDING = new Set();
