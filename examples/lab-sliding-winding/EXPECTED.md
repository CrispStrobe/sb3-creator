# lab-sliding-winding — expected behaviour

## Circuit
- A ferrite rod whose small winding (0.3 of the main winding's turns) slides along it; the rod's dial is the winding's position, 0 in the middle to 1 at the end.
- Two slide switches put the small winding in series with the main winding: both left, the main winding's top runs into c1 and the tank's top is c2 (the windings aid); both right, into c2 with the top at c1 (they oppose).
- The tuning capacitor across the series pair is the tank; the antenna sits on the main winding's tap; a germanium diode into 47 kΩ ‖ 2.2 nF detects; 100 nF into an LM386 (gain 20) and a loudspeaker on 220 µF; 9 V.

## Observable behaviour
- Windings aiding, winding in the middle, dial at 0.50: the tank sits near 490 kHz, below every station — nothing to hear.
- Both switches right (opposing), same dial: the tank jumps to about 810 kHz and the 810 kHz station plays (its two tones taking turns).
- Back to aiding, the small winding slid to the end of the rod: its inductance falls, the tank rises to about 580 kHz; turn the dial back to 0.45 and the 612 kHz station comes in.

## Why the inductance changes
Two windings in series on one rod add their own inductances and, through the shared field, twice their mutual inductance: L = L1 + L2 + 2M when their fields aid, L1 + L2 − 2M when they oppose. With the small winding at 0.3 of the turns that is about 1.6 against 0.55 of the main winding alone, so the resonance f = 1/(2π√(LC)) moves by the square root of their ratio. Sliding the small winding to the rod's end leaves less ferrite inside it: its own inductance and its coupling to the main winding both drop.

## Measured on the engine
`test/lab-circuits-r7mw.test.mjs`: tank 488 kHz (aiding, middle, 0.50), 810 kHz with the 810 kHz station's carrier 0.17 V at the detector (opposing), 581 kHz slid to the end and 612 kHz at 0.45 with the 612 kHz carrier 0.31 V at the diode and 0.15 V of rectified level after 1.5 ms.

```assert
# the LM386's inputs: -IN on ground, its bias pin at half the supply
net lm386_14.inn V 0.00 +-0.01
net lm386_14.bypass V 4.50 +-0.05
# the tank's top sits at ground for DC through the two windings
net tuning_cap_9.a V 0.00 +-0.01
```

<!-- engine-provenance -->
> **Engine provenance.** The measured numbers on this page were last held against
> `bw-board@d4113b4` and `bw-circuit-ui@0b594d6` — the revisions pinned in
> `test/fixtures/siblings.json`. `test/expected-quantities-hold.test.mjs` compares
> **4 of this page's 20** numeric claims against that engine
> (0 of them disagreeing) and declines the rest with a stated reason;
> `node scripts/expected-claim-census.mjs lab-sliding-winding` prints them one by one.
<!-- engine-provenance -->
