# lab-mixer-strobe — expected behaviour

## Circuit
- 6 V. Mains hum from a wire near a mains cable (field probe, 5 pF at the closest, knob 0.5) through 100 nF into a transistor amplifier (1 MΩ from collector to base, 10 kΩ load), then through 1 µF into a second, squaring stage (220 kΩ, 4.7 kΩ): a 50 Hz square wave.
- That square wave through 10 kΩ into the mixer IC's input A; input B through 4.7 kΩ on a 10 k / 10 k half-supply divider.
- An LM386 relaxation oscillator (output → 150 nF → +IN, 15 kΩ plus the RATE pot of 20 kΩ to ground): about 44 Hz at RATE 0, up to about 78 Hz. Its output switches the mixer's LO pin through 4.7 kΩ.
- 22 µF across each output's load smooths the product. A voltmeter between the two outputs (B to A) shows which way the current is steered.

## Observable behaviour
- The product of two square waves at nearly the same frequency, smoothed, is a slow triangle at their difference frequency: at RATE 0 (oscillator ~44 Hz, mains 50 Hz) the outputs swing about six times a second, and the voltmeter's reading swings from about −0.7 V to +0.7 V and back.
- Turning RATE towards the mains frequency slows the swinging down to zero beat; past it it speeds up again.

## Measured on the engine
bw-board (sa612 tanh·tanh law, field probe at the mains' 50 Hz), `test/lab-circuits-r7mix.test.mjs`, RATE 0, 150 ms to settle, then 350 ms every 5 ms: oscillator 44 Hz, mains 50.3 Hz, output A minus B swinging −0.73 … +0.73 V at their difference.

## What this verifies
1. A mixer's output contains the difference of its two input frequencies.
2. A beat slows a fast difference down to something the eye can follow (a stroboscope).

```assert
# input B on the half-supply divider against the chip's input bias
net sa612_13.in_b V 1.597 +-0.02
```

<!-- engine-provenance -->
> **Engine provenance.** The measured numbers on this page were last held against
> `bw-board@9de91e3` and `bw-circuit-ui@3084f35` — the revisions pinned in
> `test/fixtures/siblings.json`. `test/expected-quantities-hold.test.mjs` compares
> **15 of this page's 29** numeric claims against that engine
> (0 of them disagreeing) and declines the rest with a stated reason;
> `node scripts/expected-claim-census.mjs lab-mixer-strobe` prints them one by one.
<!-- engine-provenance -->
