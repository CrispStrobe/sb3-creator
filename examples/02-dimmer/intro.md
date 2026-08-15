---
level: intermediate
age: 12+
prereqs: [01-blink]
teaches: [adc, pwm, potentiometer]
---
## What you see
An LED gets brighter or dimmer as you turn the potentiometer knob. The MCU reads the pot's position as an analog voltage, then drives the LED with software PWM at a duty cycle matching that voltage.

## Try this
1. Run the program and drag the potentiometer slider from one end to the other.
2. Watch the LED go from fully off to fully bright as the pot value changes from 0 to 255.
3. Set the pot to the middle position and notice the LED glows at roughly half brightness.

## What is going on
The potentiometer acts as a variable voltage divider, feeding 0–5 V to the MCU's ADC input. The MCU converts that voltage to a digital number (0–255). It then rapidly switches the LED pin on and off in a loop — the fraction of time spent ON (the duty cycle) equals the ADC reading divided by 255. Your eye averages the flicker into a perceived brightness level. This is software PWM: no special timer hardware, just a fast loop.

## Why it matters
PWM is the standard way to control brightness, motor speed, and servo position in embedded systems. Reading an analog sensor and using its value to control an output is the core of most real-world MCU applications.

## Go further
- [10-motor-speed](../10-motor-speed) — use the same pot-to-PWM idea to control a DC motor.
- [03-night-light](../03-night-light) — replace the pot with a light sensor for automatic control.
- Experiment: add a second LED on another pin and make it dim in the opposite direction (bright when the first is dim).
