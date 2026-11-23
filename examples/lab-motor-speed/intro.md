# Measuring and holding a motor's speed

A magnet or slot on the shaft gives a pulse for every turn. Turn each pulse into a fixed-length pulse and average them, and you get a voltage that grows with the speed. Compare that voltage with the speed you want, and let the difference drive the motor: the speed now holds even when the motor has to work harder.

**Teaches:** frequency-to-voltage conversion, negative feedback, set-point and actual value

## What to do

Click **Sim** and watch the meter and the motor speed. Then add a load torque to the motor. Move the slide switch to manual, set the throttle so the motor runs at a similar speed, and add the same load again.

## What you should see

- Regulated, the meter settles at about half scale and the speed hardly changes under load.
- Manual, the same load slows the motor down a lot, and it stays slow.

## Why it works

The 555 makes a pulse of the same length for every encoder pulse, so the more pulses per second, the higher the average voltage. The op-amp keeps adding up the difference between that voltage and the set-point. As long as the motor is too slow, the drive keeps rising; it stops rising only when the measured speed equals the set-point. A load cannot hide from that, which is why every cruise control and fan regulator works this way.
