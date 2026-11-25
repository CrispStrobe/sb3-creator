# lab-npn-shunt-pair — expected behaviour

## Circuit
9 V, two independent shunts.
- Left: 470 Ω (`resistor_7`) from +9 V to a node with two paths to ground: a 1N4148 (`diode_8`) + green LED (`led_9`), and a red LED (`led_10`) + NPN (`npn_6`). The NPN's base gets current only through **ON** (`button_3`) and 10 kΩ (`resistor_4`); 100 kΩ (`resistor_5`) holds it low otherwise.
- Right: the same (470 Ω `resistor_14`, `diode_15` + green `led_16`, red `led_17` + `npn_13`), but the base is fed all the time through 10 kΩ (`resistor_12`) and **OFF** (`button_11`) shorts it to ground.

## Observable behaviour
- The green path needs about 2.8 V (diode + green LED), the red one about 2 V (red LED + saturated transistor), so whichever path is open with the lower voltage takes the current.
- Left idle: green about 13.2 mA, red dark. ON held: red about 15.1 mA, green dark.
- Right idle: red about 15.1 mA, green dark. OFF held: green about 13.2 mA, red dark.

## Measured on the engine
bw-board f4aaec43, `test/lab-circuits-r6a.test.mjs`: green 13.15 mA, red 15.06 mA; the dark LED of each pair carries at most 0.003 mA.

## What this verifies
1. Current takes the path of lowest voltage; a conducting transistor opens a lower path and moves the current there.
2. The same shunt works both ways: base driven by a button (normally off), or base fed and the button taking the drive away (normally on).

## Simulation notes
Without the diode in front of the green LED the two paths differ by only about 0.2 V and the "dark" green LED kept about 1.6 mA (measured while building); the diode makes the hand-over clean.

```assert
# t = 1 ms, nothing pressed: left green lit, right red lit
net led_9.anode V 2.11 +-0.05
net led_17.cathode V 0.08 +-0.03
net led_16.anode V 1.60 +-0.1
```

<!-- engine-provenance -->
> **Engine provenance.** The measured numbers on this page were last held against
> `bw-board@2965782` and `bw-circuit-ui@e3441d2` — the revisions pinned in
> `test/fixtures/siblings.json`. `test/expected-quantities-hold.test.mjs` compares
> **13 of this page's 18** numeric claims against that engine
> (0 of them disagreeing) and declines the rest with a stated reason;
> `node scripts/expected-claim-census.mjs lab-npn-shunt-pair` prints them one by one.
<!-- engine-provenance -->
