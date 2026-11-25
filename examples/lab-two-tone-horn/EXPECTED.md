# lab-two-tone-horn — expected behaviour

## Circuit
- 9 V supply. A slow astable (op-amp 1 of an LM324: three 100 kΩ thresholds, 100 kΩ into 4.7 µF) changes over every few tenths of a second.
- Its output moves a divider (12 kΩ from the output, 10 kΩ from +9 V, 33 kΩ to ground) between two voltages; op-amp 2, a follower, hands that through the **SOUND** switch to the base resistors (47 kΩ) of a transistor multivibrator (two NPN, 1 kΩ collectors, 22 nF cross capacitors). 100 kΩ to ground behind the switch: open, the transistors get no base current and stay silent.
- 470 Ω and 47 µF couple the tone into an 8 Ω loudspeaker.

## Observable behaviour
- Two pitches in turn, 770 Hz and 627 Hz, a step of about a major third.

## Measured on the engine
`test/lab-circuits-r6e.test.mjs`: first pitch 770 Hz (base return 7.14 V); the slow astable changes over at 630 ms (watched with SOUND off); second pitch 627 Hz (base return 4.22 V); ratio 1.23.

## What this verifies
1. One slow oscillator can switch the pitch of a fast one.
2. A multivibrator's pitch depends on the voltage its base resistors return to.

## Simulation notes
The first half-period is longer than the later ones because the 4.7 µF starts empty.

```assert
# 1 ms after switch-on: slow astable high, the base return at its upper value
net lm324_3.1_out V 7.49 +-0.05
net lm324_3.2_out V 7.14 +-0.05
```

<!-- engine-provenance -->
> **Engine provenance.** The measured numbers on this page were last held against
> `bw-board@9de91e3` and `bw-circuit-ui@3084f35` — the revisions pinned in
> `test/fixtures/siblings.json`. `test/expected-quantities-hold.test.mjs` compares
> **17 of this page's 23** numeric claims against that engine
> (0 of them disagreeing) and declines the rest with a stated reason;
> `node scripts/expected-claim-census.mjs lab-two-tone-horn` prints them one by one.
<!-- engine-provenance -->
