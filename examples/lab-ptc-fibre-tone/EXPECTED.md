# lab-ptc-fibre-tone — expected behaviour

## Circuit
- 9 V supply. 22 kΩ from +9 V over a PTC sensor (`ptc_sensor_4`, silicon, thermal time constant 50 ms) into the + input of an LM386 (`lm386_7`, gain 20; its own input resistance loads the divider). The − input sits on a set pot (`potentiometer_5`, 10 kΩ at 0.84 under 82 kΩ from +9 V).
- The LM386 output drives a red LED (`led_9`) through 1 kΩ: its brightness follows the temperature.
- A 2 m light guide (`light_path_21`, 1 mm exit gap) to a phototransistor (`phototransistor_10`) whose emitter load is 2.2 kΩ. That emitter voltage feeds both 47 kΩ base resistors of a two-transistor astable (4.7 kΩ collectors, 10 nF) with a piezo on its second collector.

## Observable behaviour
- 25 °C: a tone near 540 Hz.
- 45 °C: the LM386 output rises by about 2 V, the LED is brighter and the tone rises to about 720 Hz.

## Measured on the engine
bw-board r9/engine-robust-20261125 / bw-circuit-ui e3441d2, `test/lab-circuits-r9.test.mjs` (30 ms settled, pitch over 15 ms).

| surroundings | LM386 output | pitch |
|---|---|---|
| 25 °C | 5.07 V | 538 Hz |
| 45 °C | 7.15 V | 725 Hz |

## What this verifies
1. An amplifier turns a small resistance change into a light intensity.
2. Light at the far end sets the charging current of an astable: the pitch carries the temperature.

```assert
# t = 1 ms, 25 C
net ptc_sensor_4.a V 0.724 +-0.01
net potentiometer_5.wiper V 0.713 +-0.01
net lm386_7.vout V 5.07 +-0.1
```

<!-- engine-provenance -->
> **Engine provenance.** The measured numbers on this page were last held against
> `bw-board@e744ede` and `bw-circuit-ui@3084f35` — the revisions pinned in
> `test/fixtures/siblings.json`. `test/expected-quantities-hold.test.mjs` compares
> **14 of this page's 25** numeric claims against that engine
> (0 of them disagreeing) and declines the rest with a stated reason;
> `node scripts/expected-claim-census.mjs lab-ptc-fibre-tone` prints them one by one.
<!-- engine-provenance -->
