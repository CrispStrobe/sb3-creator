# lab-pll-sound-machine — expected behaviour

## Circuit
- 9 V supply. A 4046 VCO (`cd4046_5`: R1 = 47 kΩ, R2 = 220 kΩ, C1 = 10 nF) drives a piezo through 1 kΩ. Its VCO_IN gets the pitch pot (`potentiometer_3`, 10 kΩ) through 22 kΩ.
- An LM386 (`lm386_11`, pins 1 and 8 joined) is a slow relaxation oscillator: 1 MΩ from +9 V and 1 MΩ from its output on the + input, 220 kΩ and 470 nF from its output on the − input. Its square wave (about 45 Hz) is the modulator.
- One half of an LM358 (`lm358_16`) integrates the square wave into a triangle: 47 kΩ in, 220 nF feedback with 1 MΩ across it, + input at half the supply (10 kΩ / 10 kΩ).
- A slide switch (`slide_switch_23`) picks the square (left) or the triangle (right); the modulation switch (`switch_22`) adds it to VCO_IN through 47 kΩ.

## Observable behaviour
- Modulation off: one steady tone (about 650 Hz with the pot at half).
- Square: the pitch jumps between two tones, about 500 Hz and 790 Hz, 45 times a second: a warble.
- Triangle: the pitch glides up and down between about 470 and 710 Hz: a wailing siren.

## Measured on the engine
bw-board f4aaec43 / bw-circuit-ui 141b2cc, `test/lab-circuits-r6f.test.mjs`, the VCO frequency read once per millisecond for 30 ms.

| modulation | lowest | highest |
|---|---|---|
| square | 500 Hz | 793 Hz |
| triangle | 473 Hz | 706 Hz |

## What this verifies
1. Adding a changing voltage to a VCO's control input modulates its frequency (FM).
2. The shape of the modulating voltage is heard: a square gives two alternating tones, a triangle a continuous glide. An integrator turns one into the other.

## Simulation notes
The modulator runs fast (about 45 Hz) so a scenario shows several of its cycles in tens of milliseconds; on a real bench you would slow it down with a larger capacitor to hear it better.

```assert
# t = 1 ms, modulation off: VCO_IN is the pot at half
net cd4046_5.vco_in V 4.50 +-0.01
net vsource_2.pos V 9.00 +-0.01
```

<!-- engine-provenance -->
> **Engine provenance.** The measured numbers on this page were last held against
> `bw-board@b094eb2` and `bw-circuit-ui@0b594d6` — the revisions pinned in
> `test/fixtures/siblings.json`. `test/expected-quantities-hold.test.mjs` compares
> **18 of this page's 29** numeric claims against that engine
> (0 of them disagreeing) and declines the rest with a stated reason;
> `node scripts/expected-claim-census.mjs lab-pll-sound-machine` prints them one by one.
<!-- engine-provenance -->
