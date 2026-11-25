# lab-amp-ic-light-organ — expected behaviour

## Circuit
- 9 V battery.
- Microphone: a loudspeaker (8 Ω) hearing the music (its Sound slider plays a sung vowel; as authored the room is quiet).
- Preamp: NPN Q1, 10 kΩ collector resistor, 1 MΩ from collector to base, input from the microphone through 100 nF. Its output goes through 1 µF to the top of the SENSITIVITY pot (10 kΩ, wiper at 1/2, bottom to ground).
- Slide switch (PREAMP): left (as authored) connects the microphone straight to +IN of the LM386; right connects the pot's wiper instead.
- LM386: −IN grounded, 10 µF across the gain pins 1 and 8 (gain 200), bypass pin open.
- LED driver: output → 2.2 µF (+) → 1 kΩ → base of NPN Q2 (10 kΩ base to ground); a 1N4148 from ground to the capacitor's − side. Q2's collector: red LED and 470 Ω to +9 V.

## Observable behaviour
- Quiet room: amplifier at half the supply, LED dark.
- Slide switch left (no preamp): music at 80 dB gives the amplifier only a few tens of millivolts: LED dark. Very loud music (110 dB, right at the speaker) flashes the LED on its peaks.
- Slide switch right (preamp): 80 dB is enough; the LED flickers with the music. Turning SENSITIVITY down (0.1) puts it out again.

## Measured on the engine
A 440 Hz tone at the microphone (a steady note of music; the scenario picks this waveform); amplifier output range over 5 ms and LED current over 10 ms, 30 ms after the sound starts:

| path | sound | pot | amplifier output | LED mean | LED peak |
|---|---|---|---|---|---|
| direct | quiet | – | 4.50 V | 0 mA | 0 mA |
| direct | 80 dB | – | 4.47 – 4.53 V | 0 mA | 0 mA |
| direct | 110 dB | – | 3.64 – 5.36 V | 3.74 mA | 15.0 mA |
| preamp | 80 dB | 1/2 | 3.42 – 5.79 V | 6.23 mA | 15.1 mA |
| preamp | 80 dB | 0.1 | 4.28 – 4.78 V | 0 mA | 0 mA |

With the slider's own sung vowel instead of the tone (LED over 10 ms): direct 80 dB 0 mA; direct 110 dB mean 5.53 mA; preamp 80 dB, pot 1/2 mean 8.68 mA.

## What this verifies
1. A loudspeaker works as a microphone, and an LM386 with a capacitor across its gain pins amplifies its millivolts 200 times.
2. The coupling capacitor and the diode let Q2 see only the positive peaks: the LED lights only when the amplified sound exceeds about 0.7 V.
3. A transistor preamp ahead of the amplifier lets ordinary music do what only shouting could do before; the pot sets how much of it gets through.

## Simulation notes
`test/lab-circuits-r6g.test.mjs` sets the slide switch, the pot and the microphone's sound level and reads the amplifier's output range and the LED current.

```assert
# t = 1 ms, quiet: amplifier at half supply, +IN on the microphone's coil (0 V), the preamp still starting.
net lm386_11.vout V 4.504 +-0.02
net lm386_11.inp V 0.000 +-0.01
net npn_5.collector V 4.695 +-0.15
net polarized_cap_13.neg V 3.126 +-0.15
```

<!-- engine-provenance -->
> **Engine provenance.** The measured numbers on this page were last held against
> `bw-board@d4113b4` and `bw-circuit-ui@0b594d6` — the revisions pinned in
> `test/fixtures/siblings.json`. `test/expected-quantities-hold.test.mjs` compares
> **12 of this page's 37** numeric claims against that engine
> (0 of them disagreeing) and declines the rest with a stated reason;
> `node scripts/expected-claim-census.mjs lab-amp-ic-light-organ` prints them one by one.
<!-- engine-provenance -->
