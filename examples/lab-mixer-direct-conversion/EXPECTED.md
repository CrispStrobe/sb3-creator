# lab-mixer-direct-conversion — expected behaviour

## Circuit
- Transmitter: a Meissner oscillator on a ferrite rod (250 µH main winding with the tuning capacitor across it, authored 0.3 → about 790 kHz; the coupling winding, 5 % of the turns, in the base lead; 47 k / 10 k divider held by 10 nF; 1 kΩ ‖ 1 nF in the emitter). It runs from its own supply through the SUPPLY slide switch: 9 V (left) or 6 V (right).
- A wire from its collector runs past the receiver: 2.2 pF onto the mixer IC's input A (input B bypassed by 100 nF).
- Receiver: the mixer IC on 6 V, its own oscillator in a tapped-coil circuit on a second rod (250 µH, its tuning capacitor at 0.3, top to the oscillator base and tap to its emitter through 10 nF each).
- Output A (22 nF to ground) through 100 nF into the LM386 (10 kΩ at +IN), 220 µF into an 8 Ω loudspeaker.

## Observable behaviour
- As authored: the two oscillators are a few kHz apart; the loudspeaker whistles at their difference, about 3.8 kHz.
- Tuning the transmitter (or the receiver) moves the whistle: at 0.302 it drops to about 1.2 kHz; through zero beat it falls to a growl and rises again.
- The transmitter switched to 6 V: its transistor runs at a smaller current, its capacitances change, and its frequency moves — the whistle rises by more than 1 kHz. (Hand capacity on the tuning capacitor or a warmed transistor shift it the same way.)

## Measured on the engine
bw-board RF envelope front end (both oscillators in one band; the sa612's in-band product turns their beat into audio), `test/lab-circuits-r7mix.test.mjs`, 2 ms to settle, then 3 ms at the loudspeaker: as authored 3846 Hz at 3.64 V peak-to-peak; transmitter at 0.302 → 1171 Hz; transmitter on 6 V → 5518 Hz.

## What this verifies
1. A mixer with its own oscillator converts a carrier straight to audio (direct conversion): the pitch is the difference frequency.
2. A free-running LC oscillator's frequency depends on its supply: frequency stability matters for direct-conversion reception.

```assert
# both mixer inputs on the chip's internal bias (0.23 × 6 V)
net sa612_16.in_a V 1.38 +-0.02
net sa612_16.in_b V 1.38 +-0.02
```

<!-- engine-provenance -->
> **Engine provenance.** The measured numbers on this page were last held against
> `bw-board@d4113b4` and `bw-circuit-ui@0b594d6` — the revisions pinned in
> `test/fixtures/siblings.json`. `test/expected-quantities-hold.test.mjs` compares
> **17 of this page's 29** numeric claims against that engine
> (0 of them disagreeing) and declines the rest with a stated reason;
> `node scripts/expected-claim-census.mjs lab-mixer-direct-conversion` prints them one by one.
<!-- engine-provenance -->
