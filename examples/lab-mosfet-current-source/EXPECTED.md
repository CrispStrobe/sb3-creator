# lab-mosfet-current-source — expected behaviour

## Circuit
An adjustable battery (9 V as loaded), a green LED, a depletion-mode dual-gate MOSFET and a red LED in one
loop, with no resistor anywhere. Both gates are wired straight to the MOSFET's source, so the gate voltage
is zero. The green LED sits in the drain lead, the red one in the source lead.

## Observable behaviour
- With its gates at the source the MOSFET conducts: both LEDs light. A depletion MOSFET does not need a
  gate voltage to turn on.
- The current is set by the transistor, not by a resistor: about 3.8 mA at 9 V. Turn the battery up
  from four and a half to twelve volts and the current rises by only about a seventh, although the voltage
  nearly triples. The
  MOSFET takes up the extra voltage itself: a constant-current source.
- Both LEDs carry exactly the same current: it does not matter whether the LED sits above the transistor
  (drain side) or below it (source side).
- Below about 4 V the two LED forward voltages use up the battery and both go dark.

## What this verifies
1. Depletion mode: conducting at V_GS = 0.
2. In saturation the drain current hardly depends on the drain-source voltage (constant-current source).

```assert
# 9 V: gates on the source, the red LED's forward voltage under the source
net dual_gate_mosfet_4.source V 1.66 +-0.05
net dual_gate_mosfet_4.drain V 7.04 +-0.1
```
