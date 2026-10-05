// `wait <variable> ms` waits that many milliseconds -- on the chip and in the
// referee. The dialect stores every wait in seconds, so `wait pause ms` is the
// quotient `pause / 1000`; the C emitter then multiplied AFTER the integer
// division, `delay_ms((pause / 1000) * 1000)`, which is 0 for every pause under
// a second. The referee divided the same way, so the trace agreed with the
// broken firmware and nothing failed. A die whose roll was meant to slow from
// 50 ms to 320 ms per face rolled all ten faces in the same instant.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import SB3Creator from '../src/utils/sb3Creator.js';
import { interpretTrace } from '../src/utils/traceOracle.js';

const src = (wait) => `DEVICE STC12C5A60S2
CLOCK 11059200
PIN lamp = P1.0 OUTPUT ACTIVE LOW

WHEN flag clicked:
  set pause to 250
  FOREVER:
    toggle lamp
    ${wait}
`;
const build = (s, device) => {
  const c = new SB3Creator();
  c.parse(device ? SB3Creator.retargetPseudocode(s, device).pseudocode : s);
  return c;
};

for (const device of [null, 'arduino-uno', 'pico']) {
  test(`${device || 'stc12c5a60s2'}: wait <var> ms emits the variable, not (var / 1000) * 1000`, () => {
    const code = build(src('wait pause ms'), device).generateC();
    assert.match(code, /delay_ms\(\(unsigned int\)\(pause\)\);/);
    assert.doesNotMatch(code, /\(pause \/ 1000\)\) \* 1000/);
  });
}

test('a quotient by any literal scales first: wait pause / 4 seconds', () => {
  const code = build(src('wait pause / 4 seconds')).generateC();
  assert.match(code, /delay_ms\(\(unsigned int\)\(\(pause\) \* 1000 \/ 4\)\);/);
});

test('a literal wait is untouched', () => {
  assert.match(build(src('wait 0.25 seconds')).generateC(), /delay_ms\(250\);/);
});

test('the referee waits the same 250 ms the chip does', () => {
  const t = interpretTrace(build(src('wait pause ms')).project, { horizonMs: 1100, stimulus: [] });
  assert.deepEqual(t.events.map((e) => e.tMs), [0, 250, 500, 750, 1000]);
});
