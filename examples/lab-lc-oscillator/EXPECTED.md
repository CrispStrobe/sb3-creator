# lab-lc-oscillator — expected behaviour

## Circuit
- 9 V supply. The coil L = 100 mH runs from +9 V to the transistor's collector.
- C1 = 100 nF from collector to emitter and C2 = 1 µF from emitter to minus form the tank together with the coil and split its voltage: the emitter gets about a tenth of the swing back.
- The base sits on a 22 kΩ / 10 kΩ divider, held steady by 10 µF (common base). Emitter resistor 4.7 kΩ.
- Scope channel 1 on the collector, channel 2 on the emitter.

## Observable behaviour
- The collector starts swinging right after power-on and keeps the same size: a sine around the supply voltage, about 18 V peak to peak.
- Frequency from the tank: the two capacitors in series make 1 / (1/100 nF + 1/1 µF) ≈ 91 nF, so f = 1 / (2π√(100 mH × 91 nF)) ≈ 1.67 kHz, an audible tone.
- Compare lab-lc-ringing: there the swing dies away; here the transistor tops it up on every cycle.
- Larger C1 or C2 lowers the pitch; removing C1 removes the feedback and stops it.

```assert
# supply
net vsource_2.pos V 9.00 +-0.01
```
