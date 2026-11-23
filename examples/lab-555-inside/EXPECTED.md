# lab-555-inside — expected behaviour

## Circuit
A 555 on 9 V with no timing parts. TRIGGER and THRESHOLD are tied together to the wiper of a 10 kΩ pot (INPUT), so the chip sees one input voltage on both comparators. OUTPUT drives a green LED to ground through 1 kΩ (lit when the output is high) and a red LED from +9 V through 1 kΩ (lit when the output is low). A yellow LED with 1 kΩ from +9 V into DISCHARGE shows the internal discharge transistor. RESET is pulled up by 10 kΩ; the RESET button pulls it to ground. CONTROL goes through a slide switch either to a 10 nF capacitor (position a, the usual decoupling) or to the wiper of a second 10 kΩ pot (SHIFT, position b).

## Observable behaviour
- **Start:** INPUT at 20 % puts 1.8 V on both comparator inputs. That is below the lower threshold, so the output is high (about 8.66 V): green on, red and yellow off.
- **Upper threshold:** with CONTROL decoupled, the internal divider holds CONTROL at 6.0 V (two thirds of 9 V). Turning INPUT up, the output stays high until the input passes about 6.0 V, then drops low: green off, red and yellow on.
- **Lower threshold:** turning INPUT back down, the output stays low until the input falls below about 3.0 V (one third of 9 V). Between 3 V and 6 V the output remembers where it came from: that is hysteresis, a Schmitt trigger.
- **CONTROL moves both thresholds:** slide the switch to SHIFT. With SHIFT at 50 % the pin settles at about 5.14 V, not 4.5 V, because the chip's own 5 kΩ divider loads the pot. The thresholds follow to about 5.2 V and 2.5 V. With SHIFT at 80 % they move up to about 6.8 V and 3.3 V. The lower one is always half the upper one.
- **RESET wins:** holding RESET forces the output low (about 0.34 V) whatever INPUT does. Releasing it with INPUT below the lower threshold lets the output go high again.
- **DISCHARGE follows the output:** the yellow LED is lit exactly when the output is low. This is the transistor that empties the timing capacitor in an astable.

## What this verifies
1. Two comparators plus a flip-flop make a Schmitt trigger with thresholds at 1/3 and 2/3 of the supply.
2. CONTROL is the top of the internal divider: pull it and both thresholds move together.
3. RESET overrides the flip-flop; DISCHARGE is driven together with the output.

```assert
# default bench: INPUT at 20 %, CONTROL decoupled, RESET released
net input.wiper V 1.80 +-0.02
net timer.control V 6.00 +-0.05
net timer.output V 8.66 +-0.10
net timer.reset V 9.00 +-0.01
```
