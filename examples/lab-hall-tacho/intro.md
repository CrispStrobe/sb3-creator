# Contactless tachometer and speed regulation

A magnet on the shaft and a Hall switch count the turns of a motor without touching it. The pulses become a voltage on a meter: a tachometer. Compare it with a set value, switch the motor accordingly, and the speed stays put even when you load the motor.

**Teaches:** frequency-to-voltage conversion, feedback control, regulation vs. control

## What to do

Click **Sim** and watch the meter. Put a load on the motor's shaft (its load torque) and see how the speed changes. Then move the slide switch to the throttle position, set the throttle potentiometer and load the motor again.

## What you should see

- Regulated: the motor settles at about 180 rad/s; with a load it hunts around that speed but keeps it on average.
- Throttle: the speed follows the throttle pot, and a load slows it down.
- The meter always shows the speed.

## Why it works

Each pulse pushes the same small packet of charge into a capacitor that leaks through a resistor, so the faster the pulses, the higher the voltage. The op-amp compares that voltage with the set value: too slow, the driver switches the motor on; too fast, off. Loaded, the motor simply gets power for a larger share of the time. A throttle cannot do that: it gives the same drive whatever the load.
