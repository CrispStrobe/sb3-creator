---
level: beginner
age: 10+
prereqs: [lab-astable-blinker]
teaches: [astable, feedback, signals]
---
## What you see
A two-transistor blinker with a red and a green LED, and four switches: **EN1** and **EN2** connect each transistor's emitter, **HOLD** connects one of the two coupling capacitors, **DARK** bridges the red LED.

## Try this
1. Click **Sim**: red and green take turns, both blinking.
2. Close **DARK**: only green blinks (the circuit still runs; the red LED is just bypassed). Open it again.
3. Open **HOLD**: the blinking stops and both LEDs stay on. Close it again.
4. Open **EN1**: red goes out, green stays on.
5. Open **EN2** as well: both off. Close **EN1** again: red on, green off.
6. Close everything: both blink again. Five different signals from one circuit.

## What is going on
Each transistor switches the other one off through a capacitor, and it takes about a third of a second until the other base has recharged through its 47 kΩ. Take away one capacitor (**HOLD**) and nothing switches anybody off: both bases get current through their resistors and both LEDs stay lit. Take away a transistor's emitter connection (**EN1**, **EN2**) and that half can carry no current at all: its LED is dark, and the other transistor, which nobody switches off any more, stays on.

## Go further
- [lab-astable-blinker](../lab-astable-blinker) — the plain blinker.
