# lab-ptc-alarm — expected behaviour

## Circuit
- 9 V supply. A divider of 10 kΩ and the silicon PTC sensor (`ptc_sensor_4`, r25 = 2000, i.e. two kilohms at 25 °C) on the + input of an LM386 (`lm386_7`, pins 1 and 8 joined, gain 200); the threshold from 3.9 kΩ and a 1 kΩ set potentiometer (`potentiometer_6`) on the − input.
- 220 kΩ from the output back to the + input is positive feedback: the LM386 becomes a Schmitt trigger that switches on at one temperature and off at a lower one.
- Its output lights a red LED (`led_9`). A slide switch (`slide_switch_10`) feeds a two-transistor tone astable (`npn_16`, `npn_17`; 1 kΩ, 100 nF, 22 kΩ; piezo on one collector) either through that LED (left: alarm when hot) or from a PNP (`pnp_13`) that conducts while the LM386 output is low (right: alarm when cold).
- The sensor sits in its own surroundings (Temperature slider, 25 °C as built).

## Observable behaviour
- Rising mode: warming up, the alarm switches on at about 35 °C; cooling down again it only switches off at about 32 °C.
- Falling mode: the same two thresholds, the tone the other way round: silent while warm, sounding once it has cooled below the lower threshold.

## Measured on the engine
bw-board f4aaec43 / bw-circuit-ui 141b2cc, `test/lab-circuits-r6f.test.mjs`, stepping the surroundings 1 K every 20 ms (with the sensor's time constant shortened to 5 ms for the scan).

| mode | on | off | hysteresis |
|---|---|---|---|
| rising | 35 °C | 32 °C | 3 K |

## What this verifies
1. Positive feedback makes a comparator snap and gives it two thresholds: once switched, the input has to move back past the other threshold to switch it back. An alarm then does not flicker on and off around one temperature.
2. The same decision can sound an alarm for "too hot" or, inverted by a transistor, for "too cold".

```assert
# t = 1 ms, 25 C: sensor divider and threshold, below the threshold
net ptc_sensor_4.a V 1.45 +-0.03
net vsource_2.pos V 9.00 +-0.01
```

<!-- engine-provenance -->
> **Engine provenance.** The measured numbers on this page were last held against
> `bw-board@b094eb2` and `bw-circuit-ui@0b594d6` — the revisions pinned in
> `test/fixtures/siblings.json`. `test/expected-quantities-hold.test.mjs` compares
> **8 of this page's 16** numeric claims against that engine
> (0 of them disagreeing) and declines the rest with a stated reason;
> `node scripts/expected-claim-census.mjs lab-ptc-alarm` prints them one by one.
<!-- engine-provenance -->
