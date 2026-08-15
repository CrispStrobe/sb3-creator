---
level: intermediate
age: 12+
prereqs: [01-blink]
teaches: [pwm, fading, duty-cycle]
---
## What you see
An LED smoothly fades from off to full brightness and back, over and over. There is no flicker — the brightness changes feel continuous, like a dimmer switch.

## Try this
1. Run the program and watch the LED breathe up and down.
2. Speed up the fade by reducing the delay between brightness steps — the breathing gets faster.
3. Slow down the PWM frequency (increase the cycle time) until you can see the LED flickering instead of glowing smoothly.

## What is going on
The MCU cannot output an analog voltage — its pins are either high or low. Instead, it switches the pin on and off very fast and varies the proportion of on-time to off-time. This proportion is called the duty cycle. At 50% duty cycle, the LED is on half the time and appears half as bright. At 10%, it is dim; at 90%, nearly full. If the switching is fast enough (above about 100 Hz), the human eye sees a steady glow rather than flicker. The code sweeps the duty cycle from 0% to 100% and back, creating the fade effect.

## Why it matters
PWM is how digital systems control analog quantities. Motor speed, LED brightness, speaker volume, and servo position are all controlled by PWM. It is one of the most universally useful techniques in embedded programming — and it costs nothing in hardware, since every GPIO pin can do it in software.

## Go further
- [01-blink](../01-blink) — the simplest on/off control, before PWM.
- [02-dimmer](../02-dimmer) — use a potentiometer to set the brightness manually instead of fading automatically.
- Experiment: change the fade curve from linear to exponential (square the duty-cycle value) and notice how the brightness change looks more natural to the eye.
