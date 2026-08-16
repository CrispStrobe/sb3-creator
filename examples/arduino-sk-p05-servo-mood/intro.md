---
level: intermediate
age: 10+
prereqs: [arduino-01-analog-read-serial]
teaches: [servo, analog-input, position-control, range-mapping]
---
## What you see
Servo Mood Indicator: a potentiometer on A0 controls the angle of a servo on D9. Turn the knob and the servo arm follows — from 0 to 180 degrees.

## Try this
1. Turn the pot slowly and watch the servo track it.
2. Change the mapping to use only half the range (0-90 degrees).
3. Print the angle to the serial monitor to see the numeric value.

## What is going on
The pot reading (0-1023) is mapped to the servo range (0-180 degrees). The servo library converts the angle to a 50 Hz PWM signal with a 1-2 ms pulse width. The servo horn moves to the corresponding position and holds it. This is proportional position control — the output tracks the input continuously.

## Go further
- [53-servo-sweep](../53-servo-sweep) — automatic sweep without a pot.
- [arduino-sk-p10-zoetrope](../arduino-sk-p10-zoetrope) — pot-controlled motor speed instead of servo angle.
