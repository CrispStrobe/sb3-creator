# lab-touch-darlington — expected behaviour

## Circuit
A 9 V supply feeds one push button that stands for two touch plates. Behind the
button, two 2.2 MΩ resistors play the part of a fingertip bridging the plates,
one for each channel:

- **Single stage:** finger A → base of q1. q1 switches the red LED through 1 kΩ.
- **Darlington:** finger B → base of q2; q2's emitter drives the base of q3,
  both collectors are joined and switch the green LED through 1 kΩ.

The two channels see the same finger resistance; the only difference is the
second transistor.

## Expected behaviour
- Not touched: no base current, both transistors off, both LEDs dark. The two
  collectors sit near the top rail.
- Touch button pressed: about 3.7 µA reaches each first base. q1 alone turns that
  into roughly a third of a milliamp — the red LED barely glimmers. The pair
  multiplies it twice: q3 saturates and the green LED is fully lit.
- The Darlington's collector cannot fall as low as a single saturated
  transistor: it stays about one base-emitter drop above ground, because q2
  has to keep q3's base forward-biased.

## Measured on the engine
Solved on the headless engine (`test/lab-circuits-1.test.mjs` re-runs these
states):

| state | red LED (single) | green LED (Darlington) | Darlington collector |
|---|---|---|---|
| not touched | 0.000 mA | 0.000 mA | 8.11 V |
| touch button pressed | 0.378 mA | 6.37 mA | 0.764 V |

## What this verifies
1. Gain multiplies: the same 3.7 µA gives about seventeen times more LED current through two stages than through one.
2. The pair's on-state drop (about 0.76 V) is larger than a single transistor's.
3. A megohm-range "finger" is enough to switch a load when the gain is high enough.

```assert
# untouched: both channels off, collectors pulled up through the LEDs
net q3.collector V 8.11 +-0.05
net q1.collector V 8.11 +-0.05
net q2.base V 0.00 +-0.05
```

<!-- engine-provenance -->
> **Engine provenance.** The measured numbers on this page were last held against
> `bw-board@e339fcb` and `bw-circuit-ui@b1103f9` — the revisions pinned in
> `test/fixtures/siblings.json`. `test/expected-quantities-hold.test.mjs` compares
> **13 of this page's 13** numeric claims against that engine
> (0 of them disagreeing) and declines the rest with a stated reason;
> `node scripts/expected-claim-census.mjs lab-touch-darlington` prints them one by one.
<!-- engine-provenance -->
