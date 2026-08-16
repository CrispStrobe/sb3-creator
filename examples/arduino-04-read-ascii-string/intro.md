---
level: intermediate
age: 12+
prereqs: [arduino-03-analog-in-out-serial]
teaches: [analog-input, rgb-led, pwm, multi-channel]
---
## What you see
Three potentiometers on A0-A2 control three LEDs on D3, D5, D6 — one pot per colour channel (red, green, blue).

## Try this
1. Turn just the red pot — only the red LED brightens.
2. Set all three pots to maximum for white.
3. Set red and green high, blue low, for yellow.

## What is going on
Each pot is read (0-1023), mapped to 0-255, and applied as PWM to its LED. The three channels are independent. The original sketch reads RGB values from serial; this version uses three physical pots.

## Go further
- [pc20-rgb-mix](../pc20-rgb-mix) — RGB colour mixing with resistors (pure circuit).
- [40-led-color-mix](../40-led-color-mix) — three discrete LEDs side by side.
