---
level: beginner
age: 8+
prereqs: [01-blink]
teaches: [button-input, counting, debounce]
---
## What you see
Each time you press the button on P3.2, a counter goes up by one and the LED blinks that many times. The MCU reads a digital input, counts presses, and uses the count to control output. This example works on all supported microcontrollers — pick a different device in the toolbar to see the adapted circuit.

## Try this
1. Run the program and press the button once — the LED blinks once.
2. Press it three more times and watch the LED blink four times on the last press.
3. Press rapidly and notice that each press is counted exactly once, not multiple times — that is debouncing at work.

## What is going on
The button connects P3.2 to ground through a pull-down resistor. When pressed, the pin reads LOW. The program watches for a HIGH-to-LOW transition, waits a short debounce delay (around 20 ms) to let the mechanical bouncing settle, then increments the counter. It then blinks the LED as many times as the counter says. Without the debounce delay, a single press could register as two or three presses because the metal contacts inside the button bounce several times before settling.

## Why it matters
Reading a button and counting events is fundamental to every interactive device — elevators, vending machines, remote controls. Debouncing is a problem every engineer encounters, and learning it early prevents mysterious double-counts later.

## Go further
- [11-toggle-button](../11-toggle-button) — use a button to toggle an LED on and off instead of counting.
- [01-blink](../01-blink) — review the simpler output-only program if the button input feels complex.
- Experiment: add a reset — if the button is held for more than 2 seconds, reset the counter to zero.
