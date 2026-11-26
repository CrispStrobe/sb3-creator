# lab-skywave — expected behaviour

## Circuit
- The medium-wave superhet of lab-superhet, unchanged in its parts (ferrite-rod aerial tank, MOSFET RF stage, mixer IC with its Colpitts oscillator, 455 kHz IF coil, NPN IF amplifier, germanium detector, LM386 and loudspeaker; 6 V; the "Low IF" and "Loose" switches at rest).
- The aerial knob at 0.384 and the oscillator knob at 0.06: tuned to 702 kHz (oscillator about 1160 kHz).
- The antenna carries a clock: its dial is the hour of the day (0 = midnight, 0.5 = noon), authored at noon.
- Broadcast: the local stations on 612 kHz and 810 kHz (ground wave only) and a distant station on 702 kHz (700 Hz tone): ground wave 2 µV/m, sky wave 1 mV/m after dark.

## Observable behaviour
- At noon (dial 0.5) the distant station is barely there: a few millivolts in the IF, a faint tone.
- At 22:00 (dial 0.92) it comes in strongly: the IF carries a hundred times more and the tone is clearly louder (less than a hundred times: the IF stage clips on the strong signal).
- Around 18:00 the change happens over about two hours of the dial (twilight).

## How the sky wave is modelled
Each station may carry a sky-wave field besides its ground wave. The receiver sees ground wave + sky wave × the night share of the hour on the antenna's clock: 0 by day, 1 at night, a smooth twilight from 17:00 to 19:00 and from 05:00 to 07:00. By day the lowest layer of the ionosphere, ionised by the sun, absorbs medium waves on their way up; after sunset it fades and the waves are reflected by higher layers, coming down hundreds of kilometres away. Not modelled: fading (two paths beating), seasons and latitude (sunset fixed at 18:00), the dependence on frequency and distance (each station states its own night field).

## Measured on the engine
`test/lab-circuits-r11.test.mjs`, 2 ms after setting the dial, then 2 ms of detector audio: IF at 457 kHz 2.5 mV at noon, 0.41 V at 22:00 (164×); the 700 Hz tone at the detector 3.8 mV and 18 mV.

## What this verifies
1. A station's received strength follows its field: the IF carries the sky wave's hundredfold field almost in proportion until the IF stage clips.
2. Distant medium-wave stations come in after dark.

```assert
# supply; the mixer's input bias (0.23 of the supply); the LM386's -IN on ground
net vsource_2.pos V 6.00 +-0.01
net sa612_16.in_b V 1.38 +-0.03
net lm386_38.inn V 0.00 +-0.01
```

<!-- engine-provenance -->
> **Engine provenance.** The measured numbers on this page were last held against
> `bw-board@0f6b38a` and `bw-circuit-ui@42aaddc` — the revisions pinned in
> `test/fixtures/siblings.json`. `test/expected-quantities-hold.test.mjs` compares
> **0 of this page's 17** numeric claims against that engine
> (0 of them disagreeing) and declines the rest with a stated reason;
> `node scripts/expected-claim-census.mjs lab-skywave` prints them one by one.
<!-- engine-provenance -->
