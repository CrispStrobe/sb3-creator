---
level: beginner
age: 10+
prereqs: [pc01-led-resistor]
teaches: [voltage-divider, kirchhoff]
---
## What you see
Two equal 10 kΩ resistors connected in series across a 9 V battery. The point between them sits at exactly 4.5 V — half the supply.

## Try this
1. Click **Sim** and read the voltage at the junction between R1 and R2.
2. Change R2 to 20 kΩ. The junction voltage shifts — predict which way before you look.
3. Try making R1 much larger than R2 (e.g. 100 kΩ vs 1 kΩ). Where does the voltage end up?

## What is going on
A voltage divider splits the supply voltage in proportion to the two resistances. The formula is V_out = V_in × R2 / (R1 + R2). With equal resistors you get half; by changing the ratio you can create any voltage between 0 and V_in. The current through both resistors is the same because they are in series: I = 9 V / 20 kΩ = 0.45 mA.

## Why it matters
Voltage dividers are everywhere — in sensor circuits, bias networks, and level shifting. Understanding them is the key to reading almost any analogue schematic.

## Go further
- [pc07-pot-dimmer](../pc07-pot-dimmer) — a potentiometer is a continuously adjustable voltage divider.
- [pc33-thermistor-divider](../pc33-thermistor-divider) — replace one resistor with a temperature sensor.
- Experiment: calculate V_out for R1 = 3.3 kΩ, R2 = 6.8 kΩ, then check your answer in the simulator.
