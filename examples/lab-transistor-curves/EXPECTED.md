# lab-transistor-curves — expected behaviour

## Circuit
Base: 9 V through an ammeter, 47 kΩ and a 1 MΩ potentiometer used as a variable resistor (pot at 0.9).
Collector: a separate adjustable source (5 V as loaded) through an ammeter and a 100 Ω limiting resistor.
A voltmeter reads V_CE directly at the transistor. NPN with beta 100, emitter to ground.

## Observable behaviour
- As loaded: base current about 56.6 µA, collector current about 5.66 mA, V_CE about 4.43 V.
- Step the collector source through 2 V, 5 V and 8 V: the collector current stays at about 5.66 mA.
  One point per setting traces one flat curve — the current depends on the base current, not on V_CE.
- Turn the source down to 0.6 V: V_CE falls to about 0.15 V and the collector current drops to roughly four fifths
  of beta × I_B (checked by test/lab-circuits-4.test.mjs).
  That steep part near 0 V is saturation.
- Change the base current with the pot and repeat: each base current gives its own flat line, spaced by
  100 × the change in base current. Together they are the output characteristic family.
- The model has no Early effect, so the flat parts are perfectly flat; real transistors tilt upward slightly.

## Load line
A real stage puts a resistor R_C in the collector. Its line runs from V_CE = supply (no current) to
I_C = supply / R_C (no voltage); where it crosses the curve for the chosen base current is the operating point.

## What this verifies
1. I_C = beta × I_B in the active region, independent of V_CE.
2. Below a few tenths of a volt the transistor saturates and I_C collapses.

```assert
# as loaded: Ib = 56.6 uA, Ic = 5.66 mA, V_CE = 5 - 0.566 = 4.43 V
net npn_10.base V 0.68 +-0.03
net npn_10.collector V 4.43 +-0.05
net vsource_3.pos V 5.00 +-0.01
```
