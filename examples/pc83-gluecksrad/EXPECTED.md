# pc83-gluecksrad — expected behaviour

## Circuit
Same as mini-roulette but tilt_sensor on reset instead of button. 6 LEDs (q0–q5), q6 resets counter.

## Observable behaviour
- **Tilt sensor activated (shaking):** 555 runs, LEDs chase across 6 positions.
- **Sensor settles:** RC decay slows chase, stops at random position.
- **6 positions** (not 10): q6 wraps counter back to q0.

## What this verifies
1. Tilt sensor as a shake trigger
2. 6-position wheel via q6→reset feedback
3. Same RC slowdown principle as roulette
