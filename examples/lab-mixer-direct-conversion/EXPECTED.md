# lab-mixer-direct-conversion — expected behaviour

## Circuit
- Transmitter: a Meissner oscillator on a ferrite rod (250 µH main winding with the tuning capacitor across it, authored 0.3 → about 790 kHz; the coupling winding, 5 % of the turns, in the base lead; 47 k / 10 k divider held by 10 nF; 1 kΩ ‖ 1 nF in the emitter). It runs from its own supply through the SUPPLY slide switch: 9 V (left) or 6 V (right).
- A wire from its collector runs past the receiver: 2.2 pF onto the mixer IC's input A (input B bypassed by 100 nF).
- Receiver: the mixer IC on 6 V, its own oscillator in a tapped-coil circuit on a second rod (250 µH, its tuning capacitor at 0.3, top to the oscillator base and tap to its emitter through 10 nF each).
- Output A (22 nF to ground) through 100 nF into the LM386 (10 kΩ at +IN), 220 µF into an 8 Ω loudspeaker.

## Observable behaviour
- As authored: the two oscillators are a few kHz apart; after settling, the loudspeaker whistles at their difference, about 3.9 kHz.
- A small transmitter-tuning change moves the whistle: at 0.302 (more capacitance, the transmitter lower, further from the receiver) it rises to about 6.2 kHz. At 0.298 it falls to about 1.5 kHz. When two oscillator frequencies coincide, their difference is zero: zero beat.
- The transmitter switched to 6 V: its transistor runs at a smaller current, its capacitances change, and this circuit's carrier moves further below the receiver's LO. The whistle rises to about 4.9 kHz. Supply, temperature and nearby capacitance can all pull an oscillator; their direction need not be the same.

## Measured on the engine
bw-board RF envelope front end (both oscillators in one band; the sa612's in-band product turns their beat into audio), `test/lab-circuits-r7mix.test.mjs`, 8 ms to settle, then 3 ms sampled at 10 µs intervals. As authored, the carrier phase difference is 3862 Hz and the speaker's complete periods measure 3863 Hz at about 4.4 V peak-to-peak. Transmitter tuning 0.302 gives about 6199 Hz at the speaker; 0.298 gives about 1502 Hz; the transmitter on 6 V gives about 4948 Hz.

Measured 2026-11-27 on candidate `6b9e281`, whose entire tree landed unchanged as `b47e7e09` in bw-board #782. The nominal, 0.302 and 6 V carrier differences are independently reproduced with the changed consistency correction disabled and RF steps bounded at both 128 ns and 64 ns; halving that step changes the measured frequencies by at most 0.13 Hz. The opposite small-tuning control uses a 128 ns reference. Opening only the RF coupling leaves both oscillators running but removes the mixer tone. The source identities, complete samples, rejected historical startup counts, and separate unqualified far-tuning case are preserved in [the qualification record](../../docs/RF-DIRECT-CONVERSION-QUALIFICATION.md).

On bw-board `d21d6d8b`, the revision before #782, the scenario fails its first guard, "9 V, tuning 0.3: rfAmplitude remains active". MEASURED 2026-11-28 with `scripts/probe-direct-conversion.mjs --case base` over 8–11 ms:
- the received RF at the mixer runs 0.0089–0.258 V, against a 0.05 V floor and a 2 % steadiness bound;
- the LO runs 2·10⁻⁸ to 13.7 V, against a 4 V floor;
- the transmitter's base–collector swing runs 0.57–15.6 V.

Both oscillators burst instead of running steadily, so no carrier phase difference can be measured. The settled-beat oracle above needs the #782 engine.

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
> `bw-board@818e026` and `bw-circuit-ui@659431c` — the revisions pinned in
> `test/fixtures/siblings.json`. `test/expected-quantities-hold.test.mjs` compares
> **13 of this page's 46** numeric claims against that engine
> (0 of them disagreeing) and declines the rest with a stated reason;
> `node scripts/expected-claim-census.mjs lab-mixer-direct-conversion` prints them one by one.
<!-- engine-provenance -->
