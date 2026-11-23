# lab-log-amp — expected behaviour

## Circuit
- Split supply: a positive and a negative rail of 9 V each (the LM358's ground pin goes to the negative rail), circuit ground in the middle.
- A 10 kΩ pot from +9 V to ground sets the input; a voltmeter shows it.
- Stage 1: the input drives current through R1 = 100 kΩ into the inverting input, held at 0 V. The only way back is diode D1 (exponential junction model, saturation current 1e-14 A, ideality 1) from the inverting input to the output. The output therefore sits one diode drop BELOW ground, and that drop grows with the logarithm of the current.
- Stage 2: an inverting amplifier with R2 = 10 kΩ and R3 = 100 kΩ multiplies by −10, so the meter shows a positive voltage ten times the diode drop.

## Observable behaviour

| knob position | input (voltmeter) | input current | meter (x10 output) |
|---|---|---|---|
| 0.01 | 0.09 V | 0.9 µA | 4.73 V |
| 0.1 | 0.89 V | 8.9 µA | 5.33 V |
| 0.5 (authored) | 4.39 V | 44 µA | 5.74 V |
| 1 | 9.00 V | 90 µA | 5.92 V |

- Every factor of ten at the input adds the same step at the output: about 0.59 V per step on the meter, 59 mV per step at the diode.
- Doubling the input adds a constant 0.18 V per step rather than doubling the reading. That is what logarithms do: they turn multiplying into adding.
- Halve the logarithm and you have the logarithm of the square root, which is how analog computers took roots.
- Real diodes drift with temperature by about 2 mV per degree, so practical log amplifiers compensate with a matched second junction.

```assert
# knob half way: 4.39 V in, about 0.574 V across the diode, x10 = 5.74 V
net pot.wiper V 4.389 +-0.01
net u1.1_neg V 0.00 +-0.01
net u1.2_out V 5.739 +-0.02
```
