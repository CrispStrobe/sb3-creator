# lab-electroscope — expected behaviour

## Circuit
- 9 V supply. A small-signal n-MOSFET (threshold 2 V, k 2 mA/V²), source to ground, drain through a yellow LED and 1 kΩ to +9 V.
- A 100 kΩ / 47 kΩ divider gives 2.9 V; the **set** button connects it to the gate.
- The gate also carries a field probe (20 pF of its own) near a rubbed ruler at 1 kV (positive), 0.1 pF of coupling at the closest. Set `rodVolts` to −1000 for a negatively charged ruler.

## Observable behaviour
- Press and release **set**: the gate is left at about 2.85 V, the LED at about 1.5 mA (half brightness).
- Positive ruler approaching (knob → 1): the gate rises and the LED gets brighter, more than twice the set current.
- Negative ruler approaching: the gate falls below the threshold and the LED goes dark.
- Ruler away (knob → 0): back to about the set brightness, a little dimmer (about 1.1 mA after a positive round trip): while the ruler was near, the gate lost some charge through its insulation. Press **set** again before the next reading.

## Measured on the engine
After set 1.45–1.54 mA; positive ruler at the closest about 6.8 mA; negative 0 mA; ruler away about 1.1 mA (positive) and within 0.3 mA of the set current. `test/lab-circuits-fields.test.mjs` holds these.

## Why
After set, the gate is an isolated conductor with a fixed charge. The ruler induces extra charge of its own sign on the gate side of the wire; the gate voltage follows, and the MOSFET's drain current follows the gate. The same induced charge is what lets a rubbed ruler bend a thin water jet; a circuit can only show the charge.

## What this verifies
1. Induced charge has the ruler's sign on the near conductor.
2. An insulated gate is an electrometer.

```assert
net vsource_2.pos V 9.00 +-0.01
```
