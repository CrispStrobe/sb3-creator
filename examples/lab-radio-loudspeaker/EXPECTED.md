# lab-radio-loudspeaker — expected behaviour

## Circuit
- The crystal set's front end: antenna on the ferrite coil's tap, cold end and earth on ground, tuning capacitor across the coil (authored at 0.50, the 612 kHz station), a germanium diode into 47 kΩ ‖ 2.2 nF.
- 9 V battery and an LM386 audio amplifier (gain 20: pins 1 and 8 open, bypass open, −IN on ground).
- The detector output reaches +IN through 100 nF, which blocks the detector's DC level.
- The output drives an 8 Ω loudspeaker through 220 µF.

## Observable behaviour
- The local station's 400 Hz tone from the loudspeaker at nearly full loudness: about 0.25 A rms through the voice coil, the current its 0.5 W rating allows (level about 0.98 of 1).
- Knob at 0.10: the far 1215 kHz station's 1 kHz tone, clearly quieter. The detector's DC level drops with the weaker carrier, and the coupling capacitors take a while to follow, so its loudness keeps falling for a little while after the turn (about 0.08 A rms 60 ms after it).
- The 810 kHz station near 0.265 alternates 600 Hz and 900 Hz.

## Why a loudspeaker needs an amplifier
A crystal earphone is a tiny capacitor that needs almost no power. A loudspeaker is an 8 Ω coil that needs a fraction of a watt, thousands of times more than an antenna can collect. The detector still only recovers the sound; the LM386 takes its power from the battery and copies the detector's few tenths of a volt twenty times larger onto the loudspeaker. The 220 µF blocks the LM386's half-supply output level so no steady current flows through the coil.

## Measured on the engine
bw-board 0bc7baf, `test/lab-circuits-7.test.mjs`: after 30 ms at 0.50, 400 Hz, 0.245 A rms, level 0.98; then 60 ms at 0.10, 1 kHz, 0.130 A rms and still falling.

```assert
# -IN on ground, the LM386's internal bias divider at half the supply, the top
# of the tank at ground for DC (the coil shorts it)
net lm386_12.inn V 0.00 +-0.01
net lm386_12.bypass V 4.50 +-0.02
net ferrite_coil_6.b V 0.00 +-0.01
```

<!-- engine-provenance -->
> **Engine provenance.** The measured numbers on this page were last held against
> `bw-board@de8083c` and `bw-circuit-ui@ee2b412` — the revisions pinned in
> `test/fixtures/siblings.json`. `test/expected-quantities-hold.test.mjs` compares
> **6 of this page's 25** numeric claims against that engine
> (0 of them disagreeing) and declines the rest with a stated reason;
> `node scripts/expected-claim-census.mjs lab-radio-loudspeaker` prints them one by one.
<!-- engine-provenance -->
