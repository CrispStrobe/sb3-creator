---
level: intermediate
age: 12+
prereqs: [arduino-sk-p09-motorized-pinwheel]
teaches: [dc-motor, h-bridge, speed-control, direction, potentiometer]
---
## What you see
A pot on A0 controls motor speed. Two buttons select forward or reverse direction. The motor driver (H-bridge) on D4/D5 sets direction; D9 sets speed via PWM.

## Try this
1. Press the forward button and turn the pot — the motor speeds up and slows down.
2. Press reverse — the motor changes direction at the current speed.
3. Release both buttons — the motor stops (enable goes LOW).

## What is going on
The pot reading maps to a PWM duty cycle on the enable pin: higher value = faster motor. The two direction pins (motorDir1, motorDir2) form an H-bridge truth table: one HIGH and one LOW = forward; swapped = reverse; both LOW = coast. The enable pin controls whether the bridge is active at all.

## Go further
- [54-motor-driver](../54-motor-driver) — the same concept with the L293D chip.
- [44-darlington-motor](../44-darlington-motor) — single-direction motor drive with a TIP120.
