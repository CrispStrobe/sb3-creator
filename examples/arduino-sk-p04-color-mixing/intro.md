---
level: intermediate
age: 10+
prereqs: [arduino-04-read-ascii-string]
teaches: [rgb-led, color-mixing, analog-input, pwm]
---
## What you see
Color Mixing Lamp: three analog sensors (A0-A2) each control one channel of an RGB LED (D3/D5/D6). Vary the sensors to mix any colour.

## Try this
1. Set one sensor high and the others low — pure red, green, or blue.
2. Set all three equal for white (or close to it).
3. Try red+blue for magenta, red+green for yellow, blue+green for cyan.

## What is going on
Each sensor reading (0-1023) is mapped to the PWM range (0-255) and applied to one LED channel. The three channels combine additively: red + green = yellow, red + blue = magenta, all three = white. The original Starter Kit project uses photoresistors with coloured gels; this version uses potentiometers for easier experimentation.

## Go further
- [pc20-rgb-mix](../pc20-rgb-mix) — RGB colour mixing with resistors (pure circuit, no PWM).
- [arduino-03-fading](../arduino-03-fading) — single-channel PWM fading.
