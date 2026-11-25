# lab-chopper-tacho — expected behaviour

## Circuit
- 9 V supply for the electronics. A small solar panel (`solar_cell_3`) drives a small motor (`dc_motor_4`, light viscous load) on its own.
- A red LED (`led_6`, 470 Ω from +9 V) shines into a 0.5 m light guide (`light_path_20`) whose exit faces a phototransistor (`phototransistor_7`, 1 kΩ emitter load) across a 2 mm gap. A disc with 4 slots on the motor's shaft runs through the gap (`chopper`: half of each pitch open, the beam 0.3 of a pitch wide).
- The emitter pulses go through 100 nF and 100 kΩ into an LM386 (`lm386_11`, gain 20) that drives an 8 Ω speaker through 220 µF.
- From the LM386 output, 100 nF and two diodes pump one charge per pulse into 47 kΩ || 1 µF, read by an analog meter (`analog_meter_19`, 5 V full scale).

## Observable behaviour
- Full light: the speaker buzzes at four clicks per turn of the motor; the meter shows the rate.
- Less light: the motor slows, the buzz drops and the meter reads lower.

## Measured on the engine
bw-board r9/engine-robust-20261125 / bw-circuit-ui e3441d2, `test/lab-circuits-r9.test.mjs` (150 ms from power-on).

| panel light | motor speed | 4 × revolutions | speaker pitch | meter |
|---|---|---|---|---|
| 1 | 226 rad/s | 144 Hz | 144 Hz | 1.72 V |
| 0.1 | 84 rad/s | 53 Hz | 46 Hz (still rising) | lower |

## What this verifies
1. A slotted disc on the motor's shaft turns its speed into a pulse rate of slots × revolutions.
2. A diode pump turns a pulse rate into a voltage.

```assert
# t = 1 ms
net resistor_5.a V 9.0 +-0.01
net led_6.anode V 1.84 +-0.05
```

<!-- engine-provenance -->
> **Engine provenance.** The measured numbers on this page were last held against
> `bw-board@9de91e3` and `bw-circuit-ui@3084f35` — the revisions pinned in
> `test/fixtures/siblings.json`. `test/expected-quantities-hold.test.mjs` compares
> **13 of this page's 18** numeric claims against that engine
> (0 of them disagreeing) and declines the rest with a stated reason;
> `node scripts/expected-claim-census.mjs lab-chopper-tacho` prints them one by one.
<!-- engine-provenance -->
