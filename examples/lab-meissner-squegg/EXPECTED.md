# lab-meissner-squegg — expected behaviour

## Circuit
- 9 V battery. Transmitter: a ferrite-rod coil (250 µH) with the tuning capacitor (authored 0.30) across its main winding in the collector of an NPN, top at 9 V; emitter 1 kΩ with 1 nF across, and a slide switch ("big bypass", authored off) that adds 1 µF across it. The coupling winding (a fifth of the main winding's turns) runs from the base to a 4.7 nF reservoir, which the bias pot (a 1 MΩ rheostat from 9 V, authored 0.30) charges through 10 kΩ. Two slide switches connect the coupling winding either way round (both in the first position: the right way; both over: reversed).
- Receiver: a second ferrite rod (`linkTo` the transmitter's rod, 0.22 m away) with its tuning capacitor at 0.309, a germanium diode into 47 kΩ ‖ 2.2 nF and a crystal earphone.

## Observable behaviour
- As authored (big bypass off): the oscillator runs steadily, a few per cent above its bare tank's 803 kHz (the strong coupling winding pulls it). Once it has settled (about 20 ms) the tank swings a constant 8.54 V, and the receiver's detector sits steady at about 6.5 V (no tone).
- Big bypass on: the oscillation stops and restarts about 1060 times a second (squegging). The tank swings between nothing and about 12 V, the receiver's detector between 0.13 V and 0.69 V, and the earphone hears a rough tone near 1.06 kHz: a carrier keyed by a tone.
- Both coupling switches over (the feedback winding reversed): nothing starts at all.

## Why the big bypass squegs
With a fifth of the turns on the coupling winding the base is driven hard. While the stage oscillates it rectifies its own drive: the base current charges the 4.7 nF reservoir negative, and that turns the transistor down (self-bias). The reservoir is fed back up through 0.7 MΩ, so it relaxes in milliseconds. With only 1 nF across the 1 kΩ emitter resistor, the resistor holds the stage's gain at the carrier down, each start overshoots only a little, and the swing and the bias settle together. With 1 µF across it, the full gain is there: every start overshoots hard, and its rectified base current drives the reservoir about 2 V below cut-off (to −2.1 V). The oscillation dies, and only when the 0.7 MΩ feed has brought the reservoir back to about 0.6 V, roughly a millisecond later, does it start again.

## Reference (full carrier)
`scripts/ngspice-meissner-squegg.py --record` integrates the carrier itself in ngspice (no envelope), with the values the engine resolves for this bench; the record is `test/measurements/rf-meissner-squegg-ngspice-2026-11-28.json`. Gear at 5 ns and 2 ns and trapezoidal at 2 ns agree. Big bypass on, 6–9 ms: the tank swing falls below 1e-8 V between bursts and peaks at 12.5–12.9 V; the detector runs 0.132–0.689 V; the bursts repeat at 1057.0–1057.7 Hz. Big bypass off, 22–25 ms: 8.541–8.544 V, detector 6.46–6.47 V. Reversed, 5–8 ms: no tank swing; only 0.33 mV of a ~35 MHz parasitic oscillation of the coupling winding leaks through the measurement filter.

Re-designed 2026-11-28. The earlier circuit (coupling winding 2 % of the turns, receiver 0.5 m away) never squegs at the carrier: the collector bottoming out holds its swing (bw-board PR #783). Its claimed 819 Hz squeg was an engine artefact. A 0.2 m receiver loads the transmitter enough to squeg the small-bypass control as well; from 0.25 m on, the detector swings less than 0.5 V.

## Measured on the engine
`test/lab-circuits-r7b.test.mjs`, 3 ms sampled every 20 µs. On bw-board b47e7e09, big bypass off, after 22 ms: tank 8.590 V and flat. The detector is flat too, but at 8.48 V, against the reference's 6.47 V. Reversed: below 1 µV. Big bypass on: the engine fails. Its RF band runs away at 1.89 ms (b47e7e09), or the transient solve stops converging at 4.27 ms (d21d6d8b). On d21d6d8b the small-bypass control also runs away, at 0.41 ms. Those scenarios are marked as known engine failures (`todo`) with the reference beside them. The engine's mode estimate places this strongly fed-back stage's growth far from its band's centre (bw-board PR #783).

## What this verifies
1. An oscillator needs the phase condition as well as enough gain: reversing the feedback winding stops it.
2. A self-biased oscillator whose bias network is slow next to its build-up interrupts itself (squegging) when it overshoots, and the interruption is heard as a tone.

```assert
# supply
net vsource_2.pos V 9.00 +-0.01
```

<!-- engine-provenance -->
> **Engine provenance.** The measured numbers on this page were last held against
> `bw-board@de8083c` and `bw-circuit-ui@ee2b412` — the revisions pinned in
> `test/fixtures/siblings.json`. `test/expected-quantities-hold.test.mjs` compares
> **11 of this page's 55** numeric claims against that engine
> (0 of them disagreeing) and declines the rest with a stated reason;
> `node scripts/expected-claim-census.mjs lab-meissner-squegg` prints them one by one.
<!-- engine-provenance -->
