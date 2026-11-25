# lab-opamp-sawtooth — expected behaviour

## Circuit
- 9 V supply; 10 kΩ / 10 kΩ make a half-supply reference for both sections of an LM324.
- Section 2: Schmitt trigger, − input on 4.5 V, + input fed through 10 kΩ from the integrator output and through 22 kΩ from its own output.
- Section 1: integrator, 470 nF (capacitor_10) from output to − input, + input on 4.5 V, charged from the trigger's output through 47 kΩ (resistor_6).
- SHAPE (switch_7, open as built): closes a 1N4148 (diode_8) in series with 2.2 kΩ beside the 47 kΩ, so it conducts only while the trigger's output is low.
- Red LED (led_14) on the square, yellow (led_16) on the triangle, each through 1 kΩ.

## Observable behaviour
- SHAPE open: a triangle between 3.27 V and 6.54 V at the integrator, a square at the trigger; period 42.8 ms (about 23 Hz), the integrator falling for 16.2 ms and rising for 26.6 ms. The red LED flickers, the yellow one glows with the ramp.
- SHAPE closed: the rise is now only 0.86 ms, the fall unchanged at 26.6 ms: a sawtooth, and at the trigger output a train of short pulses; period 27.4 ms.

## Measured on the engine
bw-board 2965782a, `test/lab-circuits-r10c.test.mjs`: triangle 3.27–6.54 V, period 42.77 ms (16.15 + 26.6 ms); with SHAPE closed 27.42 ms (0.86 + 26.56 ms).

## What this verifies
1. The integrator's slope is the current through its input resistor divided by its capacitance: 47 kΩ against 2.2 kΩ in parallel makes one slope about thirty times steeper.
2. The Schmitt trigger's two thresholds (3.27 V and 6.54 V) set the amplitude; the slopes set the time.

## Simulation notes
The two halves of the triangle differ (16.2 ms and 26.6 ms) because the trigger's output swings from 0 V to 7.2 V around a 4.5 V reference: 4.5 V drives the integrator one way, only 2.7 V the other.

```assert
# 1 ms after switch-on (the solve assert-physics runs)
net resistor_3.b V 4.5 +-0.01
net lm324_5.2_pos V 3.239 +-0.03
net lm324_5.1_out V 4.703 +-0.03
```

<!-- engine-provenance -->
> **Engine provenance.** The measured numbers on this page were last held against
> `bw-board@9de91e3` and `bw-circuit-ui@3084f35` — the revisions pinned in
> `test/fixtures/siblings.json`. `test/expected-quantities-hold.test.mjs` compares
> **21 of this page's 37** numeric claims against that engine
> (0 of them disagreeing) and declines the rest with a stated reason;
> `node scripts/expected-claim-census.mjs lab-opamp-sawtooth` prints them one by one.
<!-- engine-provenance -->
