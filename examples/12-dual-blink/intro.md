---
level: beginner
age: 8+
prereqs: [01-blink]
teaches: [multi-output, timing, alternation]
---
## What you see
Two LEDs on P1.0 and P1.1 blink in alternation — when one is on, the other is off. Both are wired active-low. The effect is a steady back-and-forth flash.

## Try this
1. Run the program and watch the two LEDs alternate.
2. Change the timing so one LED stays on longer than the other, creating an asymmetric pattern.
3. Try making both LEDs blink together (on at the same time, off at the same time) by swapping one of the turn-on/turn-off commands.

## What is going on
The program runs a forever loop that turns LED1 on and LED2 off, waits, then reverses them, and waits again. Because both LEDs are active-low, "turn on" pulls the respective pin LOW and "turn off" sets it HIGH. The MCU executes these instructions sequentially — there is no true parallelism — but the switching is so fast that both LEDs appear to change at the same instant. The wait between switches determines the blink rate.

## Why it matters
Controlling multiple outputs with precise timing is the basis of traffic lights, indicator panels, and multiplexed displays. This example shows that even a single-threaded MCU can appear to do two things at once, as long as it switches fast enough.

## Go further
- [01-blink](../01-blink) — the single-LED version for comparison.
- [08-led-chaser-595](../08-led-chaser-595) — scale up to eight LEDs with a shift register.
- Experiment: add a third LED and create a rotating pattern where only one of the three is on at a time.
