# lab-tilt-comparator — expected behaviour

## Circuit
- 9 V. One section of an LM324 (`lm324_3`) with no feedback at all: a comparator. The other three sections are parked as grounded followers.
- − input: half the supply from 10 kΩ / 10 kΩ.
- + input: the wiper of the "tilt" knob, a 1 kΩ potentiometer (`potentiometer_7`) between two 100 kΩ resistors. Its whole travel only reaches a few hundredths of a volt either side of half supply.
- Output: a green LED with 1 kΩ to ground (lit when the output is high) and a red LED with 1 kΩ from +9 V (lit when the output is low; at the high output only about 1.75 V is left across it and its resistor, not enough to light it).

## Observable behaviour
- The balance is not at the middle of the knob but near 0.45. The LM324's input bias current (about 47 nA out of the + input through the knob's roughly 50 kΩ, 42 nA out of the − input through the 5 kΩ divider) lifts + by about 2.2 mV against −: an input offset, as on a real chip.
- As loaded (knob at 0.4): the input is 2.3 mV below the reference; the output sits low, red lit, green dark.
- Knob at 60 % (0.6): 6.7 mV above; the output is high, green lit, red practically dark.
- The whole changeover happens within about a tenth of a millivolt above balance: a thousandth of the knob's travel. At 0.4525 (48 µV above balance) both LEDs glow; at 0.461 (0.43 mV) it is fully high; at 0.4514, exactly balanced, it is still low.
- In the changeover the output moves about 4.1 V for 45 µV at the input: a gain near a hundred thousand. Open loop the amplifier is slow (its dominant pole lies near 10 Hz), so after each turn of the knob the output takes a few tens of milliseconds to settle.
- The simulated chip has no input offset voltage, only the bias-current offset above; a real one adds a millivolt or so either way, and noise makes the changeover flicker.

## What this verifies
1. Without feedback an op-amp amplifies the difference of its inputs by a huge factor: a few millivolts already drive it from one end of its range to the other.
2. Used like that it is a comparator: a two-state output telling which input is higher.

```assert
# knob at 0.4: input 2.3 mV below the reference, output low (the input bias
# current lifts the wiper 2.4 mV above its unloaded divider value)
net potentiometer_7.wiper V 4.4979 +-0.0005
net lm324_3.1_neg V 4.500 +-0.0005
net lm324_3.1_out V 0.36 +-0.05
net potentiometer_7.a V 4.5248 +-0.0005
```
