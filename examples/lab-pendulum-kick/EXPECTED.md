# lab-pendulum-kick — expected behaviour

## Circuit
- 9 V supply (`vsource_2`). Two NPN transistors make an astable. Q1 (`npn_5`) carries the electromagnet of the coil pendulum (`coil_pendulum_3`), with a 1N4148 (`diode_4`) across the winding. Q2 (`npn_6`) has a green LED (`led_13`) with 1 kΩ in its collector.
- Q1 conducts for about 0.69 · 10 kΩ · 15 µF ≈ 0.1 s per cycle (`resistor_9`, `polarized_cap_7`). It then rests for a time set by 4.7 kΩ (`resistor_10`) plus the 47 kΩ pot (`potentiometer_11`) and 220 µF (`polarized_cap_8`). The LED lights during the rest.
- Pot at 1 (rest position): 4.7 kΩ, pulses about 2.6 times a second. Pot at 0: the whole 47 kΩ added, about 0.35 times a second.
- The pendulum is a paper clip (soft iron, 0.1 cm³, 0.8 g) on a 15 cm thread, hanging 8 mm above and 20 mm to the side of the pole of a wound rod (the part's default winding). Its natural frequency is √(g/L)/2π = 1.29 Hz.

## Observable behaviour
- Pot at 1 (fast pulses): the clip only twitches, 0.76° after 8 s.
- Pot at 0.82 (pulses about 1.2 times a second, a little below 1.29 Hz): the swing builds up over a few seconds, to 9.0° after 8 s.
- Pot at 0.72 (about once a second): the swing stays small again, 0.51°.
- The swing, angle, period and natural frequency are in the pendulum's tooltip and drawn above it.

## Measured on the engine
bw-board master 2c62bd54, `test/lab-circuits-r7mech.test.mjs`: after 8 s at pot 0.82 the swing is 9.0°, at pot 1 it is 0.76° and at pot 0.72 it is 0.51°. The natural frequency is 1.287 Hz.

## What this verifies
1. A pendulum responds strongly only to pulses close to its own frequency (resonance).
2. An electromagnet pulls soft iron, and energy fed in step with the motion accumulates.

## Simulation notes
bw-board `coil_pendulum` (src/magnetic-coupling.js):
- The pole is a point magnetic dipole. The iron bob raises the coil's inductance by χV|B/I|²/µ0 and is pulled with ½·i²·dL/dθ.
- The swing induces i·dL/dθ·ω back into the coil, so energy is conserved.
- The damping is Q = 12 (air and pivot).
- Because the pull is strongest near the pole, the response is nonlinear and lopsided, and the best rate lies a little below f₀.
- Driving at half the rate, which pulls only every second swing, does NOT build up a swing from rest in this model: the clip, still near the middle, is too far from the pole for the pull to matter. A real paper clip given a push may keep swinging at half rate. That is not shown here.

```assert
# the supply rail; the swing is checked in the scenario test
net vsource_2.pos V 9.00 +-0.01
```

<!-- engine-provenance -->
> **Engine provenance.** The measured numbers on this page were last held against
> `bw-board@818e026` and `bw-circuit-ui@659431c` — the revisions pinned in
> `test/fixtures/siblings.json`. `test/expected-quantities-hold.test.mjs` compares
> **9 of this page's 16** numeric claims against that engine
> (0 of them disagreeing) and declines the rest with a stated reason;
> `node scripts/expected-claim-census.mjs lab-pendulum-kick` prints them one by one.
<!-- engine-provenance -->
