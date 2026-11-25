# lab-amp-timbre — expected behaviour

## Circuit
- 9 V supply. An LM386 (`lm386_3`, gain 20, pins 1, 7 and 8 open) oscillates: 47 nF from its output back to +IN, 22 kΩ from +IN to ground, −IN grounded.
- The output reaches the 8 Ω speaker (`speaker_12`) through 100 µF and a 47 Ω series resistor (`resistor_7`).
- Button `button_8` ("bright") puts 22 µF across the 47 Ω. Button `button_10` ("soft") puts 220 µF across the speaker.
- The scope's channel 1 is on the amplifier side of the 47 Ω, channel 2 on the speaker.

## Observable behaviour
- About 189 Hz in all three cases: the filters do not touch the oscillator.
- Plain: a square wave at the speaker, about 0.54 V rms.
- Bright: about twice the voltage at the speaker (1.1 V rms), the square wave's edges kept.
- Soft: the edges are gone; the speaker's waveform is close to a sine (its slope-to-amplitude ratio about 1.1, against about 30 for the square wave).

## Measured on the engine
bw-board f4aaec43, `test/lab-circuits-r7a.test.mjs` (speaker voltage sampled every 40 µs over two periods).

## What this verifies
1. Timbre is set by the harmonics; a filter after the oscillator changes the harmonics and not the pitch.
2. A capacitor across a series resistor is a high-pass path, one across the load a low-pass.

## Simulation notes
The LM386 model swings within about 1 V of its rails. The speaker is a resistance with its coil inductance; its cone resonance is not modelled.

```assert
# power-on: supply and the LM386's bias divider
net vsource_2.pos V 9.00 +-0.01
net lm386_3.bypass V 4.50 +-0.05
```

