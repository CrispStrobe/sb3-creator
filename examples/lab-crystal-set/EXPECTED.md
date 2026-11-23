# lab-crystal-set — expected behaviour

## Circuit
- No battery. The antenna goes to the tap of a ferrite-rod coil (250 µH, tap a quarter of the turns up from the cold end). The coil's cold end, the earth connection and the circuit's ground are one node.
- The tuning capacitor (a knob that sweeps its capacitance from minimum to maximum) sits across the whole coil: the tank.
- A germanium detector diode (1N34A) runs from the top of the tank into the detector load: 47 kΩ in parallel with 2.2 nF. A crystal earphone sits across that load.
- The bench hears the simulator's standard broadcast: 612 kHz with a 400 Hz tone, 810 kHz with 600 Hz and 900 Hz taking turns every 0.2 s, and a weaker, distant 1215 kHz with a 1 kHz tone.

## Observable behaviour
- Knob at its authored 0.50: the 612 kHz station. The earphone plays its 400 Hz tone (level about 0.14).
- Knob near 0.26: the 810 kHz station, 600 Hz for 0.2 s, then 900 Hz, and so on.
- Knob near 0.10: the 1215 kHz station's 1 kHz tone, much quieter (level about 0.03): it is the weakest signal.
- In between the stations the earphone falls quiet.
- Each knob mark is where the coil and the capacitor resonate at that station's carrier, f = 1 / (2π√(LC)): more capacitance, lower frequency.

## Measured on the engine
Tank RF amplitude per station (the engine solves the carrier as phasors), and the earphone, on bw-board 0bc7baf:

| knob | 612 kHz | 810 kHz | 1215 kHz | earphone |
|---|---|---|---|---|
| 0.50 | 0.476 V | 0.018 V | 0.004 V | 400 Hz, level 0.136 |
| 0.26 | 0.040 V | 0.246 V | 0.009 V | 600 Hz, then 900 Hz |
| 0.10 | 0.025 V | 0.024 V | 0.187 V | 1 kHz, level 0.034 |

At every mark the tuned station is at least six times stronger in the tank than either of the others. `test/lab-circuits-7.test.mjs` holds these.

## Why it needs no battery
The diode lets only one half of each carrier swing through, and the 2.2 nF capacitor smooths away the carrier itself; what is left follows the station's loudness changes, which are the sound. All the energy the earphone gets comes from the station through the antenna. The germanium diode matters: it starts conducting at a much lower voltage than a silicon diode, so the weak tank voltage is not lost in the diode.

## What this verifies
1. A coil and a capacitor pick one frequency out of many: tuning.
2. A diode and a capacitor recover the sound from an amplitude-modulated carrier.
3. A tap on the coil matches the antenna to the tank without damping it.

```assert
# The coil is a short circuit for DC: the top of the tank sits at ground. The
# station is only RF, solved separately; this node carries no DC at all.
net tuning_cap_6.a V 0.00 +-0.01
```

<!-- engine-provenance -->
> **Engine provenance.** The measured numbers on this page were last held against
> `bw-board@a685b22` and `bw-circuit-ui@df78c46` — the revisions pinned in
> `test/fixtures/siblings.json`. `test/expected-quantities-hold.test.mjs` compares
> **2 of this page's 36** numeric claims against that engine
> (0 of them disagreeing) and declines the rest with a stated reason;
> `node scripts/expected-claim-census.mjs lab-crystal-set` prints them one by one.
<!-- engine-provenance -->
