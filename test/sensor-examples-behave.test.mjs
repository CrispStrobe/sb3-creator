// What each sensor/game example DOES, driven through the referee with the
// stimulus its lesson describes, on the authored chip and on a 10-bit and a
// 12-bit retarget.
//
// The generic gates already prove these examples parse, compile on every
// device, keep a non-degenerate trace and round-trip. None of that says the
// PIR lamp really holds for five seconds after the LAST movement, that one
// clap toggles once, or that a false start hands the round to the other
// player. Those are the claims the intros and EXPECTED.md make, so they are
// asserted here, against the trace the referee computes from the program.
//
// Stimulus levels are ELECTRICAL (an active-low key reads 0 when pressed);
// trace events are LOGICAL (lamp 1 = lit), and pin names arrive lower-case.
import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import SB3Creator from '../src/utils/sb3Creator.js';
import { interpretTrace } from '../src/utils/traceOracle.js';

const EXAMPLES = join(import.meta.dirname, '..', 'examples');
const ADC = {
  stc12c5a60s2: { bits: 10, vref: 5 },
  'arduino-uno': { bits: 10, vref: 5 },
  pico: { bits: 12, vref: 3.3 },
};

function run(id, stimulus, horizonMs, device = 'stc12c5a60s2') {
  let src = readFileSync(join(EXAMPLES, id, 'program.bw'), 'utf8');
  if (device !== 'stc12c5a60s2') {
    const r = SB3Creator.retargetPseudocode(src, device);
    assert.equal(r.ok, true, (r.reasons || []).join('; '));
    src = r.pseudocode;
  }
  const c = new SB3Creator();
  c.parse(src);
  const t = interpretTrace(c.project, { horizonMs, adc: ADC[device], stimulus });
  assert.deepEqual(t.unsupported, [], 'the referee must speak the whole program');
  return t;
}

/** Logical level of `pin` just after `tMs` (0 before its first event). */
const levelAt = (t, pin, tMs) => {
  let v = 0;
  for (const e of t.events) if (e.pin === pin && e.tMs <= tMs) v = e.level;
  return v;
};
const rises = (t, pin, from = 0, to = Infinity) =>
  t.events.filter((e) => e.pin === pin && e.level === 1 && e.tMs >= from && e.tMs < to);
const lines = (t) => t.serial.map((s) => String(s.line));

/** An active-low key: released (1) at 0, pressed (0) at `at` for `ms`. */
const press = (pin, at, ms = 100) => [{ tMs: at, pin, level: 0 }, { tMs: at + ms, pin, level: 1 }];
const idle = (...pins) => pins.map((pin) => ({ tMs: 0, pin, level: 1 }));
/** An active-high driven sensor output: HIGH from `at` for `ms`. */
const pulse = (pin, at, ms) => [{ tMs: at, pin, level: 1 }, { tMs: at + ms, pin, level: 0 }];
const volts = (pin, ...pairs) => pairs.map(([tMs, v]) => ({ tMs, pin, volts: v }));

const DEVICES = ['stc12c5a60s2', 'arduino-uno', 'pico'];

describe('sense-pir-alarm', () => {
  for (const dev of DEVICES) {
    test(`${dev}: lamp holds 5 s after the LAST motion; one alarm, two chirps`, () => {
      const t = run('sense-pir-alarm', [
        { tMs: 0, pin: 'pir', level: 0 },
        ...pulse('pir', 1000, 200), ...pulse('pir', 3000, 200),
      ], 10000, dev);
      assert.equal(levelAt(t, 'lamp', 1050), 1, 'lamp lights at the first motion');
      assert.equal(rises(t, 'buzzer').length, 2, 'two chirps for ONE alarm, none for the retrigger');
      assert.equal(levelAt(t, 'lamp', 7000), 1, 'still on 3.8 s after the second motion');
      const off = t.events.find((e) => e.pin === 'lamp' && e.level === 0);
      assert.ok(off && off.tMs >= 8000 && off.tMs <= 8400, `lamp off ~5 s after 3.2 s, got ${off?.tMs}`);  // MEASURED 2026-10-05: 8100 ms on stc12, uno and pico (3.2 s + 50 x 100 ms, sampled)
      assert.deepEqual(lines(t), ['motion', 'quiet']);
    });
  }
});

describe('sense-clap-switch', () => {
  for (const dev of DEVICES) {
    test(`${dev}: each clap toggles once, a long noise toggles once`, () => {
      const t = run('sense-clap-switch', [
        { tMs: 0, pin: 'clap', level: 0 },
        ...pulse('clap', 500, 150), ...pulse('clap', 1500, 150), ...pulse('clap', 2500, 2000),
      ], 6000, dev);
      assert.equal(levelAt(t, 'lamp', 600), 1, '1st clap: on');
      assert.equal(levelAt(t, 'lamp', 1600), 0, '2nd clap: off');
      assert.equal(levelAt(t, 'lamp', 5500), 1, 'a 2 s noise is ONE toggle');
      assert.equal(t.events.filter((e) => e.pin === 'lamp' && e.tMs > 2400).length, 1);  // MEASURED 2026-10-05: the long noise starts at 2500, one toggle observed
    });
  }
});

describe('sense-noise-counter', () => {
  const claps = (n) => Array.from({ length: n }, (_, i) => pulse('noise', 500 + i * 1000, 100)).flat();
  test('3 noises in a window: prints 3, warn stays off', () => {
    const t = run('sense-noise-counter', [{ tMs: 0, pin: 'noise', level: 0 }, ...claps(3)], 10500);
    assert.equal(rises(t, 'blip').length, 3);
    assert.equal(lines(t)[0], '3');
    assert.equal(levelAt(t, 'warn', 10500), 0);
  });
  test('6 noises in a window: prints 6, warn lights', () => {
    const t = run('sense-noise-counter', [{ tMs: 0, pin: 'noise', level: 0 }, ...claps(6)], 10500);
    assert.equal(lines(t)[0], '6');
    assert.equal(levelAt(t, 'warn', 10500), 1);
  });
  test('one noise held for 2 s counts once', () => {
    const t = run('sense-noise-counter', [{ tMs: 0, pin: 'noise', level: 0 }, ...pulse('noise', 1000, 2000)], 10500);
    assert.equal(lines(t)[0], '1');
  });
});

describe('sense-noise-light', () => {
  test('silence green, 2.5 V yellow, 4.0 V red (10-bit)', () => {
    const t = run('sense-noise-light', volts('mic', [0, 0], [1000, 2.5], [2000, 4.0]), 3000);
    const lit = (ms) => ['green', 'yellow', 'red'].filter((p) => levelAt(t, p, ms) === 1);
    assert.deepEqual(lit(900), ['green']);
    assert.deepEqual(lit(1900), ['yellow']);
    assert.deepEqual(lit(2900), ['red']);
  });
  test('a short peak inside a quiet window still reaches red', () => {
    const t = run('sense-noise-light', volts('mic', [0, 0], [1050, 4.5], [1080, 0]), 1500);
    assert.ok(t.events.some((e) => e.pin === 'red' && e.level === 1), 'the peak, not the last sample, decides');
  });
});

describe('sense-light-barrier', () => {
  for (const dev of DEVICES) {
    test(`${dev}: calibrates to the room and counts each interruption once`, () => {
      const lit = dev === 'pico' ? 2.6 : 4.0;
      const t = run('sense-light-barrier', volts('ldr',
        [0, lit], [2000, lit * 0.25], [2500, lit], [3000, lit * 0.25], [3800, lit]), 4500, dev);
      assert.equal(rises(t, 'hit').length, 2);
      assert.equal(levelAt(t, 'hit', 2400), 1, 'blocked: hit on');
      assert.equal(levelAt(t, 'hit', 2900), 0, 'clear again: hit off');
      assert.deepEqual(lines(t).slice(1), ['1', '2']);
    });
  }
});

describe('sense-auto-dimmer', () => {
  const finalDuty = (t) => {
    const w = t.pwm.filter((p) => p.pin === 'lamp');
    return w.length ? w[w.length - 1].percent : null;
  };
  for (const dev of DEVICES) {
    test(`${dev}: dark -> nearly full, bright -> nearly off, never outside 0..100`, () => {
      const vref = ADC[dev].vref;
      const dark = run('sense-auto-dimmer', volts('ldr', [0, vref * 0.01]), 2000, dev);
      assert.ok(finalDuty(dark) >= 95, `dark: ${finalDuty(dark)}`);  // MEASURED 2026-10-05: 100 % on 10-bit, 96 % on the pico
      const bright = run('sense-auto-dimmer', volts('ldr', [0, vref * 0.01], [1500, vref * 0.99]), 4000, dev);
      assert.ok(finalDuty(bright) <= 5, `bright: ${finalDuty(bright)}`);  // MEASURED 2026-10-05: 1 % on 10-bit, 0 % on the pico
      for (const p of bright.pwm) assert.ok(p.percent >= 0 && p.percent <= 100, `duty ${p.percent} at ${p.tMs}`);  // MEASURED 2026-10-05: observed range 0..100 (pico) and 1..100 (10-bit)
    });
  }
  test('the lamp glides: no step larger than 5 %', () => {
    const t = run('sense-auto-dimmer', volts('ldr', [0, 0.05], [1500, 4.95]), 4000);
    const w = t.pwm.filter((p) => p.pin === 'lamp');
    for (let i = 1; i < w.length; i++) assert.ok(Math.abs(w[i].percent - w[i - 1].percent) <= 5);  // MEASURED 2026-10-05: largest step observed 5, the program's own rate limit
  });
});

describe('sense-twilight-switch', () => {
  test('dusk on, dawn off, the middle band holds, a short dip is ignored', () => {
    const t = run('sense-twilight-switch', volts('ldr',
      [0, 4.0], [500, 0.5], [800, 4.0],              // 0.3 s dip: ignored
      [1500, 0.5], [3000, 2.0], [4000, 4.0]), 5500);
    assert.equal(levelAt(t, 'lamp', 1400), 0, 'the short dip did not switch');
    assert.equal(levelAt(t, 'lamp', 2600), 1, 'dark for 0.8 s: on');
    assert.equal(levelAt(t, 'lamp', 3900), 1, 'middle band: holds');
    assert.equal(levelAt(t, 'lamp', 5400), 0, 'bright for 0.8 s: off');
    assert.deepEqual(lines(t), ['dusk: lamp on', 'dawn: lamp off']);
  });
});

describe('morse-buzzer-message', () => {
  test('HELLO is 16 symbols, dots 150 ms and dashes 450 ms, 8.4 s per pass', () => {
    const t = run('morse-buzzer-message', [], 9000);
    const on = t.events.filter((e) => e.pin === 'buzzer');
    const marks = [];
    for (let i = 0; i + 1 < on.length; i++) {
      if (on[i].level === 1 && on[i + 1].level === 0 && on[i].tMs < 8400) marks.push(on[i + 1].tMs - on[i].tMs);
    }
    assert.equal(marks.length, 16);
    assert.deepEqual(marks.map((d) => (d === 150 ? '.' : d === 450 ? '-' : '?')).join(''),
      '....' + '.' + '.-..' + '.-..' + '---');
    assert.equal(rises(t, 'buzzer', 8400, 8401).length, 1, 'the second pass starts at 8.4 s');
    assert.deepEqual(rises(t, 'lamp', 0, 8400).length, 16, 'the lamp shows every symbol too');
  });
});

describe('binary-counter-buttons', () => {
  for (const dev of DEVICES) {
    test(`${dev}: up five times shows 5 (b2+b0); down from 0 wraps to 31`, () => {
      const ups = [0, 1, 2, 3, 4].flatMap((i) => press('up', 200 + i * 300));
      const t = run('binary-counter-buttons', [...idle('up', 'down'), ...ups], 2000, dev);
      assert.deepEqual(lines(t), ['1', '2', '3', '4', '5']);
      assert.deepEqual(['b4', 'b3', 'b2', 'b1', 'b0'].map((p) => levelAt(t, p, 2000)), [0, 0, 1, 0, 1]);
      const w = run('binary-counter-buttons', [...idle('up', 'down'), ...press('down', 200)], 800, dev);
      assert.deepEqual(lines(w), ['31']);
      assert.deepEqual(['b4', 'b3', 'b2', 'b1', 'b0'].map((p) => levelAt(w, p, 800)), [1, 1, 1, 1, 1]);
    });
  }
});

describe('dice-pips', () => {
  const PATTERN = {
    1: ['mid'], 2: ['tl', 'br'], 3: ['tl', 'mid', 'br'], 4: ['tl', 'tr', 'bl', 'br'],
    5: ['tl', 'tr', 'mid', 'bl', 'br'], 6: ['tl', 'tr', 'ml', 'mr', 'bl', 'br'],
  };
  const PIPS = ['tl', 'tr', 'ml', 'mid', 'mr', 'bl', 'br'];
  test('the face left lit is the face printed, and all six faces occur', () => {
    const seen = new Set();
    for (let hold = 20; hold < 140; hold += 3) {
      const t = run('dice-pips', [...idle('btn'), ...press('btn', 100, hold)], 100 + hold + 2500);
      const face = Number(lines(t).at(-1));
      assert.ok(face >= 1 && face <= 6, `face ${face}`);  // MEASURED 2026-10-05: 40 holds gave faces 1-5 seven times each, 6 five times
      const lit = PIPS.filter((p) => levelAt(t, p, 100 + hold + 2500) === 1);
      assert.deepEqual(lit.sort(), [...PATTERN[face]].sort(), `hold ${hold} ms, face ${face}`);
      seen.add(face);
    }
    assert.equal(seen.size, 6, `faces seen: ${[...seen].sort()}`);
  });
  test('the roll slows down: ten faces, the last shown 1.53 s after release', () => {
    // Faces are shown at release + 0, 50, 130, 240, ... : the running sum of
    // the first nine pauses (50 + 80 + ... + 290 = 1530 ms); the tenth pause
    // (320 ms) comes after the last face, making 1.85 s in all.
    const t = run('dice-pips', [...idle('btn'), ...press('btn', 100, 50)], 2500);
    const shown = [...new Set(t.events.filter((e) => PIPS.includes(e.pin) && e.tMs >= 150).map((e) => e.tMs))];
    assert.equal(shown.at(-1) - 150, 1530, `last face at ${shown.at(-1)}`);
    const gaps = shown.slice(1).map((v, i) => v - shown[i]);
    for (let i = 1; i < gaps.length; i++) assert.ok(gaps[i] > gaps[i - 1], `the roll slows: ${gaps}`);
  });
});

describe('reaction-duel', () => {
  for (const dev of DEVICES) {
    test(`${dev}: go comes after 2-5 s; first to press wins; time is printed`, () => {
      const probe = run('reaction-duel', idle('keyA', 'keyB'), 6000, dev);
      const go = rises(probe, 'go')[0];
      assert.ok(go && go.tMs >= 2000 && go.tMs <= 5000, `go at ${go?.tMs}`);  // MEASURED 2026-10-05: go at 2920 ms on all three boards (seed 7 -> 77)
      const t = run('reaction-duel', [...idle('keyA', 'keyB'), ...press('keyB', go.tMs + 300, 200)], go.tMs + 3000, dev);
      assert.ok(rises(t, 'ledb').length >= 1 && rises(t, 'leda').length === 0, 'B wins');  // MEASURED 2026-10-05: 5 flashes observed
      const ms = Number(lines(t)[0]);
      assert.ok(Math.abs(ms - 300) <= 20, `reaction ${ms} ms`);  // MEASURED 2026-10-05: printed 300 on all three boards
    });
  }
  test('a false start hands the round to the other player', () => {
    const t = run('reaction-duel', [...idle('keyA', 'keyB'), ...press('keyA', 800, 100)], 3000);
    assert.equal(lines(t)[0], 'false start A');
    assert.equal(rises(t, 'ledb').length, 5);
    assert.equal(rises(t, 'go').length, 0, 'go never lit in a fouled round');
  });
});

describe('two-toggle-keys', () => {
  for (const dev of DEVICES) {
    test(`${dev}: each key toggles only its own lamp, even while the other is held`, () => {
      const t = run('two-toggle-keys', [
        ...idle('keyA', 'keyB'),
        ...press('keyA', 200, 2000),                  // hold A
        ...press('keyB', 500, 100), ...press('keyB', 900, 100),
      ], 2600, dev);
      assert.equal(t.events.filter((e) => e.pin === 'leda').length, 1, 'A toggled once for one press');
      assert.equal(t.events.filter((e) => e.pin === 'ledb').length, 2, 'B toggled twice while A was held');
      assert.equal(levelAt(t, 'leda', 2600), 1);
      assert.equal(levelAt(t, 'ledb', 2600), 0);
    });
  }
});

describe('idea-generator', () => {
  const LISTS = [['build', 'paint', 'program', 'invent'],
    ['a tiny', 'a blinking', 'a noisy', 'a secret'], ['robot', 'alarm', 'game', 'lamp']];
  test('each press prints one word from each list, and the moment of the press matters', () => {
    const ideas = new Set();
    for (const at of [300, 517, 801, 1234, 1999]) {
      const t = run('idea-generator', [...idle('next'), ...press('next', at, 150)], at + 400);
      const out = lines(t);
      assert.equal(out[0], 'press the key for an idea');
      const idea = out.slice(1);
      assert.equal(idea.length, 3);
      idea.forEach((w, i) => assert.ok(LISTS[i].includes(w), `"${w}" from list ${i + 1}`));
      assert.equal(levelAt(t, 'lamp', at + 100), 1, 'lamp on while pressed');
      assert.equal(levelAt(t, 'lamp', at + 400), 0, 'off after release');
      ideas.add(idea.join(' '));
    }
    assert.ok(ideas.size >= 3, `5 presses gave only ${ideas.size} different ideas`);  // MEASURED 2026-10-05: 5 presses gave 5 different ideas
  });
});
