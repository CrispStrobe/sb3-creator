---
level: intermediate
age: 12+
prereqs: [08-led-chaser-595]
teaches: [binary-counting, shift-register, digital-display]
---
## What you see
Eight LEDs connected to a 74HC595 shift register count up in binary. The pattern starts at 00000000 (all off), advances to 00000001 (one LED on the right), 00000010, 00000011, and so on up to 11111111 (all eight on), then wraps back to zero.

## Try this
1. Run the program and watch the binary count — notice how the rightmost LED toggles every step and the leftmost toggles only once every 128 steps.
2. Slow down the count interval so you can follow each bit change.
3. Try starting the count at a specific number, like 170 (binary 10101010), and watch the alternating pattern.

## What is going on
The MCU sends an 8-bit number to the 74HC595 shift register using three signals: data, clock, and latch. Each bit of the number controls one LED. A counter variable increments every cycle, and its binary representation is what the LEDs display. The shift register converts a serial stream of bits into eight parallel outputs — so the MCU only needs three pins to control eight LEDs. The binary count makes the relationship between numbers and bit patterns physically visible.

## Why it matters
Binary is how computers store and process every number, letter, and instruction. Watching a physical binary counter makes the abstract concept tangible. The shift register itself is a fundamental building block — it is how computers move data between components, and it is the basis of serial communication.

## Go further
- [08-led-chaser-595](../08-led-chaser-595) — the simpler shift register project with a single moving LED.
- [18-logic-and-gate](../18-logic-and-gate) — logic gates, the components that make binary arithmetic possible.
- Experiment: instead of counting up by 1, count by 3 and observe the less intuitive bit patterns.
