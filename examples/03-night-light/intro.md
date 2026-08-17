---
level: intermediate
age: 12+
prereqs: [01-blink]
teaches: [ldr, analog-sensing, threshold]
---
## What you see
An LED turns on automatically when the room goes dark. A light-dependent resistor (LDR) in a voltage divider feeds an analog signal to the MCU, which compares the reading to a threshold and switches the LED accordingly. This example works on all supported microcontrollers — pick a different device in the toolbar to see the adapted circuit.

## Try this
1. Run the program and adjust the LDR value — the LED turns on when the reading crosses the threshold.
2. Find the exact crossover point where the LED switches on and off.
3. Try changing the threshold value in the code and see how that shifts the light level at which the LED activates.

## What is going on
The LDR's resistance drops as light increases. In a voltage divider with a fixed resistor, this means the voltage at the ADC pin rises in bright light and falls in darkness. The program reads the ADC continuously and compares it to a fixed threshold. When the reading is below the threshold (dark), the MCU turns the LED on; above it (bright), the LED turns off. This is the simplest form of analog sensing: convert a physical quantity to a voltage, digitise it, and act on a threshold.

## Why it matters
Threshold-based sensing is everywhere — automatic streetlights, phone screen brightness, security lights. Understanding how a changing resistance becomes a decision is the first step toward any sensor-driven project.

## Go further
- [04-thermostat](../04-thermostat) — the same pattern with a temperature sensor and hysteresis to prevent rapid switching.
- [02-dimmer](../02-dimmer) — use analog input for proportional control instead of on/off.
- Experiment: add a second threshold so the LED blinks slowly in twilight but stays fully on in the dark.
