# lab-draught-alarm — expected behaviour

## Circuit
- 9 V supply. A silicon PTC sensor (`ptc_sensor_3`; params r25 2000, rth 1000, thermalTau 1) in series with 330 Ω: a few milliamps flow, so the sensor heats itself. The 330 Ω end is the bridge signal on the LM386's + input.
- Reference: 6.8 kΩ, a 200 Ω pot (`potentiometer_7`, at 0.73) and 820 Ω; the wiper is the − input of the LM386 (`lm386_9`, gain 200). 100 kΩ from the output to the + input adds a little hysteresis.
- Blinker: the LM386 output powers a two-transistor astable (`npn_14`, `npn_15`; 10 µF, 47 kΩ) with a red LED in each collector (1 kΩ each).

## Observable behaviour
- Power-on: the cold sensor reads as a draught and the LEDs blink for a few seconds until it has warmed up.
- Still air: the sensor sits about 25 °C above the room, no alarm.
- Airflow 2 m/s: it cools by about 14 K, its resistance falls, the bridge tips and the LEDs blink alternately.
- Air still again: it warms up and the alarm stops.

## Measured on the engine
bw-board d4113b4b / bw-circuit-ui 0b594d6, `test/lab-circuits-r6i.test.mjs`.

| condition | sensor | + input | − input | output |
|---|---|---|---|---|
| still air, after 4 s | 50.6 °C | 1.070 V | 1.093 V | low |
| 2 m/s, after 2 s more | 36.6 °C | — | 1.093 V | high, 5 LED changes in 1.5 s |
| still again, after 2.5 s | — | — | 1.093 V | low |

## What this verifies
1. The sensor's own dissipation (about 25 mW) through its thermal resistance sets its temperature; moving air lowers the effective thermal resistance, so it cools.
2. The PTC's resistance follows its temperature; the bridge and the LM386 at gain 200 turn a change of about a tenth of a volt into an on/off decision.
3. The LM386 output can power a transistor blinker directly.

## Simulation notes
The thermal time constant is shortened to 1 s (`thermalTau`) so a scenario lasts seconds, not minutes. The assert block reads the power-on instant, when the sensor is still at 25 °C.

```assert
# t = 1 ms, sensor still at room temperature
net lm386_9.inp V 1.286 +-0.02
net lm386_9.inn V 1.093 +-0.02
net lm386_9.vout V 8.10 +-0.1
```

<!-- engine-provenance -->
> **Engine provenance.** The measured numbers on this page were last held against
> `bw-board@b47e7e0` and `bw-circuit-ui@ee2b412` — the revisions pinned in
> `test/fixtures/siblings.json`. `test/expected-quantities-hold.test.mjs` compares
> **15 of this page's 24** numeric claims against that engine
> (0 of them disagreeing) and declines the rest with a stated reason;
> `node scripts/expected-claim-census.mjs lab-draught-alarm` prints them one by one.
<!-- engine-provenance -->
