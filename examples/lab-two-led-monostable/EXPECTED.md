# lab-two-led-monostable — expected behaviour

## Circuit
9 V. Half of an LM358 used as a comparator (its output swings from about 0.35 V to 7.2 V; the other half is parked
as a grounded follower). Its inverting input sits at 3 V from a 20 kΩ / 10 kΩ divider. Its non-inverting input is a
22 µF electrolytic with 470 kΩ to ground; a button charges
the capacitor from +9 V through 100 Ω. Red LED with 1 kΩ from +9 V into the output; green LED with 1 kΩ from the
output to ground.

## Observable behaviour
- Idle: the capacitor is empty, the output is low, red is lit (about 6.8 mA) and green is dark.
- Press the button: the capacitor jumps to 9 V, the output goes high, green lights (about 5.4 mA) and red goes out.
- Holding the button keeps it green; the timing starts when you let go.
- After release the capacitor drains through 470 kΩ. When it passes 3 V the output drops and it is red again.
  That takes about 11.4 s: the capacitor has to fall from nine to three volts, which is ln 3 ≈ 1.1 time
  constants of 470 kΩ with 22 µF.

## What this verifies
1. One stable state (red) and one timed state (green).
2. The timed state lasts R × C × ln(V_start / V_threshold).

```assert
# idle: reference 3 V, capacitor empty, output low
net resistor_4.b V 3.00 +-0.01
net polarized_cap_8.pos V 0.00 +-0.01
net lm358_3.1_out V 0.35 +-0.05
```
