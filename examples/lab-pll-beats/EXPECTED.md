# lab-pll-beats — expected behaviour

## Circuit
- 9 V supply. A two-transistor astable (`npn_5`, `npn_6`; 1 kΩ, 47 nF, 22 kΩ and 20 kΩ base resistors) runs at a fixed pitch of about 700 Hz.
- A 4046 (`cd4046_11`) used as a VCO (R1 = 100 kΩ, R2 = 47 kΩ, C1 = 10 nF); a 10 kΩ tune potentiometer (`potentiometer_12`) sets VCO_IN: 782 Hz at half.
- Each oscillator reaches one input of an LM386 (`lm386_22`, 1 µF on BYPASS) through 100 kΩ and 1 µF, with 1 kΩ and 10 nF to ground: the amplifier's output is the difference of the two square waves. 220 µF couples it to the speaker.

## Observable behaviour
- The two tones together swell and fade: while they are in step the difference is zero and the sound fades, half a beat later they are opposite and it is loudest.
- The rate of swelling is the difference of the two frequencies (about 80 times a second as built). Turning the tune pot towards the astable's pitch slows it down; at equal pitch it stops.

## Measured on the engine
bw-board f4aaec43 / bw-circuit-ui 141b2cc, `test/lab-circuits-r6f.test.mjs`, amplifier output peak to peak in 1.2 ms windows over 30 ms.

| | value |
|---|---|
| astable | 699 Hz |
| VCO, pot at half | 782 Hz |
| loudest 1.2 ms window, peak to peak | 3.56 V |
| quietest window | 1.76 V |

## What this verifies
1. Two tones of nearly equal pitch drift in and out of step; adding (or subtracting) them gives a sound that swells and fades at the difference frequency.
2. Tuning one oscillator until the beat disappears is how instruments are tuned against each other, and how a beat-frequency receiver finds a station.

```assert
# t = 1 ms: VCO_IN from the tune pot at half
net cd4046_11.vco_in V 4.50 +-0.01
net cd4046_11.r2 V 4.50 +-0.02
```

<!-- engine-provenance -->
> **Engine provenance.** The measured numbers on this page were last held against
> `bw-board@0f6b38a` and `bw-circuit-ui@42aaddc` — the revisions pinned in
> `test/fixtures/siblings.json`. `test/expected-quantities-hold.test.mjs` compares
> **17 of this page's 24** numeric claims against that engine
> (0 of them disagreeing) and declines the rest with a stated reason;
> `node scripts/expected-claim-census.mjs lab-pll-beats` prints them one by one.
<!-- engine-provenance -->
