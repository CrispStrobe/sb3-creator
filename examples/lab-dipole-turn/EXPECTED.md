# lab-dipole-turn — expected behaviour

## Circuit
- A half-wave folded dipole (effective length 0.95 m, 300 Ω), its feeder through 2.2 pF into a tuned circuit: an air-core VHF coil (0.15 µH, Q 80) with 15 pF across it, tuned to the station.
- A germanium diode (1N34A) from the top of the tank into 10 nF, read by a sensitive moving-coil meter that is also the detector's load. No battery: the station powers the meter.
- The broadcast: one FM station at 98.0 MHz arriving from the north (bearing 0°). The dipole's knob turns it (0° = broadside to the north).

## Observable behaviour
- Broadside (turn 0°) the tank swings most and the meter reads its most, its rectified DC a small fraction of the swing (the diode works below its knee).
- Turned 45° the swing falls to cos 45° (0.71) of that and the meter to about half (the diode's square law below its knee).
- End-on (turn 90°) nothing arrives: the tank and the meter read zero.
- Turned half round (180°) it reads as at 0°: a dipole has two equal lobes, front and back.

## Measured on the engine
bw-board RF front end (the dipole's EMF = field × effective length × cos(turn − bearing), in the band around the tank's resonance), `test/lab-circuits-r7vhf.test.mjs`, the four turns 0° / 45° / 90° / 180° after the meter has settled: the tank's swing in the ratio 1 : 0.707 : 0 : 1, the meter's reading 1 : 0.52 : 0 : 1. The levels themselves are in the test.

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
> `bw-board@de8083c` and `bw-circuit-ui@ee2b412` — the revisions pinned in
> `test/fixtures/siblings.json`. `test/expected-quantities-hold.test.mjs` compares
> **5 of this page's 6** numeric claims against that engine
> (0 of them disagreeing) and declines the rest with a stated reason;
> `node scripts/expected-claim-census.mjs lab-dipole-turn` prints them one by one.
<!-- engine-provenance -->
