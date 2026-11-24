# lab-mosfet-regen — expected behaviour

## Circuit
- 9 V battery. Ferrite rod (the part's default main winding, tap for the 1 m antenna, earth on ground), tuning capacitor at 0.50 across the main winding (≈ 618 kHz).
- n-channel MOSFET (threshold 2 V, k = 2 mA/V²): gate coupled to the tank top by 100 pF and held through 1 MΩ at the wiper of a 100 kΩ pot across 9 V (authored 0.80: the gate below the threshold). Source 1 kΩ bypassed by 100 nF.
- Drain through the feedback winding (2 % of the main turns) and a magnetic earphone to 9 V, 10 nF from the earphone to ground.
- The antenna's broadcast: one station at 612 kHz, 5 mV/m, 50 % AM with a 400 Hz tone.

## Observable behaviour
- Pot 0.80: gate below threshold, no drain current, no sound; tank RF ≈ 0.05 V (the station alone).
- Pot 0.77: gate ≈ 2.06 V, ≈ 8 µA; the 400 Hz programme in the earphone (≈ 4 mV at 400 Hz).
- Pot 0.75: just past the regeneration threshold. With the station's carrier in its tank the stage starts to oscillate, about 6 kHz from the station, and the earphone whistles (the beat; without the station it stays silent).
- Pot 0.72: well past the threshold; the stage oscillates hard and the tank's RF jumps to volts.

## Measured on the engine
bw-board RF envelope front end (the MOSFET stamped into the bands by its square-law describing function, limited by its drain's headroom), `test/lab-circuits-rf.test.mjs`: 0.80 silent; 0.77 400 Hz line 4.1 mV over 6 ms; 0.75 the strongest line at 6000 Hz, 57 mV, against the programme's 3.2 mV; 0.72 tank RF more than ten times what it was (5.4 V). An oscillating MOSFET stage takes about 2.4 s per simulated ms (it took ≈ 10 s until 2026-11-24, when the band cut the stage's gain off outright as its drain ran down to the source while the rectified current only faded, and the solver chattered across that switch).

## What this verifies
1. A MOSFET conducts only above its threshold voltage, and its square law detects an AM signal.
2. Regeneration: positive feedback raises gain up to the point of oscillation.

```assert
# supply
net vsource_2.pos V 9.00 +-0.01
```

<!-- engine-provenance -->
> **Engine provenance.** The measured numbers on this page were last held against
> `bw-board@7e0bf8c` and `bw-circuit-ui@cb8dbb7` — the revisions pinned in
> `test/fixtures/siblings.json`. `test/expected-quantities-hold.test.mjs` compares
> **9 of this page's 33** numeric claims against that engine
> (0 of them disagreeing) and declines the rest with a stated reason;
> `node scripts/expected-claim-census.mjs lab-mosfet-regen` prints them one by one.
<!-- engine-provenance -->
