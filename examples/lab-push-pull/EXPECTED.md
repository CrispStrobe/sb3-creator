# lab-push-pull — expected behaviour

## Circuit
Split supply: two 9 V sources stacked around ground give a plus and a minus rail. One sine source (50 Hz, 4 V peak) drives two
output stages, each an NPN on top and a PNP below with joined emitters:
- class B: both bases straight on the signal, 1 kΩ load from the emitters to ground;
- class AB: 10 kΩ from +9 V and 10 kΩ from −9 V bias a string of two diodes whose middle sits on the signal; the
  NPN base is one diode above the signal, the PNP base one diode below; 22 Ω in each emitter, 1 kΩ load.

## Observable behaviour
- Scope the two loads against the input. The class AB output follows the sine closely, crossing zero with it.
- The class B output is flat at 0 V whenever the input is within about ±0.7 V of zero: neither transistor gets
  enough base voltage to conduct. That flat step at every zero crossing is crossover distortion.
- At t = 1 ms the input is 1.24 V: the class B output is only 0.56 V, the class AB output about 1.22 V.
- Each class AB transistor carries a small idle current through the bias diodes, which is why there is no gap.

## What this verifies
1. Class B needs about 0.7 V before each half conducts.
2. Biasing the bases one diode drop apart (class AB) removes the dead zone.

```assert
# t = 1 ms: input 1.236 V
net vsource_5.pos V 1.24 +-0.02
net resistor_8.a V 0.56 +-0.05
net resistor_17.a V 1.22 +-0.05
```
