# lab-wheatstone-bridge — expected behaviour

## Circuit
9 V. Left arm: a known 10 kΩ from +9 V to node A, then the unknown resistor to ground. A slide switch picks the
unknown: 6.8 kΩ (position a) or 4.7 kΩ (position b). Right arm: a 10 kΩ potentiometer across the supply, its wiper is
node B. A voltmeter between A (+) and B (−).

## Observable behaviour
- As loaded (6.8 kΩ, pot at 0.5): A sits at about 3.64 V, B at 4.50 V, the meter shows about −0.86 V.
- Turn the pot down until the meter reads zero. That happens at a pot position of about 0.405, where the pot divides
  the supply in the same ratio as the left arm: R_x / (R_n + R_x) = 6.8 / 16.8.
- Switch to the other unknown: the meter swings away from zero. Balance again near 0.32 (4.7 / 14.7).
- The balance point does not depend on the battery voltage — change it and the zero stays where it is.

## What this verifies
1. At balance the two dividers have equal ratios, so R_x = R_n × p / (1 − p) for pot position p.
2. A null measurement is independent of the supply.

```assert
net resistor_3.b V 3.64 +-0.02
net potentiometer_7.wiper V 4.50 +-0.02
```
