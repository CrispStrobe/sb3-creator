---
level: beginner
age: 8+
prereqs: [arduino-02-button]
teaches: [button, dc-motor, digital-output]
---
## What you see
Press the button on D2 and the motor on D9 spins. Release and it stops. The simplest motor control — one button, one motor.

## Try this
1. Press and hold the button to spin the motor.
2. Change the motor pin to a PWM pin and use set-pwm to control speed.
3. Add a second button that runs the motor in reverse (would need an H-bridge).

## What is going on
The button is read as a digital input. When HIGH, the motor pin is driven HIGH, which (through a transistor driver) powers the motor. When the button is released, the pin goes LOW and the motor stops. No speed control here — just full on or full off.

## Go further
- [arduino-sk-p10-zoetrope](../arduino-sk-p10-zoetrope) — motor speed control with a pot and direction buttons.
- [54-motor-driver](../54-motor-driver) — L293D H-bridge for bidirectional motor control.
