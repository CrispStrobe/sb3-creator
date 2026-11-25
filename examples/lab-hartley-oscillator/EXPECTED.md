# lab-hartley-oscillator — expected behaviour

## Circuit
- 9 V supply. The coil is one winding with a tap, modelled as two coupled windings in series: 10 mH and 1 mH, coupling 0.9; the tap is on +9 V.
- An NPN drives the top end of the coil from its collector; the bottom end swings the other way and goes back to the base through 100 nF. 100 nF across the whole coil is the tuning capacitor.
- Base bias 47 kΩ / 10 kΩ, emitter 1 kΩ bypassed by 10 µF.
- A crystal earphone listens at the collector through 10 nF; the oscilloscope shows both coil ends.

## Observable behaviour
- The circuit oscillates on its own at about 3.8 kHz, a high whistle.
- The two ends of the coil swing in opposite directions; the collector swings from almost 0 to almost twice the supply (18 V), as a tuned circuit's top end does.

## Measured on the engine
`test/lab-circuits-r6e.test.mjs`, 10 ms after switch-on: 3846 Hz from the collector's crossings, against 1/(2π√(L·C)) = 3896 Hz with L = 10 + 1 + 2·0.9·√10 mH = 16.7 mH; the collector reaches 17.9 V.

## What this verifies
1. A coil and a capacitor ring at f = 1/(2π√(L·C)); the two halves of a tapped coil add up to more than their sum, because they share their flux (+2M).
2. The tap divides the swing: the ends move in opposite directions, which is the 180° the transistor's own 180° needs to make a loop that feeds itself.

## Simulation notes
The coil's winding resistance is not modelled; the oscillation grows until the transistor limits it, so it is clipped rather than a clean sine.

```assert
# the supply; the transistor is already oscillating 1 ms after switch-on
net vsource_2.pos V 9.00 +-0.01
```

<!-- engine-provenance -->
> **Engine provenance.** The measured numbers on this page were last held against
> `bw-board@9de91e3` and `bw-circuit-ui@3084f35` — the revisions pinned in
> `test/fixtures/siblings.json`. `test/expected-quantities-hold.test.mjs` compares
> **10 of this page's 19** numeric claims against that engine
> (0 of them disagreeing) and declines the rest with a stated reason;
> `node scripts/expected-claim-census.mjs lab-hartley-oscillator` prints them one by one.
<!-- engine-provenance -->
