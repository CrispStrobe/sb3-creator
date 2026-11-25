# lab-amp-light-organ — expected behaviour

## Circuit
- 9 V supply. The function generator is the music player: a sine of 150 mV amplitude at 80 Hz as built; the learner changes its frequency.
- It reaches the LM386's + input through 1 µF (− input grounded, pins 1 and 8 open: gain 20).
- Treble path: 22 nF from the output into 10 kΩ to ground, 4.7 kΩ into an NPN whose collector lights a blue LED through 470 Ω.
- Bass path: 2.2 µF from the output, then 1 kΩ into 1 µF to ground (4.7 kΩ to ground keeps the DC level at 0 V), 4.7 kΩ into a second NPN with a red LED and 470 Ω.

## Observable behaviour
- The amplifier output swings about 6 V pp around half the supply.
- 80 Hz: red glows (mean 3.8 mA), blue dark. 1.5 kHz: blue glows (mean 3.6 mA), red dark. In between both glow partly.

## Measured on the engine
bw-board d4113b4b, `test/lab-circuits-r6h.test.mjs`: output 5.98 V pp at 80 Hz and 5.99 V pp at 1.5 kHz; at 80 Hz bass LED 3.751 mA mean, treble 0; at 1.5 kHz treble 3.608 mA, bass 0.

## What this verifies
1. The power amplifier provides the input gain of 20 (0.3 V pp in, 6 V pp out) that lifts music above the transistors' 0.7 V threshold.
2. An RC high-pass and an RC low-pass split one signal into two bands.

## Simulation notes
The scenario test plays 80 Hz and 1.5 kHz. The 2.2 µF in the bass path starts empty at switch-on, so for the first 20–30 ms the bass LED flashes regardless of the music; the test lets it settle for 40 ms (30 ms at 1.5 kHz) before measuring.

```assert
# 1 ms after switch-on (the solve assert-physics runs): gain 20 about half the supply
net lm386_5.inp V 0.071 +-0.01
net lm386_5.vout V 5.93 +-0.2
net capacitor_12.b V 4.58 +-0.2
```

<!-- engine-provenance -->
> **Engine provenance.** The measured numbers on this page were last held against
> `bw-board@e744ede` and `bw-circuit-ui@3084f35` — the revisions pinned in
> `test/fixtures/siblings.json`. `test/expected-quantities-hold.test.mjs` compares
> **13 of this page's 38** numeric claims against that engine
> (0 of them disagreeing) and declines the rest with a stated reason;
> `node scripts/expected-claim-census.mjs lab-amp-light-organ` prints them one by one.
<!-- engine-provenance -->
