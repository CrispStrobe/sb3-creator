# lab-mosfet-vcr — expected behaviour

## Circuit
9 V. A depletion-mode dual-gate MOSFET forms the lower leg of a divider: 4.7 kΩ from +9 V to the drain,
the source on a red reference LED (kept lit by 2.2 kΩ from +9 V, so the source sits at about 1.66 V).
Gate 2 is tied to +9 V and stays out of the way. Gate 1 comes through 100 kΩ from a 10 kΩ potentiometer
spanning ground to the source, so the knob sets the gate between 1.66 V below the source and the
source itself. A button ties gate 1 directly to the source. The voltmeter reads drain against source.

## Observable behaviour
- Knob at the bottom (gate 1.66 V below the source): the channel is pinched off, no current, and the
  meter shows the whole remaining supply, about 7.35 V.
- Turning up, the channel opens around a third of the travel and its resistance falls smoothly: at mid
  travel (as loaded) the meter reads about 3.9 V, so the channel is about 5 kΩ.
- Knob at the top (gate at the source, zero gate voltage): the channel is about 100 Ω and the meter
  reads about 0.15 V.
- Press the button with the knob anywhere: the gate is at the source and the reading drops to the
  same 0.15 V. A depletion MOSFET conducts at zero gate voltage; it needs a NEGATIVE gate voltage
  to switch off.

## What this verifies
1. The channel is a resistor whose value the gate voltage sets (voltage-controlled resistor).
2. Depletion mode: conducting at V_GS = 0, pinched off below about −1.2 V.

```assert
# knob at 0.5: gate 0.83 V below the source, channel near 5 kOhm
net dual_gate_mosfet_4.source V 1.66 +-0.05
net dual_gate_mosfet_4.gate1 V 0.83 +-0.03
net voltmeter_10.a V 5.56 +-0.15
```
