# lab-meissner-squegg — expected behaviour

## Circuit
- 9 V battery. Transmitter: a ferrite-rod coil (250 µH) with the tuning capacitor (authored 0.30) across its main winding in the collector of an NPN, top at 9 V; emitter 1 kΩ with 1 nF across, and a slide switch ("big bypass", authored off) that adds 1 µF across it. The coupling winding (2 % of the turns) runs from the base to a 4.7 nF reservoir, which the bias pot (a 1 MΩ rheostat from 9 V, authored 0.30) charges through 10 kΩ. Two slide switches connect the coupling winding either way round (both in the first position: the right way; both over: reversed).
- Receiver: a second ferrite rod (`linkTo` the transmitter's rod, 0.5 m away) with its tuning capacitor at 0.309, a germanium diode into 47 kΩ ‖ 2.2 nF and a crystal earphone.

## Observable behaviour
- As authored (big bypass off): the oscillator runs steadily near 797 kHz; once it has settled (about 20 ms) the tank swings a constant 8.89 V and the receiver's detector output is a steady 1.13 V (no tone).
- Big bypass on: the oscillator stops and restarts about eight hundred times a second (squegging). The tank swings between nothing (microvolts) and about 11 V, the receiver's detector between 0.5 V and 3.4 V or more, and the earphone hears a rough tone near 0.8 kHz: a carrier keyed by a tone.
- Both coupling switches over (the feedback winding reversed): nothing starts at all (tank below 5 µV).

## Why the big bypass squegs
While it oscillates, the transistor rectifies its own drive: its average emitter current rises and charges the emitter capacitor, which turns the transistor down (self-bias). With 1 nF across the 1 kΩ emitter resistor that happens in about 1 µs, much faster than the oscillation builds up or decays (2Q/ω ≈ 33 µs), so bias and swing settle together. With 1 µF it takes about a millisecond: the oscillation builds up long before the bias has caught up, the bias then overshoots past cut-off, the oscillation dies, and the capacitor has to discharge before it can start again. (The 4.7 nF reservoir at the base carries only the base current, a hundredth of the emitter's, and moves too little to do this on its own.)

## Measured on the engine
bw-board f48ea7ce, `test/lab-circuits-r7b.test.mjs` (3 ms sampled every 20 µs): big bypass off, after 22 ms: tank 8.89 V, detector flat at 1.134 V; big bypass on, after 6 ms: tank 0.0000025–10.96 V, detector 0.54–4.04 V, tone 819 Hz; reversed 0.0000002–0.000004 V. Re-designed 2026-11-26: until then the bench claimed squegging at low bias with the 1 nF bypass, which came from the band's swing collapsing at the collector clamp (an engine artefact fixed in bw-board #760); with that fixed the 1 nF stage runs steadily at any bias, as its 1 µs self-bias time constant says it should.

## What this verifies
1. An oscillator needs the phase condition as well as enough gain: reversing the feedback winding stops it.
2. A self-biased oscillator whose bias network is slow next to its build-up interrupts itself (squegging), and the interruption is heard as a tone.

```assert
# supply
net vsource_2.pos V 9.00 +-0.01
```

<!-- engine-provenance -->
> **Engine provenance.** The measured numbers on this page were last held against
> `bw-board@b47e7e0` and `bw-circuit-ui@ee2b412` — the revisions pinned in
> `test/fixtures/siblings.json`. `test/expected-quantities-hold.test.mjs` compares
> **11 of this page's 40** numeric claims against that engine
> (0 of them disagreeing) and declines the rest with a stated reason;
> `node scripts/expected-claim-census.mjs lab-meissner-squegg` prints them one by one.
<!-- engine-provenance -->
