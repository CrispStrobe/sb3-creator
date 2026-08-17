---
level: advanced
age: 16+
prereqs: [01-blink]
teaches: [servo, pwm-control, angular-position]
---
## What you see
A servo motor sweeping back and forth between 0 and 180 degrees. The MCU generates a PWM signal that tells the servo where to point — a 1 ms pulse means 0 degrees, 1.5 ms means 90 degrees, and 2 ms means 180 degrees. The servo repeats this sweep continuously. This example works on all supported microcontrollers — pick a different device in the toolbar to see the adapted circuit.

## Try this
1. Run the simulation and watch the servo arm sweep from one extreme to the other.
2. Pause the sweep at a specific angle and read the PWM pulse width — confirm it matches the expected value.
3. Change the sweep speed by adjusting the delay between angle steps.

## What is going on
A hobby servo expects a 50 Hz PWM signal (20 ms period). The pulse width within each period encodes the target angle: 1 ms for 0 degrees, 2 ms for 180 degrees, with linear interpolation between them. The servo contains a motor, a gear train, and a feedback potentiometer. It compares the pot's position to the commanded position and drives the motor until they match. This closed-loop control happens entirely inside the servo — the MCU only needs to send the pulse.

## Why it matters
Servos are used in robotics, RC vehicles, camera gimbals, and automated locks. They are the simplest way to get precise angular position control from a microcontroller — one pin, one wire, and the servo does the rest.

## Go further
- [54-motor-driver](../54-motor-driver) — compare servo position control with DC motor speed control using an H-bridge.
- [24-pwm-fade](../24-pwm-fade) — understand the PWM signal that drives the servo.
- Experiment: modify the program to move the servo to specific angles on button presses (0, 45, 90, 135, 180) instead of sweeping continuously.
