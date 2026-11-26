# lab-resistor-heat — expected behaviour

## Circuit
- 9 V battery. A slide switch connects either a 100 Ω resistor (position as authored) or a 1 kΩ resistor straight across the battery.
- Both resistors are in the thermal model: 40 K/W to the air (a larger body, rated 1 W), thermal time constant 2 s.
- A silicon diode is glued to each resistor (`heatedBy`, coupling 0.9, 2 s): each diode is fed 1.8 mA from the battery through 4.7 kΩ, and a voltmeter reads its forward voltage. A diode's forward voltage falls by about two millivolts per kelvin, so each diode is a thermometer.

## Observable behaviour
- The 100 Ω resistor turns 9 V into heat at P = V²/R = 0.81 W. Within a few seconds it is about 30 K above the room, warm to the touch; its diode's voltage falls by about fifty millivolts.
- The 1 kΩ resistor takes a tenth of the current and a tenth of the power (81 mW): it warms by only about 3 K and its diode barely moves.
- Switching over: the hot resistor cools back within seconds and the other one warms a little.

## Measured on the engine
| time | 100 Ω temperature | diode 1 | diode 2 |
|---|---|---|---|
| 1 ms | 25.0 °C | 0.580 V | 0.580 V |
| 1 s | 37.7 °C | 0.575 V | 0.580 V |
| 3 s | 50.1 °C | 0.554 V | 0.580 V |
| 6 s | 55.7 °C | 0.534 V | 0.580 V |

Switch to 1 kΩ at 6 s: three seconds later the 100 Ω is at 31.9 °C (diode 1 at 0.551 V, recovering), the 1 kΩ at 27.5 °C; after six seconds the 1 kΩ settles near 28 °C.

## What this verifies
1. Electrical power in a resistor becomes heat: P = V²/R.
2. At the same voltage the smaller resistance takes more power and gets hotter.
3. A silicon junction's forward voltage reads temperature (minus two millivolts per kelvin).

## Simulation notes
A resistor's value does not change with temperature in the engine (no TCR); it is only the heater. The diodes are plain silicon diodes because the engine's 1N4148 card does not take a part temperature (reported upstream). `test/lab-circuits-r6b.test.mjs` runs both positions and reads the temperatures and the diode voltages.

```assert
# t = 1 ms: the 100 ohm resistor is connected, nothing has warmed yet.
net resistor_4.a V 8.991 +-0.01
net diode_7.anode V 0.580 +-0.01
net diode_10.anode V 0.580 +-0.01
```

<!-- engine-provenance -->
> **Engine provenance.** The measured numbers on this page were last held against
> `bw-board@0f6b38a` and `bw-circuit-ui@42aaddc` — the revisions pinned in
> `test/fixtures/siblings.json`. `test/expected-quantities-hold.test.mjs` compares
> **17 of this page's 39** numeric claims against that engine
> (0 of them disagreeing) and declines the rest with a stated reason;
> `node scripts/expected-claim-census.mjs lab-resistor-heat` prints them one by one.
<!-- engine-provenance -->
