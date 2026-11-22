---
level: beginner
age: 10+
prereqs: [pc04-parallel-leds, pc05-npn-switch]
teaches: [current-paths, bypass, forward-voltage, kirchhoff-current-law]
---
## What you see
Three little LED circuits side by side. In each one a button (or a transistor) offers the current an easier way round an LED.

## Try this
1. Press BYPASS RED. The red LED goes out, and the green LED in the same chain gets *brighter*. Now try BYPASS GREEN, then both.
2. Press ADD RED. A red LED is connected right across the lit green one. Green goes dark and red takes over.
3. Press SHUNT. A tiny base current turns the transistor on, and the transistor steals the yellow LED's current.

## What is going on
Current always shares itself between the paths it is offered, and a wire (a closed button) is the easiest path there is. Bypassing an LED in a series chain takes its forward voltage out of the loop, so more voltage is left for the resistor and the other LED, and the current rises. Two LEDs straight in parallel are an unfair contest: the red LED starts conducting at a lower voltage than the green one, so it holds the shared node too low for the green LED to light. A transistor across an LED is a bypass button that a small current can press.

## Go further
- [pc04-parallel-leds](../pc04-parallel-leds): parallel LEDs that do share, each with its own resistor.
- [lab-rtl-gates](../lab-rtl-gates): transistors pulling outputs down to make logic.
