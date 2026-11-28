# pc83-gluecksrad — expected behaviour

## Circuit
The 555 clocks six CD4017 positions. Q6 resets the counter to Q0. The tilt switch and a 4.7 µF capacitor control the 555 reset pin. When the sensor returns to level, the capacitor discharges through the 10 kΩ return resistor and disables the clock.

## Observable behaviour
- **Tilt sensor activated (shaking):** 555 runs, LEDs chase across 6 positions.
- **Sensor settles:** the clock stops after the short RC delay, and the last LED stays on.
- **6 positions** (not 10): q6 wraps counter back to q0.

## What this verifies
1. Tilt sensor as a shake trigger
2. 6-position wheel via q6→reset feedback
3. RC delay before the clock stops

```assert
# 555+CD4017 wheel: VCC = 5V, 6 positions (q6->reset)
net vcc_1.pos V 5.00 +-0.01
```
