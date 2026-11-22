# lab-precision-rectifier — expected behaviour

## Circuit
An LM358 on a split supply (two 9 V sources in series, junction = ground). The INPUT knob is a 1 kΩ pot between two 3.9 kΩ resistors from rail to rail, so it sweeps a small range either side of ground. Half 2 of the LM358 buffers the knob as a voltage follower, so both rectifiers see exactly the same input.

- **Plain rectifier:** buffered input → diode → 10 kΩ load to ground.
- **Precision rectifier ("super diode"):** buffered input → non-inverting input of half 1. The op-amp output drives a diode whose cathode is the output node; that node feeds back to the inverting input and carries a 10 kΩ load to ground. The diode sits inside the feedback loop.

Voltmeters read the buffered input and both outputs.

## Observable behaviour

| INPUT position | input | plain diode output | precision output | op-amp output |
|---|---|---|---|---|
| 0 % | −1.02 V | 0.00 V | 0.00 V | −9.0 V (saturated) |
| 50 % | 0.00 V | 0.00 V | 0.00 V | |
| 75 % (start) | +0.511 V | 0.00 V | 0.511 V | 1.20 V |
| 100 % | +1.02 V | 0.34 V | 1.02 V | 1.71 V |

- **The plain diode has a dead zone.** Nothing gets through until the input passes about 0.68 V, and above that the output is always about 0.68 V short. A small signal disappears completely.
- **The precision rectifier has none.** For every positive input its output equals the input to the millivolt. The op-amp simply raises its own output by one diode drop (0.511 V in, 1.20 V on the op-amp output) to make up for the diode.
- **Negative inputs are blocked by both.** The precision output stays at 0 V; the op-amp, with nothing it can do, runs into its negative rail.

## What this verifies
1. A diode needs about 0.7 V before it conducts, so on its own it cannot rectify small signals.
2. Placing the diode inside an op-amp's feedback loop divides its error by the loop gain: the dead zone vanishes.

```assert
# INPUT at 75 %
net u1.2_out V 0.511 +-0.005
net d_loop.cathode V 0.511 +-0.005
net d_plain.cathode V 0.00 +-0.01
```
