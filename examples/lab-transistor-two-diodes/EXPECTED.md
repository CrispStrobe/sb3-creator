# lab-transistor-two-diodes — expected behaviour

## Circuit
5 V. Four NPN transistors, each used as a single junction with its third lead left open, each with
470 Ω and an LED from +5 V:
- A: into the base, emitter to ground (base–emitter forward)
- B: into the base, collector to ground (base–collector forward)
- C: into the emitter, base to ground (base–emitter reversed)
- D: into the collector, base to ground (base–collector reversed)
The transistors use the exponential (Ebers–Moll) model, which has both junctions.

## Observable behaviour
- A and B light (about 5.2 mA each): from the base to either outer lead, current flows like through a diode.
- C and D stay dark: reversed, each junction blocks.
- The reverse breakdown of a real base–emitter junction (around 6–9 V) is not modelled; with 5 V it would not be reached anyway.

## What this verifies
1. An NPN transistor contains two PN junctions that share the P-type base.
2. Testing both junctions in both directions finds the base and checks the transistor.

```assert
# A and B forward (LED lit, base about 0.7 V), C and D blocking
net npn_5.base V 0.71 +-0.05
net npn_8.base V 0.70 +-0.05
# C and D: no current, so their resistors drop nothing and the LED anodes sit
# at the supply (the node between each dark LED and its blocking junction is
# held by leakage alone and is not asserted)
net resistor_9.b V 5.00 +-0.01
net resistor_12.b V 5.00 +-0.01
```
