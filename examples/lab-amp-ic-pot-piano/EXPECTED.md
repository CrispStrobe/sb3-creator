# lab-amp-ic-pot-piano — expected behaviour

## Circuit
- 9 V battery.
- LM386 as a relaxation oscillator (gain pins 1/8 and the bypass pin open): 47 kΩ with 1 nF across it from the output to +IN, 100 kΩ from +9 V to +IN (against the chip's own input resistance to ground: two switching levels on +IN).
- Timing path from the output: KEY button → RANGE slide switch (2.2 kΩ left, as authored; 470 Ω right) → TUNE pot (10 kΩ as a rheostat, wiper at 1/2) → −IN, where 100 nF sits to ground. The OCTAVE slide switch puts a second 100 nF beside it.
- Output → 47 µF (+) → 47 Ω → loudspeaker (8 Ω) → ground.

## Observable behaviour
- KEY up: silence; the output rests high (8.1 V) and the timing capacitor is empty.
- KEY held: a note. TUNE changes it: from about 500 Hz (all 10 kΩ in) upward as the knob turns.
- OCTAVE: the same knob setting an octave lower.
- RANGE right (470 Ω): the knob's sweep reaches much higher notes; at the other end of the knob it changes less.

## Measured on the engine
Pitch from the output's edges 4 – 14 ms after the key goes down:

| RANGE | OCTAVE | TUNE | pitch |
|---|---|---|---|
| 2.2 kΩ | off | 0 (10 kΩ in) | 500 Hz |
| 2.2 kΩ | off | 1/2 | 851 Hz |
| 2.2 kΩ | off | 1 (no pot) | 2685 Hz |
| 2.2 kΩ | on | 0 | 249 Hz |
| 2.2 kΩ | on | 1 | 1359 Hz |
| 470 Ω | off | 0 | 588 Hz |
| 470 Ω | off | 1/2 | 1110 Hz |
| 470 Ω | off | 1 | 9.1 kHz |

The knob's full sweep spans a factor of 5.4 with 2.2 kΩ and of 15.5 with 470 Ω.

## What this verifies
1. An LM386 with positive feedback (to +IN) and an RC to −IN is a relaxation oscillator; its period is proportional to the timing resistance and capacitance.
2. Doubling the capacitance halves the pitch: an octave.
3. A fixed resistor in series with the pot sets the top note; the smaller it is, the wider the range the pot covers.
4. Interrupting the timing path stops the oscillation: a note key.

## Simulation notes
`test/lab-circuits-r6g.test.mjs` holds the key in five settings and times the output's edges; the 2685 Hz, 1359 Hz and 9.1 kHz rows were measured the same way when the bench was built (they cost many amplifier flips, so the test leaves them out).

```assert
# t = 1 ms, key up: output parked high, +IN at its upper switching level, timing capacitor empty.
net lm386_3.vout V 8.075 +-0.05
net lm386_3.inp V 5.106 +-0.05
net lm386_3.inn V 0.000 +-0.01
```

<!-- engine-provenance -->
> **Engine provenance.** The measured numbers on this page were last held against
> `bw-board@b094eb2` and `bw-circuit-ui@0b594d6` — the revisions pinned in
> `test/fixtures/siblings.json`. `test/expected-quantities-hold.test.mjs` compares
> **14 of this page's 40** numeric claims against that engine
> (0 of them disagreeing) and declines the rest with a stated reason;
> `node scripts/expected-claim-census.mjs lab-amp-ic-pot-piano` prints them one by one.
<!-- engine-provenance -->
