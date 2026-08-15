---
level: beginner
age: 10+
prereqs: [avr01-blink]
teaches: [adc, pwm, potentiometer, analog-control]
---
## What you see
A potentiometer controls the brightness of an LED. Turn the knob and the LED smoothly fades from off to full brightness — analogue input driving a digital output.

## Try this
1. Click **Sim** and note the LED brightness.
2. Adjust the potentiometer and watch the LED respond in real time.
3. Set the pot to 0% — the LED goes completely dark. Set it to 100% — full brightness.

## What is going on
The Arduino reads the pot's voltage on analogue pin A0 (0–1023), divides by 1023, scales to a percentage, and sets the LED's brightness on pin D9 using PWM. The pot is a voltage divider: its wiper outputs a voltage between 0 and 5 V depending on position. The ADC converts this analogue voltage to a number the program can use.

## Why it matters
Analogue-to-digital conversion is how microcontrollers sense the physical world — temperature, light, position, pressure. This example shows the full chain: sensor → ADC → computation → output.

## Go further
- [avr04-serial-pot](../avr04-serial-pot) — print the pot reading over serial instead of controlling an LED.
- [02-dimmer](../02-dimmer) — the same concept on an STC12 microcontroller.
- Experiment: add a second pot on A1 and use it to control the blink rate instead of brightness.
