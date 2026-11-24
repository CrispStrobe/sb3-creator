# lab-fm-slope — expected behaviour

## Circuit
- 9 V battery. A short antenna (0.75 m, 3 pF) straight into the base of a BF199 VHF transistor biased by 47 kΩ / 10 kΩ; emitter 470 Ω ‖ 1 nF.
- Collector tank: an air-core coil (0.15 µH, Q 80) to 9 V, a BB910 varicap from the collector to an RF-grounded (1 nF) node fed from the tuning pot's wiper through 100 kΩ (pot authored at 0.46).
- Detector: 10 pF from the collector to a germanium diode (47 kΩ DC return at its anode) into 10 kΩ ‖ 470 pF; 100 nF into a transistor biased by 1 MΩ, magnetic earphone in its collector, 10 nF across.
- The antenna's broadcast: one FM station at 98.0 MHz, 50 mV/m, 75 kHz deviation, a 1 kHz tone.

## Observable behaviour
- Pot 0.46: the tank resonates near 97.1 MHz, the station sits 0.9 MHz up its slope, and the earphone carries the 1 kHz tone (about 0.36 mA rms).
- Pot 0.48: the tank at about 98.4 MHz, nearly on the station: the tone falls to about a third (0.13 mA).
- Pot 0.40: the tank near 93 MHz: about 0.02 mA, nothing audible.
- The RF envelope at the detector stays about 0.2 V throughout: the FM carrier's strength does not change.

## Measured on the engine
bw-board r4/rf-20261123 (RF envelope front end; FM station, varicap), `test/lab-circuits-rf.test.mjs`, 60 ms at 0.46 then 40 ms per setting: 0.46 1000 Hz 0.362 mA; 0.48 0.133 mA; 0.50 (tank 99.7 MHz) 0.049 mA; 0.40 0.018 mA.

## What this verifies
1. A tuned circuit turns a frequency swing into an amplitude swing on its slope.
2. On the flat top of the resonance the conversion all but vanishes.

```assert
# supply
net vsource_2.pos V 9.00 +-0.01
```

<!-- engine-provenance -->
> **Engine provenance.** The measured numbers on this page were last held against
> `bw-board@d5501af` and `bw-circuit-ui@0efc30a` — the revisions pinned in
> `test/fixtures/siblings.json`. `test/expected-quantities-hold.test.mjs` compares
> **16 of this page's 38** numeric claims against that engine
> (0 of them disagreeing) and declines the rest with a stated reason;
> `node scripts/expected-claim-census.mjs lab-fm-slope` prints them one by one.
<!-- engine-provenance -->
