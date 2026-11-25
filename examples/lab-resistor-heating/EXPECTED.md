# lab-resistor-heating — expected behaviour

## Circuit
- 9 V supply. The **VOLTS** pot (10 kΩ, with 3.3 kΩ above it) sets the + input of an LM324 op-amp anywhere from 0 to about three quarters of the supply; an NPN emitter follower (1 kΩ into its base, collector on +9 V) sits inside the feedback loop, so the emitter follows the pot and can deliver well over 100 mA.
- An ammeter, then the **SELECT** slide switch: a 47 Ω or a 100 Ω quarter-watt resistor to ground. A voltmeter reads the voltage across it.
- Each resistor has a thermometer glued to it: an NPN wired as a diode (base and collector together, 10 kΩ from +9 V) whose base-emitter voltage falls by about two millivolts per kelvin. Two more op-amps compare those voltages with a fixed reference (100 kΩ / 7 kΩ from +9 V), the junction voltage near 75 °C, and light that resistor's red **HOT** LED (1 kΩ).
- Each resistor warms by 200 K per watt with a time constant of 1 s (the engine's thermal model); 75 °C is what a quarter watt does to it.

## Observable behaviour
- As authored (VOLTS at half, 47 Ω): 3.38 V, 71.8 mA, 0.24 W; the resistor settles near 73 °C, HOT stays dark.
- Turned up a little more, the same voltage heats the 47 Ω past its limit and leaves the 100 Ω well inside it:

| SELECT | voltmeter (V) | ammeter (mA) | P (W) | resistor after 3.5 s (°C) | HOT |
|---|---|---|---|---|---|
| 47 Ω | 3.99 | 84.8 | 0.338 | 90.5 | lit |
| 100 Ω | 3.99 | 39.9 | 0.159 | 55.9 | dark |

## Measured on the engine
`test/lab-circuits-r6e.test.mjs` holds the authored reading and the table above (VOLTS at 0.59, 3.5 s of simulated time per row, temperatures within 3 °C).

## What this verifies
1. A resistor turns electrical power P = V·I into heat, and its temperature rise follows the power, not the voltage.
2. Drawn on an I–V chart, the quarter-watt limit is the hyperbola I = 0.25 W / V; each resistor's straight line I = V/R crosses it at its own voltage, √(P·R): 3.4 V for 47 Ω, 5 V for 100 Ω.
3. A silicon junction is a thermometer: its voltage falls by about two millivolts per kelvin.

## Simulation notes
The resistors' values do not change with temperature (no TCR in the model). The thermometer transistors take their surroundings from the resistor they are glued to (coupling 1).

```assert
# as authored: VOLTS at half, 47 Ω selected, everything still at 25 °C
net potentiometer_4.wiper V 3.38 +-0.02
net voltmeter_12.a V 3.38 +-0.02
net npn_13.base V 0.678 +-0.005
net resistor_17.b V 0.589 +-0.005
```

<!-- engine-provenance -->
> **Engine provenance.** The measured numbers on this page were last held against
> `bw-board@2965782` and `bw-circuit-ui@e3441d2` — the revisions pinned in
> `test/fixtures/siblings.json`. `test/expected-quantities-hold.test.mjs` compares
> **20 of this page's 42** numeric claims against that engine
> (0 of them disagreeing) and declines the rest with a stated reason;
> `node scripts/expected-claim-census.mjs lab-resistor-heating` prints them one by one.
<!-- engine-provenance -->
