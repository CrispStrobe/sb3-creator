---
level: beginner
age: 8+
prereqs: []
teaches: [digital-output, button, led-patterns, conditional]
---
## What you see
Spaceship Interface: a green LED (D3) shows standby mode. Press the button on D2 and two red LEDs (D4, D5) alternate — the alert pattern. Release and the green LED returns.

## Try this
1. Press the button and watch the red LEDs alternate while the green goes off.
2. Change the alternation speed by adjusting the wait times.
3. Add a third pattern: hold a second button for a yellow LED (steady, no alternation).

## What is going on
The program reads the button continuously. When not pressed, the green LED is on and the reds are off. When pressed, the green turns off and the reds alternate: one on, one off, swap, repeat. This is the Starter Kit's first project — the simplest state machine with two modes.

## Go further
- [arduino-02-button](../arduino-02-button) — a simpler one-button, one-LED version.
- [14-traffic-light](../14-traffic-light) — a timed three-state sequence.
