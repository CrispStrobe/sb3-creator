---
level: intermediate
age: 12+
prereqs: [pc06-rc-charge]
teaches: [inductor, time-constant, exponential-current]
---
## What you see
A resistor and an inductor in series across a 5 V supply. When the supply is switched on the current does not jump to its final value -- it climbs towards it along an exponential curve, because an inductor opposes any CHANGE in the current through it.

## Try this
1. Step the source from 0 V to 5 V and watch the current climb rather than jump.
2. Measure the voltage across the resistor and divide by 100 ohm -- that is the current, and it is the easiest quantity to probe.
3. Note the time to reach 63 % of the final current. That is one time constant, and here it is 100 microseconds.
4. Change the resistor and predict what happens to tau BEFORE you measure. This is where the mistake lives: for an inductor tau = L/R, so a bigger resistor makes it FASTER, the opposite of an RC.

## What is going on
A changing current through an inductor induces a voltage that opposes the change. At the instant of switch-on the current is zero and the inductor holds off almost the whole supply; as current builds, the opposing voltage falls and the resistor takes more of the supply, until nothing is changing and the inductor is just a piece of wire carrying 5 V / 100 ohm = 50 mA. The current follows I(t) = (V/R)(1 - e^(-tR/L)).

## Why it matters
Every relay, motor winding, solenoid and transformer is an inductor, and each one takes time to reach its current and objects violently when you interrupt it. The rise you measure here is the harmless half of that behaviour; the dangerous half is what a flyback diode exists to absorb.

## Go further
- [pc56-inductor-freewheel](../pc56-inductor-freewheel) -- what happens at switch-OFF, and the diode that survives it.
- [pc52-inductor-filter](../pc52-inductor-filter) -- the same R and L with a capacitor added, which turns a first-order rise into a resonant network.
- Experiment: predict tau for 220 ohm and for 47 ohm, then measure both.
