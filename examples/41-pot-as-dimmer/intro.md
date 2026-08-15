---
level: intermediate
age: 12+
prereqs: [37-voltage-divider-basic]
teaches: [potentiometer, dimming, variable-resistance]
---
## What you see
A potentiometer (pot) connected as a variable voltage divider, with its wiper driving an LED through a current-limiting resistor. Turning the pot changes the LED brightness smoothly from off to full brightness. One knob controls the light.

## Try this
1. Run the simulation and turn the potentiometer from one end to the other — watch the LED brighten and dim.
2. Move the pot to the midpoint and check the voltage at the wiper — it should be about half the supply.
3. Change the pot's total resistance and observe whether the dimming range changes (it should not, because the ratio stays the same).

## What is going on
A potentiometer is a three-terminal resistor with a sliding contact (wiper) that divides the resistance into two parts. It forms a voltage divider whose ratio you can adjust mechanically. The wiper voltage ranges from 0 V to VCC as you turn the knob. The series resistor after the wiper ensures the LED current stays safe even at maximum brightness. This is the classic analog dimmer — no code, no PWM, just a knob.

## Why it matters
Potentiometers are the most common human input in analog electronics. Volume knobs, brightness dimmers, and joystick axes all use pots. Understanding how a pot creates a variable voltage prepares you for reading analog inputs with an MCU's ADC.

## Go further
- [02-dimmer](../02-dimmer) — use a pot with a microcontroller ADC to control LED brightness digitally.
- [37-voltage-divider-basic](../37-voltage-divider-basic) — see the fixed version of what this pot does continuously.
- Experiment: wire the pot as a variable resistor (two terminals only) instead of a divider and observe how the behaviour changes.
