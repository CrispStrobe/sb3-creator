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
import { BENCHES as SET_MOSFET } from './lab-benches-mosfet.mjs';
import { BENCHES as SET_DISCRETE } from './lab-benches-discrete.mjs';
import { BENCHES as SET_OPAMP } from './lab-benches-opamp.mjs';
import { BENCHES as SET_COUNTING } from './lab-benches-counting.mjs';

/** scripts/gen-lab-batch2.mjs — kept in step with its `B[...]` table. */
export const BATCH2_BENCHES = Object.freeze([
    'lab-nand-code-lock', 'lab-first-press-wins', 'lab-mosfet-memory', 'lab-lamp-monitor',
    'lab-meter-multiplier', 'lab-meter-shunt', 'lab-led-threshold', 'lab-colour-pitch',
    'lab-light-tone', 'lab-exposure-timer', 'lab-hearing-sweep', 'lab-flicker-fusion',
    'lab-level-crossing', 'lab-led-light-sensor', 'lab-log-amp', 'lab-hall-poles',
    'lab-listening-amp', 'lab-lc-ringing',
]);

/** scripts/gen-lab-circuits-4.mjs --set=4|5|6|8|optics|fields|rf|mosfet|discrete|opamp|counting */
export const CIRCUITS4_BENCHES = Object.freeze({
    4: Object.keys(SET4), 5: Object.keys(SET5), 6: Object.keys(SET6), 8: Object.keys(SET8), optics: Object.keys(SET_OPTICS),
    fields: Object.keys(SET_FIELDS), rf: Object.keys(SET_RF),
    mosfet: Object.keys(SET_MOSFET), discrete: Object.keys(SET_DISCRETE), opamp: Object.keys(SET_OPAMP),
    counting: Object.keys(SET_COUNTING),
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
