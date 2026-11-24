# lab-shortwave-regen — expected behaviour

## Circuit
- The regenerative receiver of lab-regen-receiver on a short-wave ferrite coil: 5 µH main winding (Q 100), coupling winding 8 % of its turns in the collector lead, tuning capacitor authored at 0.25 (the tank near 6.08 MHz, pulled to about 6.05 MHz when oscillating).
- Antenna (2 m) on the tap through its own 20 pF (`farads` param); earth on ground.
- Grid-leak base: 100 pF from the tank top, 1 MΩ to the wiper of a 100 kΩ regeneration pot across 9 V (authored 0.85). Emitter 1 kΩ ‖ 100 nF. Magnetic earphone below the coupling winding, 10 nF to ground.
- The antenna's broadcast: a Morse beacon at 6.0585 MHz sending "E" at 20 words per minute (a 60 ms key-down, then 540 ms of gap) and an AM station at 5.9 MHz (500 Hz tone).

## Observable behaviour
- Pot at 0.85: no oscillation; the beacon's carrier is in the tank (~0.18 V) but the earphone carries no tone.
- Pot at 0.75: the receiver oscillates; while the key is down the base junction mixes the oscillation with the beacon's carrier and the earphone plays the difference frequency, about 2.4 kHz.
- Key up (after 60 ms): the tone dies away; the oscillation continues alone and makes no sound.

## Measured on the engine
bw-board r4/rf-20261123 (RF envelope front end), `test/lab-circuits-rf.test.mjs`: 0.85 at 20 ms no tone; 0.75 at 45 ms ~2.4 kHz, earphone current about 0.6 mA rms; at 100 ms (key up) the current has fallen below half of that.

## What this verifies
1. A nonlinear junction fed two carriers produces their difference frequency (mixing).
2. A bare (CW) carrier is inaudible to an envelope detector and audible against a local oscillation (heterodyne reception).

```assert
# supply
net vsource_2.pos V 9.00 +-0.01
```

<!-- engine-provenance -->
> **Engine provenance.** The measured numbers on this page were last held against
> `bw-board@20c29a7` and `bw-circuit-ui@6ea2239` — the revisions pinned in
> `test/fixtures/siblings.json`. `test/expected-quantities-hold.test.mjs` compares
> **8 of this page's 25** numeric claims against that engine
> (0 of them disagreeing) and declines the rest with a stated reason;
> `node scripts/expected-claim-census.mjs lab-shortwave-regen` prints them one by one.
<!-- engine-provenance -->
