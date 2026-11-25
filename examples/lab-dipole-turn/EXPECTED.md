# lab-dipole-turn — expected behaviour

## Circuit
- A half-wave folded dipole (effective length 0.95 m, 300 Ω), its feeder through 2.2 pF into a tuned circuit: an air-core VHF coil (0.15 µH, Q 80) with 15 pF across it, tuned to the station.
- A germanium diode (1N34A) from the top of the tank into 10 nF, read by a sensitive meter (50 mV full scale, 50 kΩ) that is also the detector's load. No battery: the station powers the meter.
- The broadcast: one FM station at 98.0 MHz, 50 mV/m, arriving from the north (bearing 0°). The dipole's knob turns it (0° = broadside to the north).

## Observable behaviour
- Broadside (turn 0°) the tank swings about 80 mV peak and the meter reads about 16 mV.
- Turned 45° the swing falls to cos 45° of that (about 56 mV) and the meter to about 8.5 mV (the diode's square law below its knee).
- End-on (turn 90°) nothing arrives: the tank and the meter read zero.
- Turned half round (180°) it reads as at 0°: a dipole has two equal lobes, front and back.

## Measured on the engine
bw-board RF front end (the dipole's EMF = field × effective length × cos(turn − bearing), in the band around the tank's resonance), `test/lab-circuits-r7vhf.test.mjs`, 5 ms per position: tank 0.0797 / 0.0564 / 0 / 0.0797 V peak at 0° / 45° / 90° / 180°; meter 16.4 / 8.5 / 0 / 16.4 mV.

## What this verifies
1. A half-wave dipole receives with cos(angle to the station): a figure-eight pattern with two maxima and two nulls.
2. The RF the dipole delivers is the field times its effective length, behind its radiation resistance.

```assert
# broadside: the detector's DC on the meter, still charging its 10 nF
# through the diode when the gate reads it (11 mV; 16 mV once settled)
net analog_meter_9.a V 0.0135 +-0.006
# the top of the tank sits at ground for DC (the coil shorts it)
net vhf_coil_5.b V 0.00 +-0.01
```

<!-- engine-provenance -->
> **Engine provenance.** The measured numbers on this page were last held against
> `bw-board@d4113b4` and `bw-circuit-ui@0b594d6` — the revisions pinned in
> `test/fixtures/siblings.json`. `test/expected-quantities-hold.test.mjs` compares
> **12 of this page's 16** numeric claims against that engine
> (7 of them disagreeing) and declines the rest with a stated reason;
> `node scripts/expected-claim-census.mjs lab-dipole-turn` prints them one by one.
<!-- engine-provenance -->
