# lab-phase-shift — expected behaviour

## Circuit
An inverting amplifier closed into a loop through three RC sections.

- **Amplifier:** the simulator's generic op-amp, with its output limited to ±9 V. Its non-inverting input sits at ground (through the start-up nudge source, see below). R_f = 270 kΩ in series with the GAIN pot (100 kΩ wired as a variable resistor) runs from the output to the inverting input.
- **Phase-shift ladder:** output → C1 → (R1 to ground) → C2 → (R2 to ground) → C3 → R3 → inverting input. All three C are 10 nF, all three R are 10 kΩ. R3 ends at the virtual ground of the inverting input, so it is both the last ladder resistor and the amplifier's input resistor. Gain = R_f / R3.
- **Start-up nudge:** a source in the non-inverting input gives one tiny blip during the first fraction of a millisecond and is silent after that. A real circuit starts from electrical noise; a simulator has none, so this blip stands in for it.
- A piezo hangs on the output.

The discrete version of this circuit uses one common-emitter transistor as the inverting amplifier. The engine's transistor models did not get a discrete oscillator started in reasonable simulation time, so an op-amp plays the inverting stage here.

## Observable behaviour
Three RC sections shift the phase by 180° together at exactly one frequency, f = 1 / (2π · R · C · √6) = 650 Hz, and they attenuate the signal there by a factor of 29. The inverting amplifier adds the other 180°. So the loop oscillates when the gain is at least 29, and only at that one frequency.

| GAIN position | R_f total | loop gain | what happens |
|---|---|---|---|
| 10 % | 280 kΩ | 28 | the nudge rings at about 660 Hz and dies away: ±0.12 V after 10 ms, ±0.003 V after 140 ms |
| 50 % (start) | 320 kΩ | 32 | the ring grows: ±0.66 V after 10 ms, ±5.9 V after 40 ms, then the output clips at ±9 V; about 626 Hz |
| 100 % | 370 kΩ | 37 | grows faster and clips within 40 ms; about 593 Hz |

- **The threshold is 29:** below it every swing is smaller than the last, above it every swing is bigger.
- **Just above 29 is the cleanest sine:** the more gain, the sooner and harder the output runs into its limits and the more the wave turns into a flattened square. The clipping also pulls the frequency a little below 650 Hz.

## What this verifies
1. Three RC sections give 180° of phase shift at one frequency, f = 1 / (2π·R·C·√6), with a loss of 1/29.
2. A loop oscillates when its total phase is 360° and its gain is at least 1 (the Barkhausen condition): here, amplifier gain ≥ 29.

```assert
net r1.b V 0.00 +-0.01
```
