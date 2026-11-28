# lab-shortwave-regen — expected behaviour

## Circuit
- The regenerative receiver of lab-regen-receiver on a short-wave ferrite coil: 5 µH main winding (Q 100), coupling winding 8 % of its turns in the collector lead, tuning capacitor authored at 0.2506 (the tank near 6.07 MHz; oscillating, the stage runs about 1.9 kHz above the beacon).
- Antenna (2 m) on the tap through its own 20 pF (`farads` param); earth on ground.
- Grid-leak base: 100 pF from the tank top, 100 kΩ to the wiper of a 100 kΩ regeneration pot across 9 V (authored 0.95). Emitter 1 kΩ ‖ 100 nF. Magnetic earphone below the coupling winding, 10 nF to ground. (A grid leak ten times larger lets the base's bias recover so slowly after each build-up that the stage squegs — bursts at ~10 kHz, a buzz of its own — instead of oscillating steadily.)
- The antenna's broadcast: a Morse beacon at 6.0585 MHz sending "E" at 20 words per minute (a 60 ms key-down, then 540 ms of gap) and an AM station at 5.9 MHz (500 Hz tone).

## Observable behaviour
- Pot at 0.95: no oscillation; the beacon's carrier is in the tank (~0.05 V) but the earphone is silent.
- Pot at 0.75: the receiver oscillates steadily (about 5.4 V on the tank); while the key is down the base junction mixes the oscillation with the beacon's carrier and the earphone plays the difference frequency, about 1.85 kHz.
- Key up (after 60 ms): the tone dies away; the oscillation continues alone and makes no sound.
- Retuned a hair (0.2505 / 0.2507) the pitch moves (about 2.95 / 0.73 kHz): the oscillation moves, the beacon does not.
- Between about 0.80 and 0.90 the stage squegs (it bursts on and off, buzzing): near its threshold the oscillation's amplitude settles more slowly than the grid leak recovers.

## Measured on the engine
bw-board RF envelope front end (2026-11-24: the transistor's input capacitance at its large-signal value, band steps that resolve the loop between the swing and the bias), `test/lab-circuits-rf.test.mjs`, the earphone's voltage read as its strongest line and rms over a window: 0.95, 5–12 ms: 8e-6 V rms; 0.75, 18–40 ms (key down): 1850 Hz at 0.40 mV; 70–86 ms (key up): 1.2e-6 V rms. 110 simulated ms take about 9 s.

## What this verifies
1. A nonlinear junction fed two carriers produces their difference frequency (mixing).
2. A bare (CW) carrier is inaudible to an envelope detector and audible against a local oscillation (heterodyne reception).

```assert
# supply
net vsource_2.pos V 9.00 +-0.01
```

<!-- engine-provenance -->
> **Engine provenance.** The measured numbers on this page were last held against
> `bw-board@818e026` and `bw-circuit-ui@659431c` — the revisions pinned in
> `test/fixtures/siblings.json`. `test/expected-quantities-hold.test.mjs` compares
> **8 of this page's 31** numeric claims against that engine
> (0 of them disagreeing) and declines the rest with a stated reason;
> `node scripts/expected-claim-census.mjs lab-shortwave-regen` prints them one by one.
<!-- engine-provenance -->
