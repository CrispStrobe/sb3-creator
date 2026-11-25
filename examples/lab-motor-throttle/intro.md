# A magnet as throttle, and a soft start for the motor

Two ways to drive a motor gently. First, a magnet as a throttle: the closer it comes to a Hall sensor, the faster the motor turns, with nothing touching. Second, a soft start: a switch that does not jerk the motor into motion but lets it speed up over a second.

**Teaches:** linear Hall sensors, RC ramps, motor drivers

## What to do

Click **Sim**. Move the field slider of the Hall sensor from 0 to 1 and watch the motor. Then set the mode slide switch to the soft-start side, move the run switch to run, wait, and back to stop.

## What you should see

- No field: the motor stands. A stronger field: faster.
- Soft start: the motor speeds up over about a second, and slows down gently when you switch off.

## Why it works

The Hall sensor's output rises with the field; the op-amp removes its 4.5 V resting value and doubles the rest, and the LM386 turns that into motor power. For the soft start a capacitor charges slowly through a resistor; the op-amp copies its voltage without loading it, so the drive follows the slow ramp up and, when switched off, the slow ramp down.
