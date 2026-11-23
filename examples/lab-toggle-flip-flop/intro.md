---
level: advanced
age: 12+
prereqs: [lab-transistor-flip-flop]
teaches: [toggle, t-flip-flop, memory, debounce]
---
## What you see
A flip-flop with a red and a green LED, a capacitor and two buttons. Every press of either button swaps the colours, like a push-on, push-off light switch.

## Try this
1. Click **Sim**: green is on.
2. Press a button and let go. Red. Press again. Green.
3. Use the other button. It does exactly the same: you can switch from either end, like a staircase light.
4. Press twice very quickly. The second press does nothing.
5. Hold a button down. The light flips once and then stays.

## What is going on
The two transistors hold one bit, as in the plain flip-flop. The extra capacitor slowly follows the voltage on Q1's collector, so it always holds the opposite of what Q1 is doing: charged while Q1 is off, empty while Q1 is on. A press connects the capacitor to Q1's base. If Q1 is off, the charge switches it on; if Q1 is on, the empty capacitor pulls its base down and switches it off. Afterwards the capacitor needs a moment to follow the new state, which is why two presses in very quick succession count only once. A program would do this with one line, `toggle`, plus a debounce delay.

## Go further
- [lab-transistor-flip-flop](../lab-transistor-flip-flop) — the same memory with separate SET and RESET buttons.
- [11-toggle-button](../11-toggle-button) — the same job in software.
