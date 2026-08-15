---
level: advanced
age: 16+
prereqs: [10-motor-speed]
teaches: [h-bridge, bidirectional-drive, motor-control]
---
## What you see
A DC motor connected through an L293D H-bridge driver IC. The MCU controls both the speed (via PWM on the enable pin) and the direction (via two logic pins). The motor can spin forward, reverse, or stop — all under program control.

## Try this
1. Run the simulation and observe the motor spinning in one direction.
2. Toggle the direction pins and watch the motor reverse.
3. Reduce the PWM duty cycle on the enable pin and observe the motor slowing down.

## What is going on
An H-bridge is a circuit with four switches arranged in an H pattern around the motor. By closing diagonal pairs, current flows through the motor in one direction or the other. The L293D packages this in a single IC with built-in flyback diodes to protect against the voltage spikes motors generate when switched. The enable pin accepts PWM to control the average voltage reaching the motor, which controls its speed. Two logic inputs select the direction: one high and one low for forward, reversed for backward, both low for stop.

## Why it matters
DC motors need more current than any MCU pin can supply, and they need to spin in both directions for most applications — wheels, conveyors, robotic arms. The H-bridge is the standard solution, and the L293D is the classic beginner-friendly version of it.

## Go further
- [53-servo-sweep](../53-servo-sweep) — compare speed control of a DC motor with position control of a servo.
- [10-motor-speed](../10-motor-speed) — review single-direction motor speed control that this example extends.
- Experiment: program a sequence that spins the motor forward for 2 seconds, stops for 1 second, reverses for 2 seconds, and repeats — a basic back-and-forth robot drive.
