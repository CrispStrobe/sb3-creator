# lab-mosfet-regen — expected behaviour

## Circuit
- 9 V battery. Ferrite rod (the part's default main winding, tap for the 1 m antenna, earth on ground), tuning capacitor at 0.50 across the main winding (≈ 618 kHz).
- n-channel MOSFET (threshold 2 V, k = 2 mA/V²): gate coupled to the tank top by 100 pF and held through 1 MΩ at the wiper of a 100 kΩ pot across 9 V (authored 0.80: the gate below the threshold). Source 1 kΩ bypassed by 100 nF.
- Drain through the feedback winding (2 % of the main turns) and a magnetic earphone to 9 V, 10 nF from the earphone to ground.
- The antenna's broadcast: one station at 612 kHz, 5 mV/m, 50 % AM with a 400 Hz tone.

## Observable behaviour
- Pot 0.80: gate below threshold, no drain current, no sound; tank RF ≈ 0.05 V (the station alone).
- Pot 0.77: gate ≈ 2.06 V, ≈ 8 µA; the 400 Hz programme in the earphone (≈ 4 mV at 400 Hz).
- Pot 0.72: past the regeneration threshold; the stage oscillates and the tank's RF jumps to volts.

## Measured on the engine
bw-board RF envelope front end (the MOSFET stamped into the bands by its square-law describing function, limited by its drain's headroom), `test/lab-circuits-rf.test.mjs`: 0.80 silent; 0.77 400 Hz line 4.1 mV over 6 ms; 0.72 tank RF more than ten times what it was. An oscillating MOSFET stage is slow to simulate here (≈ 10 s per simulated ms).

## What this verifies
1. A MOSFET conducts only above its threshold voltage, and its square law detects an AM signal.
2. Regeneration: positive feedback raises gain up to the point of oscillation.

```assert
# supply
net vsource_2.pos V 9.00 +-0.01
```
