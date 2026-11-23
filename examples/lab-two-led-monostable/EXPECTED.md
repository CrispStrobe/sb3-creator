# lab-two-led-monostable — expected behaviour

## Circuit
9 V. An op-amp used as a comparator (ideal op-amp part, output swings 0 to 9 V). Its inverting input sits at 3 V
from a 20 kΩ / 10 kΩ divider. Its non-inverting input is a 22 µF capacitor with 470 kΩ to ground; a button charges
the capacitor from +9 V through 100 Ω. Red LED with 1 kΩ from +9 V into the output; green LED with 1 kΩ from the
output to ground.

## Observable behaviour
- Idle: the capacitor is empty, the output is low, red is lit (about 7.1 mA) and green is dark.
- Press the button: the capacitor jumps to 9 V, the output goes high, green lights and red goes out.
- Holding the button keeps it green; the timing starts when you let go.
- After release the capacitor drains through 470 kΩ. When it passes 3 V the output drops and it is red again.
  That takes about 11.4 s: the capacitor has to fall from nine to three volts, which is ln 3 ≈ 1.1 time
  constants of 470 kΩ with 22 µF.

## Simulation note
The ideal op-amp part has no supply pins; its output limits are set to 0 V and 9 V. The LM358 model did not
settle with two LEDs on its output.

## What this verifies
1. One stable state (red) and one timed state (green).
2. The timed state lasts R × C × ln(V_start / V_threshold).

```assert
# idle: reference 3 V, capacitor empty, output low
net resistor_4.b V 3.00 +-0.01
net capacitor_8.a V 0.00 +-0.01
net opamp_3.out V 0.00 +-0.05
```
