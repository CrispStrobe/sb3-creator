# lab-motor-throttle — expected behaviour

## Circuit
- 9 V supply. A linear Hall sensor (`hall_analog_3`): its output sits at half the supply without a field and rises as a magnet's north pole approaches (the field slider).
- One half of an LM358 (`lm358_4`) is a difference amplifier with gain 2 (10 kΩ / 20 kΩ) against half the supply (1 kΩ / 1 kΩ): zero without a magnet, rising to about seven volts with the magnet close.
- The other half is a follower after an RC ramp: the run slide switch (`slide_switch_11`) connects 100 kΩ to +9 V (run) or to ground (stop), so 10 µF charges or discharges over about a second.
- The mode slide switch (`slide_switch_14`) gives one of the two voltages to the motor driver, an LM386 (`lm386_17`) fed through 620 kΩ with 2 MΩ biasing its − input, so 0 V in gives its lowest output (0.9 V). It drives a small motor (`dc_motor_encoder_19`, load 0.002 N·m, flyback diode) through a series diode, so a motor that is slowing down is not braked by the amplifier.

## Observable behaviour
- Throttle: no magnet, the motor stands; bring the magnet closer and it runs faster.
- Soft start: closing the run switch, the motor speeds up over about a second; opening it, the drive ramps down and the motor coasts to a stop.

## Measured on the engine
bw-board f4aaec43 / bw-circuit-ui 141b2cc, `test/lab-circuits-r6f.test.mjs`.

| setting | motor |
|---|---|
| no magnet | 0 |
| field 0.3 | 85 rad/s |
| field 0.6 | 241 rad/s |
| field 1 | 312 rad/s |
| soft start, 0.25 s | 24 rad/s |
| soft start, 0.75 s | 226 rad/s |
| soft start, 1.5 s | 312 rad/s |
| stop, 0.5 s later | 274 rad/s |
| stop, 1.5 s later | 55 rad/s |

## What this verifies
1. A linear Hall sensor gives a voltage proportional to the field, so a magnet's distance becomes a contactless throttle.
2. A capacitor charged through a resistor gives a ramp; following it, the drive rises and falls gently instead of jumping, which spares the motor and what it drives.

```assert
# t = 1 ms, no magnet: Hall output at half supply, amplifier near 0
net hall_analog_3.ao V 4.50 +-0.01
net lm386_17.inn V 0.22 +-0.01
```

<!-- engine-provenance -->
> **Engine provenance.** The measured numbers on this page were last held against
> `bw-board@9de91e3` and `bw-circuit-ui@3084f35` — the revisions pinned in
> `test/fixtures/siblings.json`. `test/expected-quantities-hold.test.mjs` compares
> **10 of this page's 17** numeric claims against that engine
> (0 of them disagreeing) and declines the rest with a stated reason;
> `node scripts/expected-claim-census.mjs lab-motor-throttle` prints them one by one.
<!-- engine-provenance -->
