# lab-break-loop-alarm — expected behaviour

## Circuit
A two-transistor bistable on 9 V. Each collector has a 4.7 kΩ pull-up; the red
alarm LED (with 1 kΩ) hangs on q2's collector.

- q1 → q2: q1's collector feeds q2's base through 47 kΩ.
- q2 → q1: q2's collector feeds q1's base through the **door loop** and 47 kΩ.
  A 100 kΩ pull-down holds q1's base low whenever that path is broken.
- The loop (a thin wire across a door) is a slide switch: position 0 = intact,
  position 1 = torn.
- The **arm / reset** button grounds q2's base. A 1 µF capacitor on q2's base
  makes the latch wake up armed: at power-on q2 starts later than q1.

## Expected behaviour
- Power-on with the loop intact: q1 on, q2 off, alarm LED dark.
- Loop torn: q1 loses its base current, its collector rises, q2 turns on and
  the alarm LED lights (about 7.0 mA).
- Loop mended: still alarming. q2's collector is now low, so the mended loop
  carries no current back to q1 — the latch remembers the intrusion.
- Arm button pressed with the loop intact: q2 is forced off, its collector
  rises and, through the loop, turns q1 back on. Quiet again after release.
- Arm button pressed with the loop still open: nothing can hold q1 on, so the
  alarm returns as soon as the button is released.

## Measured on the engine
| step | q1 collector | q2 collector | alarm LED |
|---|---|---|---|
| power-on, loop intact | 0.073 V | 8.24 V | 0.000 mA |

The remaining states depend on what happened before, which a single solve
cannot reproduce. They are driven in order by `test/lab-circuits-1.test.mjs`
(volts and milliamps):

| step | q1 collector, volts | q2 collector, volts | alarm LED, milliamps |
|---|---|---|---|
| loop torn | 8.25 | 0.126 | 7.00 |
| loop mended again | 8.25 | 0.126 | 7.00 |
| arm pressed and released | 0.073 | 8.24 | 0 |

## What this verifies
1. Normally-closed sensing is fail-safe: cutting the wire raises the alarm.
2. The bistable stores the event; only the arm button clears it.
3. Arming is refused while the loop is open.

```assert
# armed at power-on: q1 on, q2 off
net q1.collector V 0.07 +-0.05
net q2.collector V 8.24 +-0.1
```

<!-- engine-provenance -->
> **Engine provenance.** The measured numbers on this page were last held against
> `bw-board@818e026` and `bw-circuit-ui@659431c` — the revisions pinned in
> `test/fixtures/siblings.json`. `test/expected-quantities-hold.test.mjs` compares
> **10 of this page's 11** numeric claims against that engine
> (0 of them disagreeing) and declines the rest with a stated reason;
> `node scripts/expected-claim-census.mjs lab-break-loop-alarm` prints them one by one.
<!-- engine-provenance -->
