# lab-dawn-radio — expected behaviour

## Circuit
- 9 V battery. The one-transistor receiver: antenna on the tap of the ferrite-rod coil, the coil's cold end and the earth on ground, the tuning capacitor across the whole coil (authored at 0.50, the 612 kHz station); the coupling winding on the base, its other end biased from 9 V through 1 MΩ and held by 100 nF; a magnetic earphone (2 kΩ, 0.1 H) from 9 V to the collector, 10 nF from collector to ground.
- The receiver's emitter does not go to ground: it goes to the collector of a second (switch) transistor whose emitter is on ground.
- The switch's base sits on a divider: an LDR (1 MΩ dark, 1 kΩ bright) from 9 V, 47 kΩ to ground.

## Observable behaviour
- Dark (light 0): the switch's base is at about 0.4 V, the switch is off, the receiver's transistor carries only nanoamps, and the earphone is silent.
- Bright (light 1): the switch's base rises towards 8.8 V (limited by its junction), the switch saturates and the receiver works: the station's 400 Hz tone in the earphone.

## Measured on the engine
bw-board r4/rf-20261123, `test/lab-circuits-rf.test.mjs`: dark, the receiver's collector current about 40 nA and no tone; lit, 400 Hz at about 0.4–0.8 mA rms, falling slowly while the 1 MΩ / 100 nF bias settles.

## What this verifies
1. A light-controlled transistor switch in the ground return turns a whole circuit on and off.
2. Off, the receiver draws almost nothing: that is what lets it wait all night on a battery.

```assert
# supply
net vsource_2.pos V 9.00 +-0.01
```

<!-- engine-provenance -->
> **Engine provenance.** The measured numbers on this page were last held against
> `bw-board@f4aaec4` and `bw-circuit-ui@141b2cc` — the revisions pinned in
> `test/fixtures/siblings.json`. `test/expected-quantities-hold.test.mjs` compares
> **11 of this page's 21** numeric claims against that engine
> (0 of them disagreeing) and declines the rest with a stated reason;
> `node scripts/expected-claim-census.mjs lab-dawn-radio` prints them one by one.
<!-- engine-provenance -->
