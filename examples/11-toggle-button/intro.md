---
level: beginner
age: 8+
prereqs: [05-counter-7seg]
teaches: [toggle, state-machine, debounce]
---
## What you see
Press the button once and the LED turns on. Press it again and the LED turns off. The MCU remembers the current state and flips it on each press — a toggle, the simplest state machine.

## Try this
1. Run the program and press the button — the LED turns on and stays on.
2. Press again — it turns off and stays off.
3. Press rapidly several times and confirm each press toggles exactly once, with no double-toggles.

## What is going on
The program keeps a variable that tracks whether the LED is currently on or off. When it detects a button press (using the wait-until pattern — "wait until button pressed, then wait until button released"), it flips the variable and sets the LED accordingly. The wait-until-released step is critical: without it, the program would toggle many times during a single long press because the loop runs thousands of times per second. Combined with debouncing, this gives clean, reliable toggling.

## Why it matters
Toggle behaviour is how every light switch, mute button, and power button works. The wait-until pattern for edge detection is a fundamental embedded technique that prevents the program from reacting to the same event multiple times. It is also the simplest possible state machine — two states and one transition.

## Go further
- [05-counter-7seg](../05-counter-7seg) — counting presses instead of toggling.
- [12-dual-blink](../12-dual-blink) — control two outputs at once.
- Experiment: add a long-press feature — holding the button for 2 seconds toggles a second LED.
