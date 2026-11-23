---
level: beginner
age: 12+
prereqs: [pc05-npn-switch]
teaches: [current-gain, beta, saturation, transistor-test]
---
## What you see
A transistor with an LED in its collector and two meters: one for the tiny base current, one for the collector current. A potentiometer sets the base current; a button with a very large resistor plays the part of your fingertip.

## Try this
1. Click **Sim** and read both meters. Divide the collector current by the base current.
2. Turn the potentiometer slowly. Both currents change, but their ratio stays the same.
3. Turn it all the way to the low-resistance end. The LED cannot get brighter than its resistor allows — the ratio collapses.
4. Move the slide switch to the fingertip side. Nothing lights. Press the button: the LED glows faintly, from a few microamps of base current.

## What is going on
A small current into the base lets a current about a hundred times larger flow from collector to emitter. That factor is the current gain, beta. Once the collector circuit cannot take more current, the transistor is "fully on" (saturated) and extra base current is wasted. With the base open, a good transistor stays off.

## Go further
- [lab-transistor-curves](../lab-transistor-curves) — the full family of curves.
- [pc05-npn-switch](../pc05-npn-switch) — the transistor as a switch.
