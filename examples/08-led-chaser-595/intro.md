---
level: intermediate
age: 14+
prereqs: [01-blink]
teaches: [shift-register, serial-data, led-pattern]
---
## What you see
Eight LEDs light up one at a time in sequence — walking left, then reversing and walking right — creating a classic chaser (or "Knight Rider") pattern. The MCU uses only three pins to control all eight LEDs through a 74HC595 shift register. This example works on all supported microcontrollers — pick a different device in the toolbar to see the adapted circuit.

## Try this
1. Run the program and watch the light walk back and forth across the eight LEDs.
2. Change the wait time to make the pattern faster or slower.
3. Try loading a different bit pattern (e.g., 0b11000011) and see two LEDs move together.

## What is going on
The 74HC595 is an 8-bit shift register with a parallel output latch. The MCU sends data one bit at a time on the DATA pin, pulsing the CLOCK pin after each bit. After all eight bits are in, a pulse on the LATCH pin transfers the shift register contents to the output pins simultaneously. This turns three MCU pins into eight output pins. The program shifts a single "1" bit through all eight positions, then reverses direction, creating the chaser pattern.

## Why it matters
Shift registers are how real products drive many outputs from few pins — LED matrices, seven-segment displays, indicator panels. Understanding serial-to-parallel conversion is essential for any project that runs out of GPIO pins, which happens quickly on small MCUs.

## Go further
- [01-blink](../01-blink) — review single-pin output before tackling serial data.
- [12-dual-blink](../12-dual-blink) — direct multi-pin control without a shift register, for comparison.
- Experiment: chain a second 74HC595 to extend the pattern to 16 LEDs using the same three MCU pins.
