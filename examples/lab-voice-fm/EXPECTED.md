# lab-voice-fm — expected behaviour

## Circuit
- 9 V supply. A small 8 Ω loudspeaker (`speaker_3`) is used as a microphone: it sits across the +IN input of an LM386 and ground. The LM386 runs at gain 200 (10 µF across pins 1 and 8).
- The amplifier output reaches the control pin of a 555 astable (1 kΩ, 10 kΩ, 100 nF) through 1 µF. The 555 drives a piezo through 220 Ω.
- The speaker hears a sustained vowel ("aaah", fundamental 150 Hz) at 94 dB SPL, about what reaches a speaker held right at your mouth. The **Sound** slider in the instruments column sets the level.

## Observable behaviour
- Silent (slider at 0): a steady tone of about 680 Hz. Successive periods agree within half a percent.
- Speaking at 94 dB: the average pitch stays about 680 Hz, but each period is now a few percent longer or shorter: the periods scatter with a standard deviation of about 3 %, the extremes at about −8 % and +7 %. At 100 dB the extremes reach ±15 %.
- The cone turns about half a millivolt per pascal into voltage (1 Pa = 94 dB): the voice arrives at the LM386 as a few tenths of a millivolt and leaves it at a few hundred millivolts, enough to push the 555's comparator thresholds up and down.

## Measured on the engine
bw-board r4/transducers-20261123, `test/lab-circuits-8.test.mjs`: the 555 periods from the piezo's tone edges, 15 to 45 ms after switch-on.

| sound at the speaker | frequency | period spread (sd) |
|---|---|---|
| silent | 680 Hz | 0.4 % |
| 94 dB vowel | 682 Hz | 3.3 % |

## What this verifies
1. A loudspeaker is also a microphone: sound moving the cone induces a voltage in its coil.
2. A voltage on the 555's control pin changes its frequency: the voice frequency-modulates the tone.

## Simulation notes
The sound is a model: a vowel built from harmonics of 150 Hz with two formant humps, and the speaker's sensitivity is an order-of-magnitude value (0.5 mV/Pa), flat across the audio band.

```assert
# power-on: supply, the LM386's bias divider, the speaker's DC path to ground
net vsource_2.pos V 9.00 +-0.01
net lm386_4.bypass V 4.50 +-0.05
net lm386_4.inp V 0.00 +-0.01
```

<!-- engine-provenance -->
> **Engine provenance.** The measured numbers on this page were last held against
> `bw-board@818e026` and `bw-circuit-ui@659431c` — the revisions pinned in
> `test/fixtures/siblings.json`. `test/expected-quantities-hold.test.mjs` compares
> **8 of this page's 21** numeric claims against that engine
> (0 of them disagreeing) and declines the rest with a stated reason;
> `node scripts/expected-claim-census.mjs lab-voice-fm` prints them one by one.
<!-- engine-provenance -->
