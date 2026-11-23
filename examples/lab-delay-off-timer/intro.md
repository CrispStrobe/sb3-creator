---
level: beginner
age: 10+
prereqs: [pc06-rc-charge]
teaches: [rc-time-constant, darlington, timer]
---
## What you see
One button, one capacitor, two transistors and a yellow LED. A short press turns the LED on — and it stays on for a long time after you let go.

## Try this
1. Click **Sim**. The LED is dark.
2. Press the button briefly. The LED lights.
3. Wait and watch. After about half a minute it starts to fade out.
4. Press the button again while it is still on: the time starts over.

## What is going on
The button fills the capacitor in a split second. Afterwards the capacitor slowly empties through the 47 kΩ resistor into the base of the first transistor. Two transistors in a row (a Darlington pair) multiply the current so much that a tiny trickle is enough to keep the LED on. The time depends on resistor × capacitor. Because nothing decides "now off", the light fades at the end — a 555 timer would cut it off sharply.

## Go further
- [pc47-555-monostable](../pc47-555-monostable) — the same job with a sharp end.
- [lab-two-led-monostable](../lab-two-led-monostable) — a timer with a comparator.
