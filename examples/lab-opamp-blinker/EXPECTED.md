# lab-opamp-blinker — expected behaviour

## Circuit
One half of an LM358 on 9 V, turned into an oscillator.

- **Hysteresis (positive feedback):** three 100 kΩ resistors meet at the non-inverting input: one from +9 V, one from ground, one (R_fb) from the output.
- **Timing (negative feedback):** the output charges and discharges C_t = 10 µF through R_min = 22 kΩ plus the RATE pot (100 kΩ, wired as a variable resistor). The capacitor voltage is the inverting input.
- **Display:** a red LED with 1 kΩ from the output to ground (lit when the output is high) and a green LED with 1 kΩ from +9 V to the output (lit when the output is low).

The second half of the LM358 is parked as a grounded follower.

## Observable behaviour
- **The LEDs alternate:** red and green take turns, never both on.
- **The output is a square wave** between about 0.36 V and 7.2 V. The LM358 cannot reach its supply rails, especially not the top one.
- **The capacitor ramps between two thresholds.** With the output high the non-inverting input sits at (9 + 7.22) / 3 = 5.41 V, with it low at (9 + 0.36) / 3 = 3.12 V. The capacitor voltage rises to the upper value, the output flips, and it falls back to the lower one.
- **Rate:** the period is about 1.42 × R_t × C_t, where R_t = R_min + the RATE setting.

| RATE position | R_t | blink rate |
|---|---|---|
| 0 % | 22 kΩ | 3.2 Hz |
| 25 % (start) | 47 kΩ | 1.5 Hz |
| 100 % | 122 kΩ | 0.58 Hz |

- **Not quite 50/50:** the red (high) phase is a little longer than the green one, about 57 % of the period, because the thresholds are not centred between the two output levels.

## What this verifies
1. A comparator with hysteresis plus an RC network is an oscillator.
2. The period is set by R_t × C_t; the ratio of the three hysteresis resistors sets the factor in front.

```assert
# t = 1 ms: capacitor still empty, output high
net u1.1_out V 7.22 +-0.10
net u1.1_pos V 5.41 +-0.05
```
