# ABS model: a wheel that stops turning sounds a warning

In a car's anti-lock brakes, sensors watch each wheel; if a wheel stops turning while the car still moves, it is skidding. This model watches one wheel: a magnet on the shaft gives a pulse every turn, and when the pulses stop, a red LED and a warning tone come on.

**Teaches:** missing-pulse detection, Hall sensors, gates and oscillators

## What to do

Click **Sim** and let the wheel run. Then put a heavy load on the motor's shaft (its load torque), as if you were holding it, and release it again.

## What you should see

- Turning: green LED, silence.
- Held: within a few hundredths of a second the red LED lights and a tone sounds.
- Released: green and silent again.

## Why it works

Every pulse from the shaft switches on a transistor that empties a capacitor. Between pulses the capacitor charges slowly, but never far, because the next pulse comes too soon. When the wheel stops, nothing empties it any more and it charges past half the supply; the op-amp switches, the gates swap the LEDs and release the tone oscillator.
