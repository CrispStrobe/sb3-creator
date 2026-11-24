# lab-depletion-touch — expected behaviour

## Circuit
- 9 V supply. A depletion-mode dual-gate MOSFET (`dual_gate_mosfet_5`, pinch-off −1.2 V): drain to the supply through a red LED and 1 kΩ (`resistor_3`), source to ground, gate 2 tied to the source.
- Gate 1 is bare. The button (`button_6`) connects it to the source (a finger bridging the two). The field probe (`field_probe_7`) is a charged fingertip at −50 V; its knob brings it towards gate 1, up to 1 pF.

## Observable behaviour
- Rest, gates at the source potential: the channel conducts, the LED carries 3.73 mA. Nothing has to switch it on: depletion mode.
- Charge brought close: gate 1 goes to about −4.2 V, below pinch-off; the LED goes out.
- Charge taken away again: gate 1 returns near the source potential and the LED lights (about 4 mA).
- Charge close, gate touched to the source, then the charge taken away: gate 1 is left holding the opposite charge, about +4.5 V, and the LED is brighter than at rest (about 6.1 mA).

## Measured on the engine
bw-board f4aaec43, `test/lab-circuits-r7a.test.mjs` (the knob moves the charge over 0.2 s; readings 400 ms after each move).

## What this verifies
1. A depletion MOSFET conducts with zero gate voltage and needs a negative gate to switch off.
2. An insulated gate is moved by induced charge alone, and keeps charge it is given.

## Simulation notes
The probe couples the charge through a capacitance that grows with the knob; the gate's own leakage is the solver's floor (about 1 TΩ), so a gate held at a few volts keeps its charge for seconds.

```assert
# power-on, charge far away: the channel conducts
net vsource_2.pos V 9.00 +-0.01
net dual_gate_mosfet_5.gate1 V 0.00 +-0.01
net dual_gate_mosfet_5.drain V 3.61 +-0.05
net resistor_3.b V 5.27 +-0.05
```
