# lab-am-music — expected behaviour

## Circuit
- A crystal set, no battery: antenna on the tap of the ferrite-rod coil, the coil's cold end and the earth on ground, the tuning capacitor across the whole coil (authored at 0.50).
- Germanium diode (1N34A) from the top of the tank into 47 kΩ ‖ 2.2 nF (the envelope detector) and a crystal earphone.
- The antenna carries its own broadcast (its `stations` parameter): one station at 612 kHz, 20 mV/m, 60 % modulated with a repeating tune of 120 ms notes — 392, 330, 330, 349, 294, 294 Hz, then 262 Hz for 240 ms and a 120 ms rest (1.08 s in all).

## Observable behaviour
- The earphone plays the tune note by note: 392 Hz in the first 120 ms, 330 Hz in the next two notes, 349 Hz from 360 to 480 ms, and so on.
- The detector output is a DC level of a few hundred mV with the notes riding on it.
- Turning the tuning knob away from 0.5 the music fades.

## Measured on the engine
bw-board r4/rf-20261123 (the round-3 phasor front end: nothing in this receiver can oscillate), `test/lab-circuits-rf.test.mjs`: 392 Hz at 50 ms, 330 Hz at 150 ms and 270 ms, 351 Hz at 400 ms; earphone level 0.16–0.18.

## What this verifies
1. The detected audio is the programme the station modulates onto its carrier, whatever it is: a tune here.
2. The detector's time constant (47 kΩ × 2.2 nF ≈ 0.1 ms) is short enough for the highest note and long against the carrier.

```assert
# the top of the tank sits at ground for DC (the coil shorts it)
net tuning_cap_6.a V 0.00 +-0.01
```

<!-- engine-provenance -->
> **Engine provenance.** The measured numbers on this page were last held against
> `bw-board@2965782` and `bw-circuit-ui@e3441d2` — the revisions pinned in
> `test/fixtures/siblings.json`. `test/expected-quantities-hold.test.mjs` compares
> **2 of this page's 26** numeric claims against that engine
> (0 of them disagreeing) and declines the rest with a stated reason;
> `node scripts/expected-claim-census.mjs lab-am-music` prints them one by one.
<!-- engine-provenance -->
