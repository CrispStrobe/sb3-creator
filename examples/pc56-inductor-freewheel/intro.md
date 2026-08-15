---
level: intermediate
age: 12+
prereqs: [pc08-diode-polarity]
teaches: [freewheel-diode, inductive-kickback, protection]
---
## What you see
An inductor driven by a switch, with a diode across it pointing in the "wrong" direction during normal operation. When the switch opens, the diode provides a safe path for the inductor's collapsing current instead of letting it create a damaging voltage spike.

## Try this
1. Run the simulation with the freewheel diode in place and observe the smooth voltage at the switch when it opens.
2. Remove the diode and open the switch — watch the voltage spike that appears across the inductor.
3. Try different inductor values and see how larger inductors produce bigger kickback spikes without the diode.

## What is going on
An inductor resists changes in current. When you suddenly cut the current by opening the switch, the inductor tries to keep current flowing by generating whatever voltage it takes — potentially hundreds of volts from a 5 V supply. The freewheel diode gives that current a path: it circulates through the diode and inductor, decaying gradually through resistance instead of spiking. During normal operation the diode is reverse-biased and does nothing.

## Why it matters
Inductive kickback destroys transistors, burns switch contacts, and creates electromagnetic interference. Every relay, solenoid, and motor driver in professional electronics includes a freewheel diode. Forgetting it is one of the most common beginner mistakes and one of the most destructive.

## Go further
- [pc08-diode-polarity](../pc08-diode-polarity) — understand diode direction before placing a freewheel diode.
- [pc52-inductor-filter](../pc52-inductor-filter) — an inductor in a steady-state filtering role.
- Experiment: replace the freewheel diode with a Zener diode and observe how the voltage clamps at the Zener voltage instead of 0.7 V — this makes the current decay faster.
