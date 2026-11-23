# lab-motor-speed — expected behaviour

## Circuit
- 9 V supply. A DC motor with an encoder that gives two pulses per turn.
- Speed sensing: each falling edge of the encoder reaches the 555's trigger through 10 nF; two 10 kΩ resistors hold the trigger at half the supply between edges. The 555 is a monostable with 22 kΩ and 100 nF, so every pulse lasts 1.1 × 22 kΩ × 100 nF ≈ 2.4 ms. 10 kΩ and 10 µF average the pulses into the speed voltage, read by a moving-coil meter set to a two-volt range.
- Control: the set-point pot (10 kΩ below 33 kΩ) gives about 1.05 V in the middle position. Half of an LM358 compares it with the speed voltage and integrates the difference (47 kΩ in, 1 µF + 47 kΩ in the feedback). An NPN emitter follower drives the motor; a diode catches the motor's kick.
- The slide switch chooses what feeds the follower: the regulator (left, authored) or the throttle pot (right, manual).

## Observable behaviour
- Regulated: within a second the speed settles where the speed voltage equals the set-point, about 227 rad/s, and the meter reads about 1.05 V.
- Add a load torque on the motor: the speed dips briefly and comes back to within a few per cent, because the regulator raises the motor voltage until the speed voltage matches again.
- Manual, throttle in the middle: about 191 rad/s with no load. The same load torque drags it down to about 103 rad/s and it stays there.
- The set-point reaches the regulator straight from the pot, so a sudden change makes the integrator ramp the speed rather than jump.

```assert
# power-on: set-point, throttle and the trigger's resting level
net vsource_2.pos V 9.00 +-0.01
net potentiometer_15.wiper V 1.05 +-0.02
net potentiometer_20.wiper V 4.50 +-0.02
net timer_555_7.trigger V 4.50 +-0.02
```
