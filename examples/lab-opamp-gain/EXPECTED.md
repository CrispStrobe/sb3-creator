# lab-opamp-gain — expected behaviour

## Circuit
An LM358 dual op-amp on a split supply: two 9 V sources in series, with their junction as ground, give a plus rail and a minus rail. The INPUT knob is a 1 kΩ pot between two 8.2 kΩ resistors from rail to rail, so its wiper sweeps a small range either side of ground.

- **Amplifier 1, inverting:** INPUT → R_in = 100 kΩ → inverting input; R_f = 470 kΩ from the output back to the inverting input; non-inverting input at ground. Gain −R_f/R_in = −4.7.
- **Amplifier 2, non-inverting:** INPUT straight into the non-inverting input; R_f = 47 kΩ from the output to the inverting input and R_g = 10 kΩ from there to ground. Gain 1 + R_f/R_g = 5.7.

Voltmeters read the input and both outputs against ground.

## Observable behaviour

| INPUT position | input | inverting output | non-inverting output |
|---|---|---|---|
| 0 % | −0.495 V | +2.33 V | −2.82 V |
| 25 % | −0.248 V | +1.16 V | −1.41 V |
| 50 % | 0.000 V | 0.00 V | 0.00 V |
| 75 % | +0.248 V | −1.16 V | +1.41 V |
| 100 % | +0.495 V | −2.33 V | +2.82 V |

- **The ratio is fixed by two resistors:** at every position the inverting output is −4.7 times the input and the non-inverting output is +5.7 times the input. The op-amp's own gain does not appear.
- **Virtual ground:** the inverting input of amplifier 1 stays at 0.00 V even though it is not wired to ground. Negative feedback holds it equal to the non-inverting input.
- **Range:** the input only spans about ±0.5 V, so neither output gets near the supply rails.
- **Sign:** the inverting stage flips the sign, the non-inverting one keeps it.

## What this verifies
1. Negative feedback sets the gain with resistor ratios: −R_f/R_in and 1 + R_f/R_g.
2. The two inputs of an op-amp with negative feedback sit at the same voltage.

```assert
# INPUT at 75 %
net input.wiper V 0.248 +-0.005
net u1.2_out V 1.41 +-0.02
net u1.1_neg V 0.00 +-0.01
```
