# lab-meissner-squegg — expected behaviour

## Circuit
- 9 V battery. Transmitter: a ferrite-rod coil (250 µH) with the tuning capacitor (authored 0.30) across its main winding in the collector of an NPN, top at 9 V; emitter 1 kΩ with 1 nF across. The coupling winding (2 % of the turns) runs from the base to a 4.7 nF reservoir, which the bias pot (a 1 MΩ rheostat from 9 V, authored 0.30) charges through 10 kΩ. Two slide switches connect the coupling winding either way round (both in the first position: the right way; both over: reversed).
- Receiver: a second ferrite rod (`linkTo` the transmitter's rod, 0.5 m away) with its tuning capacitor at 0.309, a germanium diode into 47 kΩ ‖ 2.2 nF and a crystal earphone.

## Observable behaviour
- Bias pot at 0.30: the oscillator runs steadily near 797 kHz; once it has settled (about 20 ms) the tank swings a constant 8.88 V and the detector output in the receiver is a steady 1.13 V (no tone).
- Bias pot turned low (0.05): the base's rectified current charges the reservoir negative faster than the weak bias can refill it, so the oscillation stops, the bias recovers, it starts again — about nine hundred times a second (squegging). The tank swings between nothing (below 0.1 mV) and about 9.2 V, the receiver's detector between 0.5 V and 3.5 V, and the earphone hears a buzzing tone near 0.9 kHz: a carrier keyed by a tone.
- Both switches over (the feedback winding reversed): the feedback now opposes the signal; nothing starts at all (tank below 5 µV).

## Measured on the engine
bw-board d4113b4b (unchanged on b094eb22), `test/lab-circuits-r7b.test.mjs` (2 ms sampled every 20 µs): pot 0.05 tank 0.0000004–9.22 V, detector 0.49–3.52 V, tone 903 Hz; pot 0.30 (after 22 ms) tank 8.876 V, detector flat at 1.131 V; reversed 0.0000002–0.000004 V.

## What this verifies
1. An oscillator needs the phase condition as well as enough gain: reversing the feedback winding stops it.
2. A self-biased oscillator whose bias network is slow next to its build-up interrupts itself (squegging), and the interruption is heard as a tone.

```assert
# supply
net vsource_2.pos V 9.00 +-0.01
```

<!-- engine-provenance -->
> **Engine provenance.** The measured numbers on this page were last held against
> `bw-board@e744ede` and `bw-circuit-ui@3084f35` — the revisions pinned in
> `test/fixtures/siblings.json`. `test/expected-quantities-hold.test.mjs` compares
> **17 of this page's 30** numeric claims against that engine
> (0 of them disagreeing) and declines the rest with a stated reason;
> `node scripts/expected-claim-census.mjs lab-meissner-squegg` prints them one by one.
<!-- engine-provenance -->
