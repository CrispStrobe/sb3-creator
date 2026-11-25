# lab-tone-control — expected behaviour

## Circuit
- 9 V supply; op-amp 4 of an LM324 buffers 4.5 V (10 kΩ / 10 kΩ) as the reference for the tone stage.
- Two signal generators stand for the music: a 100 Hz **bass note** and a 5 kHz **treble note**, each 0.5 V amplitude around 4.5 V, mixed through 10 kΩ each and buffered by op-amp 1.
- Tone stage (op-amp 2, + input on the reference), the classic two-network ("Baxandall") control: **BASS**: 10 kΩ, a 100 kΩ pot, 10 kΩ from the input to the output, each half of the pot bridged by 22 nF, the wiper through 10 kΩ to the − input. **TREBLE**: 4.7 nF, a 100 kΩ pot, 4.7 nF from the input to the output, the wiper straight to the − input.
- The output reaches a crystal earphone through 10 µF; the oscilloscope shows input and output.

## Observable behaviour
- Both pots in the middle: both notes pass at the same level.
- BASS turned up: the 100 Hz note about five times louder; turned down, a fifth. The 5 kHz note does not change.
- TREBLE turned up: the 5 kHz note about ten times louder; turned down, about a quarter.

## Measured on the engine
`test/lab-circuits-r6e.test.mjs`, output over input (peak-to-peak), one note at a time: 100 Hz flat 1.00, BASS up 4.89, down 0.205; 5 kHz flat 1.00, TREBLE up 9.66, down 0.282; with BASS up the 5 kHz gain stays 1.00.

## What this verifies
1. Capacitors make the feedback depend on frequency: at 100 Hz the 22 nF are nearly open and the bass pot sets the gain; at 5 kHz they short the bass pot out and the 4.7 nF let the treble pot take over.
2. An inverting op-amp stage with a pot between its input and feedback network can lift or cut, with "flat" in the middle.

## Simulation notes
Each note is measured alone (the other generator's amplitude set to zero in the test).

```assert
# the reference, and the tone stage's output sitting on it
net lm324_7.4_out V 4.50 +-0.01
```

<!-- engine-provenance -->
> **Engine provenance.** The measured numbers on this page were last held against
> `bw-board@9de91e3` and `bw-circuit-ui@3084f35` — the revisions pinned in
> `test/fixtures/siblings.json`. `test/expected-quantities-hold.test.mjs` compares
> **14 of this page's 28** numeric claims against that engine
> (0 of them disagreeing) and declines the rest with a stated reason;
> `node scripts/expected-claim-census.mjs lab-tone-control` prints them one by one.
<!-- engine-provenance -->
