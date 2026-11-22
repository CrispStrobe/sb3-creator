# lab-hearing-sweep — expected behaviour

## Circuit
- 555 astable at 9 V driving a piezo. R1 = 2.2 kΩ; between discharge and the capacitor sit R2 = 15 kΩ and a 100 kΩ pot used as a variable resistor.
- Timing capacitor C1 = 2.2 nF. The range switch adds C3 = 10 nF in parallel for a low range.

## Observable behaviour

| knob | range | tone (simulated) |
|---|---|---|
| 0 | high | about 2.8 kHz |
| half (authored) | high | about 4.9 kHz |
| full | high | about 19.6 kHz |
| 0 | low | about 0.5 kHz |
| full | low | about 3.6 kHz |

- The knob takes resistance out of the timing path, so the pitch rises as you turn it up. Most of the rise is crammed into the last part of the travel, because frequency goes with one over resistance.
- Most young people hear the top of the high range; many adults lose the tone somewhere between 12 and 16 kHz. Where the sound disappears for you is your personal hearing limit.
- The browser's audio output has its own limit, set by its sample rate. Treat the very top of the range with suspicion and trust the frequency readout.
- The control pin sits at two thirds of the supply.

```assert
net u1.control V 6.00 +-0.02
```
