# lab-mosfet-vcr — expected behaviour

## Circuit
9 V. A depletion-mode dual-gate MOSFET with a green LED and 470 Ω in its drain. Its source sits on a red
reference LED, kept lit by 2.2 kΩ from +9 V, so the source is about 1.7 V above ground. Gate 2 is tied to
+9 V and stays out of the way. Gate 1 comes through 100 kΩ from a 10 kΩ potentiometer that is fed through
15 kΩ from +9 V (its top end at about two fifths of the battery), so the knob takes the gate from about 1.7 V BELOW the source to about 1.8 V
above it. A button ties gate 1 directly to the source. The voltmeter reads gate against source.

## Observable behaviour
- Knob at the bottom: gate about 1.6 V below the source, beyond pinch-off: the green LED is dark.
- Turning up, the LED comes on gradually while the gate is still NEGATIVE (from about the pinch-off point) and is
  already bright at zero gate voltage. As loaded (knob 0.4) the gate is a little below the source and
  the LED carries about 4.4 mA.
- Further up (gate positive) it gets only a little brighter: the 470 Ω resistor then limits the current.
- The button (gate on the source, V_GS = 0) lights the LED wherever the knob is.

## What this verifies
1. Depletion mode: conducting at zero gate voltage, pinched off a little more than a volt below the source.
2. The gate voltage, negative or positive, sets the channel smoothly from closed to wide open.

```assert
# knob at 0.4: gate 0.29 V below the source
net dual_gate_mosfet_5.source V 1.73 +-0.05
net voltmeter_12.a V 1.44 +-0.04
net dual_gate_mosfet_5.drain V 4.96 +-0.3
```
