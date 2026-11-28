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
2. Wait for the blinks to finish, then press again. Repeat until the LED blinks four times.
3. Hold the button for two seconds. It counts only once. Release it before the next press.

## What is going on
A pull-up resistor holds P3.2 high. Pressing the button connects the pin to ground. The `ACTIVE LOW` declaration makes `read button` return 1 while pressed. After blinking, the program waits half a second and requires the button to be released before accepting another press. This prevents a held press or bounces during the wait from adding extra counts.

## Why it matters
Reading a button and counting events is fundamental to every interactive device — elevators, vending machines, remote controls. Debouncing is a problem every engineer encounters, and learning it early prevents mysterious double-counts later.

## Go further
- [11-toggle-button](../11-toggle-button) — use a button to toggle an LED on and off instead of counting.
- [01-blink](../01-blink) — review the simpler output-only program if the button input feels complex.
- Experiment: add a reset — if the button is held for more than 2 seconds, reset the counter to zero.
