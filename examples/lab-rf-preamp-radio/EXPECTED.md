# lab-rf-preamp-radio — expected behaviour

## Circuit
- 9 V battery, antenna (antenna_4) and earth. Ferrite coil (ferrite_coil_6) with tuning capacitor (tuning_cap_7, 0.5 = 612 kHz as built).
- Q1, RF amplifier: the coupling winding feeds its base (470 kΩ bias, held at RF by 100 nF); emitter 1 kΩ ‖ 10 µF; 2.5 mH choke (inductor_13) in its collector; the carrier leaves through 1 nF.
- DETECTOR slide switch (slide_switch_15): left (as built) a germanium diode (47 kΩ to ground at its anode); right Q2, an emitter follower with no bias (47 kΩ base to ground). Both feed the same magnetic earphone (earphone_20) with 10 nF across it.

## Observable behaviour
- Tuned to 612 kHz the earphone plays that station's 400 Hz programme.
- Q1 lifts the carrier about 130 times between its base and its collector.
- With the transistor detector the same programme is much louder: about 0.48 mA in the earphone instead of 0.03 mA.
- Turning the dial to 810 kHz brings in the 600 Hz station.

## Measured on the engine
bw-board 2965782a, `test/lab-circuits-r10a.test.mjs`: RF gain 131 at 612 kHz; diode detector 400 Hz, 28.7 µA rms in the earphone; emitter follower 400 Hz, 484 µA rms; 810 kHz: 605 Hz.

## What this verifies
1. An RF stage ahead of the detector makes a weak carrier big enough to detect well.
2. A transistor's base-emitter junction is itself a detector, and the transistor adds current gain: the earphone current rises about seventeenfold.

## Simulation notes
The diode detector here drives the 2 kΩ earphone directly from a 1 nF coupling, so it delivers little current; the emitter follower amplifies the detected current. The carrier makes the solver take small steps: about 0.4 s of computing per simulated millisecond.

```assert
# 1 ms after switch-on: the base bias still rising through 470 kΩ, Q1 not yet conducting
net npn_10.base V 0.19 +-0.03
net npn_10.collector V 9.00 +-0.02
```

<!-- engine-provenance -->
> **Engine provenance.** The measured numbers on this page were last held against
> `bw-board@f48ea7c` and `bw-circuit-ui@3084f35` — the revisions pinned in
> `test/fixtures/siblings.json`. `test/expected-quantities-hold.test.mjs` compares
> **10 of this page's 27** numeric claims against that engine
> (0 of them disagreeing) and declines the rest with a stated reason;
> `node scripts/expected-claim-census.mjs lab-rf-preamp-radio` prints them one by one.
<!-- engine-provenance -->
