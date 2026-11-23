# lab-light-tone — expected behaviour

## Circuit
- 555 astable at 9 V: R1 = 47 kΩ from 9 V to the discharge pin, R2 = 1 kΩ, C1 = 100 nF, control pin decoupled with 10 nF, output into a piezo.
- A phototransistor sits in parallel with R1. It adds a charging current proportional to the light on it, up to half a milliamp in full light. R1 alone sets the lowest tone, in the dark.

## Observable behaviour

| light | tone (simulated) |
|---|---|
| dark | about 285 Hz |
| a quarter | about 650 Hz |
| half (authored) | about 1.0 kHz |
| full | about 1.6 kHz |

- In the dark the 555 runs on R1 and R2 alone: 1.44 / ((47000 + 2 x 1000) x 0.0000001) = 294 Hz by the textbook formula.
- With light the phototransistor's current comes on top of R1's, the capacitor charges faster and the pitch rises.
- Sweeping the light slider up and down gives slides and chirps, a little light theremin.
- The control pin sits at two thirds of the supply.

```assert
net u1.control V 6.00 +-0.02
```
