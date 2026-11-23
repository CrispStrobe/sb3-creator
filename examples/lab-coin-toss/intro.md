---
level: intermediate
age: 12+
prereqs: [51-555-astable, 27-led-dice]
teaches: [randomness, toggle-flip-flop, sampling, 555-timer]
---
## What you see
A 555 timer as a fast clock, a flip-flop that flips on every clock tick, and two LEDs: red for heads, green for tails. The clock only runs while you hold the button.

## Try this
1. Click **Sim**: tails is showing.
2. Hold **hold to toss** for a moment: both LEDs flicker.
3. Let go: one LED stays lit. That is your toss.
4. Toss twenty times and count heads and tails. Is it close to half and half?

## What is going on
While the button is held, the clock ticks about thirty times a second and the flip-flop changes sides on every tick — far too fast to follow. When you release the button the clock stops dead, and the flip-flop keeps whatever side it was on. Which side that is depends on the length of your press down to a few hundredths of a second, and no hand is that precise. The randomness comes from you, not from the circuit.

## Go further
- [27-led-dice](../27-led-dice) — the same trick with six faces.
- [lab-counter-timer](../lab-counter-timer) — four divide-by-two stages in a row.
