# lab-npn-horn-follower — expected behaviour

## Circuit
- 9 V battery.
- Tone oscillator: two NPN transistors as an astable multivibrator: 1 kΩ collector resistors, 22 nF cross-coupling capacitors, 47 kΩ base resistor on Q1.
- HIGH button: puts a second 47 kΩ beside Q1's base resistor.
- Slide switch: Q2's base resistor is 47 kΩ (left, as authored) or 22 kΩ (right).
- Q2's collector → 100 nF → 47 kΩ → +IN of an LM386; 47 kΩ from +9 V to +IN (against the chip's own input resistance to ground it holds +IN near the middle of the supply).
- LM386 as a follower: −IN tied to the output (pin 5), gain pins 1/8 and the bypass pin open. Output → 220 µF (+) → loudspeaker (8 Ω) → ground.

## Observable behaviour
- A steady horn tone of about 670 Hz from switch-on.
- HIGH held: the pitch jumps up to about 890–900 Hz; let go and it drops back: a two-tone horn.
- Slide switch right: about 910 Hz; with HIGH held as well, about 1380 Hz.
- The amplifier does not amplify the voltage: its output swing is the same as the swing arriving at +IN (gain about one). It only supplies the current the 8 Ω speaker needs.

## Measured on the engine
Speaker pitch 6 ms after switch-on:

| HIGH | slide switch | pitch |
|---|---|---|
| up | left (47 kΩ) | 669 Hz |
| held | left | 889–906 Hz |
| up | right (22 kΩ) | 912 Hz |
| held | right | 1380 Hz |

Swing over 2 ms (as authored): +IN 3.04 – 6.19 V (3.15 V), output 3.20 – 6.26 V (3.06 V): gain 0.97. Peak speaker current about 0.17 A.

## What this verifies
1. Two cross-coupled transistors make the tone; each half-period is set by a base resistor and a coupling capacitor, so a smaller resistor (button or slide switch) gives a higher pitch.
2. An LM386 with its − input tied to its output is a voltage follower: unity gain, but a low-resistance output that can drive a loudspeaker the transistor oscillator could not.

## Simulation notes
`test/lab-circuits-r6g.test.mjs` reads the speaker's pitch in all four settings and the input and output swing of the follower.

```assert
# t = 1 ms: Q2 conducting, Q1 cut off by its coupling capacitor; the follower's output sits at its input.
net npn_4.collector V 0.122 +-0.05
net npn_3.collector V 8.999 +-0.01
net lm386_18.inp V 3.029 +-0.08
net lm386_18.vout V 3.175 +-0.08
net lm386_18.inn V 3.175 +-0.08
```

<!-- engine-provenance -->
> **Engine provenance.** The measured numbers on this page were last held against
> `bw-board@de8083c` and `bw-circuit-ui@ee2b412` — the revisions pinned in
> `test/fixtures/siblings.json`. `test/expected-quantities-hold.test.mjs` compares
> **13 of this page's 31** numeric claims against that engine
> (0 of them disagreeing) and declines the rest with a stated reason;
> `node scripts/expected-claim-census.mjs lab-npn-horn-follower` prints them one by one.
<!-- engine-provenance -->
