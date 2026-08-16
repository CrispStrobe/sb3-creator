---
level: beginner
age: 10+
prereqs: [arduino-03-analog-input]
teaches: [analog-input, pwm, range-mapping, serial-print]
---
## What you see
A potentiometer on A0 controls LED brightness on D9 via PWM. The serial monitor shows the raw reading and the mapped output value.

## Try this
1. Turn the pot and watch the LED dim smoothly from off to full brightness.
2. Change the mapping formula to invert it: full pot = LED off.
3. Print both the raw and mapped values to see the linear relationship.

## What is going on
The ADC reads the pot as 0-1023. The program maps that to 0-255 (the PWM range) and sets the LED duty cycle. The result is smooth, continuous brightness control — not on/off, but every level in between.

## Go further
- [arduino-03-fading](../arduino-03-fading) — automatic fade up and down without a pot.
- [arduino-04-dimmer](../arduino-04-dimmer) — the same concept in the Communication category.
