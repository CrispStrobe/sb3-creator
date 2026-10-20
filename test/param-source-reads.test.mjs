import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readParamKeys } from './helpers/param-source-reads.mjs';

// The actual world.ambient first read, followed by its unchanged precedence.
const world = `export function ambient (part, param, fallback) {
  const v = part?.params?.[param];
  if (v !== undefined && v !== null) return v;
  const w = worldDefault(part, param);
  return w !== undefined ? w : fallback;
}`;
const read = entries => readParamKeys(new Map(entries));

test('literal helper keys follow the actual relative imported parameter reader', () => {
    const keys = read([
        ['/engine/world.js', world],
        ['/engine/devices/dallas.js', `import { ambient } from '../world.js';
            const temp = ambient(part, 'temperature', 25);`],
        ['/engine/devices/kit.js', `import { ambient as sensorValue } from '../world.js';
            const h = sensorValue(part, 'humidity', 50);`],
    ]);
    assert.ok(keys.has('temperature'));
    assert.ok(keys.has('humidity'));
    assert.ok(!keys.has('param'));
});

test('unrelated helper names, wrong imports, dynamic keys and comments do not vote', () => {
    const keys = read([
        ['/engine/world.js', world],
        ['/engine/no-read.js', 'export function ambient(part, param, fallback) { return fallback; }'],
        ['/engine/devices/sensor.js', `import { ambient } from '../no-read.js';
            ambient(part, 'inventedWrongModule', 25);`],
        ['/engine/local.js', `function ambient(part, param) { return 25; }
            ambient(part, 'inventedLocal', 25);`],
        ['/engine/read.js', `import { ambient } from './world.js';
            // ambient(part, 'inventedComment', 25);
            /* ambient(part, 'inventedBlockComment', 25); */
            ambient(part, dynamicKey, 25);`],
    ]);
    assert.deepEqual([...keys], []);
});

test('existing direct, destructured and params-alias reads retain their keys', () => {
    const keys = read([['/engine/direct.js', `
        const a = part.params?.ohms;
        const b = part.params['farads'];
        const { rDark, rLight: light } = part.params;
        const P = part.params; const c = P.freq;
        // part.params.invented
    `]]);
    for (const key of ['ohms', 'farads', 'rDark', 'rLight', 'freq']) assert.ok(keys.has(key), key);
    assert.ok(!keys.has('invented'));
});
