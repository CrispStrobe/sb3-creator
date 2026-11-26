#!/usr/bin/env node
/**
 * Print the test files of one CI shard: `node scripts/test-shard.mjs 2/4`.
 *
 * node --test --test-shard deals files round-robin by name, and the gallery's
 * scenario files are not alike: on the first three-shard run one shard was
 * done in 7 minutes while another took 27, because the files that cost
 * minutes sat next to each other in the alphabet. This deals by MEASURED
 * weight instead (test/fixtures/test-file-seconds.json): heaviest file first,
 * always onto the lightest shard so far (longest-processing-time first).
 *
 * What it guarantees does not depend on the weights: every test/*.test.mjs
 * goes to exactly one shard, and the same files always produce the same
 * deal. A stale weight only unbalances the shards.
 */
import { readdirSync, readFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const UNMEASURED_SECONDS = 5;

export function dealShards (files, weights, total) {
    const order = [...files].sort((a, b) =>
        (weights[b] ?? UNMEASURED_SECONDS) - (weights[a] ?? UNMEASURED_SECONDS) || a.localeCompare(b));
    const shards = Array.from({ length: total }, () => ({ load: 0, files: [] }));
    for (const f of order) {
        let best = 0;
        for (let i = 1; i < total; i++) if (shards[i].load < shards[best].load) best = i;
        shards[best].files.push(f);
        shards[best].load += weights[f] ?? UNMEASURED_SECONDS;
    }
    return shards;
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
    const m = String(process.argv[2] || '1/1').match(/^(\d+)\/(\d+)$/);
    if (!m || +m[1] < 1 || +m[1] > +m[2]) {
        console.error('usage: node scripts/test-shard.mjs <index>/<total>, 1-based');
        process.exit(2);
    }
    const files = readdirSync(join(ROOT, 'test')).filter(f => f.endsWith('.test.mjs')).sort();
    const { seconds } = JSON.parse(readFileSync(join(ROOT, 'test', 'fixtures', 'test-file-seconds.json'), 'utf8'));
    const shard = dealShards(files, seconds, +m[2])[+m[1] - 1];
    console.log(shard.files.map(f => `test/${f}`).join('\n'));
}
