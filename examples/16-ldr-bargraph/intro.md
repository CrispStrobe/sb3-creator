---
level: intermediate
age: 12+
prereqs: [03-night-light]
teaches: [bar-graph, analog-display, threshold-levels]
---
## What you see
Four LEDs light up like a bar graph showing how bright the room is. In dim light only one LED is on; in full brightness all four are lit. A light-dependent resistor (LDR) in a voltage divider feeds the MCU's ADC.

## Try this
1. Run the program and cover the LDR with your hand — watch LEDs turn off from right to left.
2. Shine a torch on the LDR and see the bar fill up to four.
3. Change the threshold values in the code and observe how the bar responds differently to the same light levels.

## What is going on
The LDR's resistance drops as light increases, raising the voltage at the divider junction. The MCU reads this voltage with its ADC and compares it against three thresholds to decide how many LEDs to light. Each threshold is a boundary: below the first, one LED; between first and second, two; and so on. This turns a continuous analog value into a discrete visual display — the same principle behind signal-strength indicators and volume meters.

## Why it matters
Converting an analog reading into a multi-level display is a pattern you will use whenever you need a quick human-readable indicator without a screen. Battery meters, audio VU meters, and Wi-Fi signal bars all work this way.

## Go further
- [03-night-light](../03-night-light) — the simpler single-threshold version.
- [17-comparator](../17-comparator) — compare two analog values instead of one against fixed thresholds.
- Experiment: add a fifth LED and adjust the thresholds to create a finer-grained display.
