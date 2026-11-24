# lab-am-transmitter — expected behaviour

## Circuit
- 9 V battery. Transmitter: a ferrite-rod coil (250 µH) with the tuning capacitor (authored 0.30) across its main winding in the collector of the oscillator transistor, top at 9 V; the coupling winding (2 % of the turns) between the base and a 22 kΩ / 22 kΩ divider held by 10 nF. Emitter: 1 nF to ground (RF bypass) and 1 kΩ down to the modulator transistor's collector; modulator emitter 470 Ω to ground, base fed through 10 kΩ from the audio generator (1 kHz sine, 0.1 V around 1.2 V).
- Receiver: a second ferrite rod (`linkTo` the transmitter's rod, `distanceM` 0.5), tuning capacitor 0.309 across its main winding, germanium diode into 47 kΩ ‖ 2.2 nF and a crystal earphone.

## Observable behaviour
- The transmitter oscillates near 796 kHz with a swing of several volts, swelling and shrinking with the 1 kHz audio.
- At 0.5 m the receiver's tank carries about 0.33 V of RF; the detector output carries the 1 kHz tone (about 10 mV at the fundamental).
- At 1 m: about 0.04 V of RF (an eighth: the near field ∝ 1/d³), the 1 kHz tone about 0.1 mV; at 2 m a few millivolts of RF and no tone.

## Measured on the engine
bw-board r4/rf-20261123 (RF envelope front end, near-field rod coupling), `test/lab-circuits-rf.test.mjs` (12 ms of audio after 15 ms): 0.5 m RF 0.344 V, 1 kHz 9.4–12.7 mV (12 ms window, across 1-ulp changes of the coil; the swing jitters); 1 m RF 0.041 V, 1 kHz 0.1 mV.

## What this verifies
1. An LC oscillator whose current is modulated is an AM transmitter.
2. The magnetic near field between two rods falls as 1/d³, and a passive detector's output falls faster still.

```assert
# supply
net vsource_2.pos V 9.00 +-0.01
```

<!-- engine-provenance -->
> **Engine provenance.** The measured numbers on this page were last held against
> `bw-board@7e0bf8c` and `bw-circuit-ui@cb8dbb7` — the revisions pinned in
> `test/fixtures/siblings.json`. `test/expected-quantities-hold.test.mjs` compares
> **13 of this page's 33** numeric claims against that engine
> (0 of them disagreeing) and declines the rest with a stated reason;
> `node scripts/expected-claim-census.mjs lab-am-transmitter` prints them one by one.
<!-- engine-provenance -->
