# lab-ir-reflect-alarm — expected behaviour

## Circuit
- 9 V supply, one LM324, one LM386.
- Section 1: astable (Schmitt trigger, 12 kΩ into 47 nF): about 1.1 kHz, pulsing the infrared LED (ir_transmitter_13) through 220 Ω.
- Phototransistor (phototransistor_14) beside it, 10 kΩ in its emitter, sees what a white surface in front reflects; the light path (light_path_48) is the distance, 20 cm as built.
- Section 2: multiple-feedback band-pass (10 kΩ, 1 kΩ, two 22 nF, 47 kΩ, around a 4.5 V midpoint), fed through 100 nF: tuned to the pulses, blind to steady light.
- A 1N34A germanium diode rectifies its output onto 1 µF (22 kΩ drains it); the meter (analog_meter_25) reads that level above the midpoint.
- Section 3: compares the level, through 100 kΩ, with 4.9 V; once over it holds itself through a diode and 10 kΩ. ALARM LED (led_34). RESET (button_31) pulls its + input down.
- Tone: an LM386 relaxation oscillator held silent by a kill NPN on its + input; the latch turns on a second NPN that takes the kill NPN's base current away.

## Observable behaviour
- Nothing near: the meter stays low, no alarm, no tone.
- Object at 5 cm: the meter rises, still below the threshold.
- Object at 3 cm: the alarm latches within a few milliseconds and the loudspeaker sounds (7 V pp at the LM386 output).
- Taking the object away does not stop it; RESET, held for a moment while the level drains away, does.
- Steady room light on the phototransistor alone does not trigger it: it is not at the pulse frequency.

## Measured on the engine
bw-board 2965782a, `test/lab-circuits-r10c.test.mjs`: latch output 7.19 V at 3 cm, off at 5 cm and 20 cm; tone 7.2 V pp while latched, 0 after RESET; room light 0.05 alone: no alarm.

## What this verifies
1. A pulsed transmitter and a tuned receiver separate the reflection from ambient light.
2. Rectifier, comparator and latch turn a passing reflection into a held alarm.

## Simulation notes
The LM386's switching edges are costly for the solver; the scenario lets the tone run for only a few milliseconds.

```assert
# 1 ms after switch-on (the solve assert-physics runs)
net lm324_3.3_neg V 4.909 +-0.01
net lm324_3.3_out V 0.005 +-0.01
net lm386_39.inp V 0.025 +-0.02
```

<!-- engine-provenance -->
> **Engine provenance.** The measured numbers on this page were last held against
> `bw-board@d21d6d8` and `bw-circuit-ui@d9e0982` — the revisions pinned in
> `test/fixtures/siblings.json`. `test/expected-quantities-hold.test.mjs` compares
> **18 of this page's 20** numeric claims against that engine
> (0 of them disagreeing) and declines the rest with a stated reason;
> `node scripts/expected-claim-census.mjs lab-ir-reflect-alarm` prints them one by one.
<!-- engine-provenance -->
