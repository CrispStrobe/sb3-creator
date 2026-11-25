# lab-barcode-pen — expected behaviour

## Circuit
- 9 V supply. A red LED (`led_4`, 470 Ω) and a phototransistor (`phototransistor_5`, 10 kΩ on its emitter) look at the paper side by side, 5 mm above it (`light_path_23`, reflect, white paper). The light path's knob is how much of the light spot lies on a black bar (0 = white paper, 1 = all black).
- NPN 1 (`npn_8`, 10 kΩ base) turns on while the paper reflects; its collector (4.7 kΩ to +9 V) drives NPN 2 (`npn_11`, 10 kΩ base), which lights the yellow bar LED (`led_13`, 1 kΩ) over a bar.
- An LM386 (`lm386_16`, pins 1 and 8 joined) is a relaxation oscillator: 1 MΩ from +9 V and 1 MΩ from the output set its + input, 220 kΩ and 56 nF from the output its − input. NPN 3 (`npn_15`, 10 kΩ base) shorts the 56 nF while the paper reflects. 220 µF couples the output to the speaker.

## Observable behaviour
- White paper: bar LED dark, silent.
- Black bar under the pen: bar LED on and a tone of about 410 Hz.
- Back on white: silent again. Sliding the knob back and forth over a pattern reads it as LED flashes and beeps, like a Morse reader.

## Measured on the engine
bw-board f4aaec43 / bw-circuit-ui 141b2cc, `test/lab-circuits-r6f.test.mjs`, values at about the stated settings (a sequence or a waveform swing, which no single solve stands in for).

| paper | bar LED | oscillator output swing | tone |
|---|---|---|---|
| white | 1.19 V (dark) | 0.019 V | — |
| black bar | 1.92 V (lit) | 7 V | 413 Hz |
| white again | dark | 0.009 V | — |

## What this verifies
1. White paper reflects the LED's light, a black bar absorbs it: reflection is how bar-code readers see.
2. Transistors as switches turn the light level into logic: one inverts, one drives the LED, one stops the oscillator.

## Simulation notes
A bar in the spot is modelled as the share of the reflected light it absorbs (the `blocked` knob of a reflecting light path); a black dye would still reflect a few per cent, which this leaves out.

```assert
# t = 1 ms, white paper: NPN 1 on, bar LED off
net npn_8.collector V 0.05 +-0.05
net vsource_2.pos V 9.00 +-0.01
```

<!-- engine-provenance -->
> **Engine provenance.** The measured numbers on this page were last held against
> `bw-board@d4113b4` and `bw-circuit-ui@0b594d6` — the revisions pinned in
> `test/fixtures/siblings.json`. `test/expected-quantities-hold.test.mjs` compares
> **16 of this page's 23** numeric claims against that engine
> (0 of them disagreeing) and declines the rest with a stated reason;
> `node scripts/expected-claim-census.mjs lab-barcode-pen` prints them one by one.
<!-- engine-provenance -->
