# lab-ir-music-link — expected behaviour

## Circuit
- 9 V supply. The function generator stands in for a music player (440 Hz, 50 mV). Through 10 µF it reaches the LM386's + input (gain 20, pins 1 and 8 open), which adds it to its half-supply output.
- 150 Ω from the output feed the IR LED: about 21 mA at rest, more and less with the music — its brightness follows the waveform.
- Receiver across the light path (20 cm as built): a phototransistor with 10 kΩ to +9 V, 100 nF into a common-emitter NPN (10 kΩ collector, 2.2 kΩ emitter, 1 MΩ from collector to base), an emitter follower (4.7 kΩ) and a magnetic earphone through 1 µF.

## Observable behaviour
- The amplifier output swings ±1 V around 4.5 V; the LED current follows it.
- The earphone plays the 440 Hz, and half the music amplitude gives half the earphone amplitude: the light carries the waveform, not just on and off.

## Measured on the engine
bw-board f4aaec43, `test/lab-circuits-r6c.test.mjs` (after 60 ms): 50 mV in: output 2.00 V pp, earphone 0.835 V pp at 440.0 Hz; 25 mV in: 1.00 V pp and 0.418 V pp.

## What this verifies
1. Analog intensity modulation of an LED.
2. A linear receiver reproduces the waveform in proportion.

## Simulation notes
The coupling capacitors settle in about 60 ms; the test listens after that.

```assert
# 1 ms after switch-on (the solve assert-physics runs)
net lm386_5.vout V 4.87 +-0.03
net phototransistor_9.collector V 6.28 +-0.05
```

<!-- engine-provenance -->
> **Engine provenance.** The measured numbers on this page were last held against
> `bw-board@f4aaec4` and `bw-circuit-ui@141b2cc` — the revisions pinned in
> `test/fixtures/siblings.json`. `test/expected-quantities-hold.test.mjs` compares
> **11 of this page's 26** numeric claims against that engine
> (0 of them disagreeing) and declines the rest with a stated reason;
> `node scripts/expected-claim-census.mjs lab-ir-music-link` prints them one by one.
<!-- engine-provenance -->
