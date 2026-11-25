# lab-ptc-fibre-alarm — expected behaviour

## Circuit
- 9 V supply. Transmitter: a divider of 20 kΩ and the silicon PTC sensor (`ptc_sensor_4`, r25 = 2000, i.e. two kilohms at 25 °C) on the + input of an LM386 (`lm386_7`, pins 1 and 8 joined, gain 200); the limit comes from 8.2 kΩ and a 1 kΩ set potentiometer (`potentiometer_6`) on the − input. Above the limit the output goes high and lights the red transmitter LED (`led_9`, 470 Ω).
- A light guide (`light_path_26`, fibre, 2 m, shielded) carries the light to a phototransistor (`phototransistor_10`, 10 kΩ on its emitter).
- Receiver: through 10 kΩ an NPN (`npn_13`) switches a PNP (`pnp_16`, 10 kΩ / 10 kΩ on its base) that powers a two-transistor tone astable (`npn_19`, `npn_20`; 1 kΩ, 100 nF, 22 kΩ) with a piezo on one collector.
- The sensor sits in its own surroundings (Temperature slider, 25 °C as built).

## Observable behaviour
- Below the limit (about 36 °C as set): the LED is dark and the far end silent.
- Above it: the LED lights, the receiver's PNP switches on and the piezo sounds.

## Measured on the engine
bw-board f4aaec43 / bw-circuit-ui 141b2cc, `test/lab-circuits-r6f.test.mjs`.

| surroundings | transmitter LED | tone supply | piezo |
|---|---|---|---|
| 25 °C | dark | 0 V | silent |
| 45 °C | lit | 8.9 V | sounding |

## What this verifies
1. A comparator turns a slowly changing temperature into an on/off decision.
2. A light guide carries that decision without any electrical connection between the two ends.

```assert
# t = 1 ms, 25 C: sensor divider and limit (each loaded by the LM386's 50 kOhm inputs)
net ptc_sensor_4.a V 0.790 +-0.01
net potentiometer_6.wiper V 0.860 +-0.02
```

<!-- engine-provenance -->
> **Engine provenance.** The measured numbers on this page were last held against
> `bw-board@b094eb2` and `bw-circuit-ui@0b594d6` — the revisions pinned in
> `test/fixtures/siblings.json`. `test/expected-quantities-hold.test.mjs` compares
> **14 of this page's 19** numeric claims against that engine
> (0 of them disagreeing) and declines the rest with a stated reason;
> `node scripts/expected-claim-census.mjs lab-ptc-fibre-alarm` prints them one by one.
<!-- engine-provenance -->
