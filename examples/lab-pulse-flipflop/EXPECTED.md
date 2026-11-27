# lab-pulse-flipflop — expected behaviour

## Circuit
- 9 V supply. A 100 µF electrolytic (`polarized_cap_4`) is kept charged through 1 kΩ. Button `button_5` ("pulse") connects it through 2.2 Ω to the 10 mH winding of a transformer (`transformer_7`, 10 mH / 40 mH, k = 0.9).
- The 40 mH winding's other end is grounded; its pulse goes through a diode and 10 kΩ into Q1's base (`npn_12`). Q1 and Q2 (`npn_13`) are cross-coupled through 22 kΩ; Q1's base has 100 kΩ ‖ 1 µF to ground. Red LED in Q1's collector, green in Q2's, each with 1 kΩ.
- Button `button_20` (reset) grounds Q1's base.

## Observable behaviour
- Rest: Q2 conducts (collector 0.09 V), green on; Q1's collector at 7.2 V, red off.
- Press "pulse": a pulse of about five volts in the large winding; Q1 switches on (collector 0.09 V), red on, green off, and it stays so after the button is released.
- Reset: green again. By then the 100 µF has recharged (about 0.5 s).

## Measured on the engine
bw-board f4aaec43, `test/lab-circuits-r7a.test.mjs`, which also reads the pulse's peak at `transformer_7.s1`.

## What this verifies
1. A changing current in one winding induces a pulse in the other, with no connection between them.
2. A cross-coupled pair keeps the state it was set to.

## Simulation notes
The transformer is two coupled inductors without winding resistance (the 2.2 Ω stands for it) and without core saturation.

```assert
# power-on: green on (Q2 conducting), red off
net vsource_2.pos V 9.00 +-0.01
net npn_13.collector V 0.09 +-0.05
net npn_12.collector V 7.20 +-0.1
net npn_12.base V 0.00 +-0.05
```

