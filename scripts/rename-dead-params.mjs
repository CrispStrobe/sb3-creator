/**
 * One-shot repair: rename circuit params the engine never reads to the keys it
 * does read. See test/dead-circuit-params.test.mjs for the standing gate.
 */
import { readFileSync, writeFileSync, readdirSync, statSync } from 'node:fs';
import { join } from 'node:path';

const EXAMPLES = join(import.meta.dirname, '..', 'examples');

/** kind -> { deadKey: liveKey }.  A null target means "drop, nothing reads it". */
const RENAMES = {
    ldr:   { maxOhms: 'rDark', minOhms: 'rLight' },
    ntc:   { maxOhms: 'rCold', minOhms: 'rHot' },
    opamp: { voutHigh: 'railHigh', voutLow: 'railLow' },
};
const DROPS = {
    '74hc595': ['outputs'],      // the model is hardwired to 8 stages
    matrix8x8: ['polarity'],     // a part-number tag; the model reads col/rowActiveHigh
};

let files = 0, changed = 0, edits = 0;
for (const dir of readdirSync(EXAMPLES)) {
    if (dir === 'AUDIT' || !statSync(join(EXAMPLES, dir)).isDirectory()) continue;
    for (const file of readdirSync(join(EXAMPLES, dir))) {
        if (!/^circuit.*\.json$/.test(file)) continue;
        files++;
        const path = join(EXAMPLES, dir, file);
        const text = readFileSync(path, 'utf8');
        const data = JSON.parse(text);
        let touched = false;
        for (const part of data.parts || []) {
            if (!part.params) continue;
            for (const [dead, live] of Object.entries(RENAMES[part.kind] || {})) {
                const params = part.params;   // re-read: an earlier rename replaced it
                if (!(dead in params)) continue;
                // Order matters for review diffs: rebuild the object so the live
                // key sits where the dead one was.
                const rebuilt = {};
                for (const [k, v] of Object.entries(params)) {
                    if (k === dead) rebuilt[live] = v; else rebuilt[k] = v;
                }
                part.params = rebuilt;
                touched = true; edits++;
            }
            for (const dead of DROPS[part.kind] || []) {
                if (!(dead in part.params)) continue;
                delete part.params[dead];
                touched = true; edits++;
            }
        }
        if (!touched) continue;
        // Preserve the file's existing indentation and trailing newline.
        const indent = /\n(\s+)"/.exec(text)?.[1]?.length ?? 2;
        writeFileSync(path, JSON.stringify(data, null, indent) + (text.endsWith('\n') ? '\n' : ''));
        changed++;
    }
}
console.log(`scanned ${files} circuit files; rewrote ${changed} with ${edits} key edits`);
