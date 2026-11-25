# lab-whistle-fm — expected behaviour

## Circuit
- 9 V battery. A speaker used as a microphone (`soundDb` 110, voice-like sound) into the LM386's +IN; 10 µF across pins 1–8 (gain 200).
- Two-transistor astable: 1 kΩ collector loads (a piezo across the second), 22 nF cross capacitors, 47 kΩ base resistors returned not to 9 V but to a control node that 22 kΩ feeds from 9 V.
- The LM386's output reaches the control node through 1 µF and 1 kΩ.

## Observable behaviour
- Silent microphone (`soundDb` 0): the control node sits near 4.2 V and the astable runs steadily at about 426 Hz; successive periods differ by no more than 0.01 ms.
- Sound at the microphone: the amplified sound swings the control node, the base resistors' current — and so the recharge time of the cross capacitors — follows, and the pitch wails: successive periods spread from about 1.9 ms to 2.6 ms.

## Measured on the engine
bw-board f4aaec43 (unchanged on b094eb22), `test/lab-circuits-r7b.test.mjs` (40 ms of the second collector after 30 ms): silent 2.34–2.35 ms periods, node 4.22 V; at 110 dB 1.92–2.61 ms, node 3.26 V.

## What this verifies
1. An astable's frequency depends on the voltage its base resistors return to: that voltage is a frequency-modulation input.
2. A speaker works as a microphone, and an amplifier IC makes its output big enough to modulate.

```assert
# power-on: supply and the LM386's bias divider at half the supply
net vsource_2.pos V 9.00 +-0.01
net lm386_4.bypass V 4.50 +-0.05
```

<!-- engine-provenance -->
> **Engine provenance.** The measured numbers on this page were last held against
> `bw-board@b094eb2` and `bw-circuit-ui@0b594d6` — the revisions pinned in
> `test/fixtures/siblings.json`. `test/expected-quantities-hold.test.mjs` compares
> **8 of this page's 21** numeric claims against that engine
> (0 of them disagreeing) and declines the rest with a stated reason;
> `node scripts/expected-claim-census.mjs lab-whistle-fm` prints them one by one.
<!-- engine-provenance -->
