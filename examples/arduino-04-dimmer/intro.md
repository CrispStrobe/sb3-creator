---
level: beginner
age: 10+
prereqs: [arduino-03-analog-in-out-serial]
teaches: [pwm, analog-input, dimmer, brightness-control]
---
## What you see
A potentiometer on A0 controls LED brightness on D9 — turn the knob and the LED dims or brightens smoothly.

## Try this
1. Turn the pot from minimum to maximum and watch the LED track it.
2. Print the brightness value to see the 0-255 range.
3. Add a second LED on another PWM pin and drive both from the same pot.

## What is going on
The pot reading (0-1023) is mapped to the PWM range (0-255) and applied to the LED pin. PWM at duty 0 is fully off; at 255 it is fully on.

## Go further
- [arduino-03-fading](../arduino-03-fading) — automatic fade without a pot.
- [41-pot-as-dimmer](../41-pot-as-dimmer) — the same circuit on the STC12 platform.
