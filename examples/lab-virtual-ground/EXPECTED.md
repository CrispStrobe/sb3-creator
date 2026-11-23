# lab-virtual-ground — expected behaviour

## Circuit
One 9 V battery. Left half: two 10 kΩ resistors make half the battery voltage, an LM358 follower buffers it into a "virtual ground".
Two uneven loads hang on it: a red LED with 470 Ω from +9 V down to the virtual ground, a green LED with 1 kΩ from the
virtual ground down to the battery's minus. Right half for comparison: a bare 10 kΩ / 10 kΩ divider with one yellow LED
and 1 kΩ from +9 V into its midpoint. A voltmeter on each midpoint, measured from the battery's minus.

## Observable behaviour
- The buffered midpoint stays at 4.5 V although the red load pushes about 5.7 mA into it and the green load takes
  only about 2.8 mA out: the op-amp sinks the difference.
- The bare divider's midpoint is pushed up to about 6.9 V by its single load — the divider cannot hold its value.
- Measured from the virtual ground, the battery terminals are plus and minus four and a half volts. "Ground" is just the point you
  agree to measure from.

## What this verifies
1. A buffered divider is a stiff reference that can source and sink current.
2. An unbuffered divider sags (or here: rises) as soon as it is loaded.

```assert
net lm358_3.1_out V 4.50 +-0.02
net resistor_10.b V 6.89 +-0.05
```
