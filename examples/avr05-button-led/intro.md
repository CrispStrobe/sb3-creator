---
level: beginner
age: 8+
prereqs: [avr01-blink]
teaches: [button-input, digital-input, conditional-logic]
---
## What you see
A push button controls an LED. Press the button and the LED lights up; release it and the LED goes dark. The simplest input-to-output program.

## Try this
1. Click **Sim** — the LED is dark (button not pressed).
2. Press the button. The LED lights up immediately.
3. Release the button. The LED turns off after the next polling cycle (50 ms).

## What is going on
The program reads digital pin D2 in a loop. When the button is pressed, D2 goes high (pulled up to 5 V through the button), and the program turns on pin D13. When released, D2 falls to 0 V through the 10 kΩ pull-down resistor, and the LED turns off. The 50 ms wait sets the polling rate — fast enough to feel instant, slow enough to not waste CPU.

## Why it matters
Reading a button is the foundation of all user input in embedded systems. Every keypad, every control panel, and every game controller starts with this pattern: read a pin, make a decision, act on it.

## Go further
- [avr06-blink-and-print](../avr06-blink-and-print) — combine button reading with other tasks.
- [11-toggle-button](../11-toggle-button) — toggle mode: press once to turn on, again to turn off.
- Experiment: add a second button on D3 that controls a second LED independently.
