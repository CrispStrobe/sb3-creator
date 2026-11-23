---
level: intermediate
age: 12+
prereqs: [pc05-npn-switch, pc06-rc-charge]
teaches: [astable, multivibrator, positive-feedback, rc-time-constant]
---
## What you see
Two transistors, two capacitors, a red and a green LED. Nobody presses anything, yet the LEDs take turns: red, green, red, green.

## Try this
1. Click **Sim** and watch the rhythm: a little faster than once a second.
2. Turn the rheostat all the way down. One colour now flashes short, the other stays long.
3. Turn it all the way up. The rhythm gets slower.
4. Put a scope probe on a transistor's base and look for the dip below 0 V.

## What is going on
When one transistor switches on, its collector drops, and the capacitor passes that drop on to the other transistor's base, pushing it below zero: that transistor is forced off. The base then slowly climbs back through its resistor. When it reaches about 0.7 V, the second transistor switches on and does the same to the first one. Neither state can last, so the circuit flips back and forth on its own. Each half is timed by its own resistor and capacitor. This is the circuit inside every old-fashioned blinker, and the idea behind the 555 timer.

## Go further
- [lab-transistor-flip-flop](../lab-transistor-flip-flop) — the same two transistors with resistors instead of capacitors: it stays put.
- [51-555-astable](../51-555-astable) — the same job done by a timer chip.
