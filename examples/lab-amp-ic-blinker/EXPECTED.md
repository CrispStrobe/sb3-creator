# lab-amp-ic-blinker — expected behaviour

## Circuit
- 9 V battery, one LM386 power amplifier across the breadboard gutter. Pins 1 and 8 open (gain 20), pin 7 open, −IN (pin 2) grounded.
- Feedback: the output (pin 5) drives +IN (pin 3) through an electrolytic capacitor, + on the output side. A slide switch picks 10 µF (as authored) or 4.7 µF.
- 10 kΩ from +IN to ground, in parallel with the chip's own input resistance.
- Red LED: output → 1 kΩ → red LED → ground. Green LED: battery + → 1 kΩ → green LED → output.

## Observable behaviour
- The two LEDs blink in turn: red while the output is high (8.1 V), green while it is low (0.9 V).
- With 10 µF about 1.6 blinks per second (each LED about 0.3 s on); with 4.7 µF about twice as fast.
- At switch-on the output starts high: red first.

## Why it blinks
Each time the output jumps, the capacitor passes the whole jump to +IN, and the amplifier, multiplying the difference between its inputs by 20, is driven hard to that side. The capacitor then charges through the resistance at +IN (10 kΩ in parallel with the chip's fifty kilohms, about 8.3 kilohms) and +IN creeps back towards 0 V. Once it is within about 0.2 V of −IN the output can no longer stay at its limit; it starts to move and the capacitor carries that movement to +IN, so the output snaps over to the other side. Each half-period is about 3.7 of those R·C time constants (the natural log of the jump over the last fifth of a volt).

## Measured on the engine
| capacitor | output edges (ms) | half-period | blink rate |
|---|---|---|---|
| 10 µF | 318, 624, 928, 1234 | 305 ms | 1.6 Hz |
| 4.7 µF | 150, 294, 438, 580, 724 | 144 ms | 3.5 Hz |

## What this verifies
1. A power amplifier with positive feedback through a capacitor becomes a relaxation oscillator (a blinker).
2. The blink rate follows the capacitor (and the resistance at the input).
3. One output drives two LEDs alternately: one to ground, one from the battery.

## Simulation notes
The capacitor never sees reverse voltage: across it is the output minus +IN, between 1.1 V and 7.9 V. `test/lab-circuits-r6b.test.mjs` times the output's edges at both switch positions. Each LM386 edge costs the engine real time, so the test watches the first four edges only.

```assert
# t = 1 ms: the first half-period, output high, +IN kicked up with it.
net lm386_3.inp V 8.002 +-0.05
net led_11.cathode V 8.098 +-0.03
net led_9.anode V 1.711 +-0.05
```

<!-- engine-provenance -->
> **Engine provenance.** The measured numbers on this page were last held against
> `bw-board@b47e7e0` and `bw-circuit-ui@ee2b412` — the revisions pinned in
> `test/fixtures/siblings.json`. `test/expected-quantities-hold.test.mjs` compares
> **10 of this page's 22** numeric claims against that engine
> (0 of them disagreeing) and declines the rest with a stated reason;
> `node scripts/expected-claim-census.mjs lab-amp-ic-blinker` prints them one by one.
<!-- engine-provenance -->
