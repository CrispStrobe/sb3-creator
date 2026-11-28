# lab-beeper-diode-check — expected behaviour

## Circuit
- 9 V supply. An LM386 relaxation oscillator (47 kΩ from the output and 100 kΩ from +9 V on the + input, 1 nF speed-up; 10 kΩ and 100 nF on the − input) drives a loudspeaker through 47 µF and 47 Ω.
- A kill NPN from the + input to ground, its base fed through 47 kΩ from +9 V, holds the oscillator silent. A sense NPN from that base to ground releases it when it conducts; its base is fed from the black probe through 4.7 kΩ, with 47 kΩ to ground.
- The red probe is fed from the middle of two 1 kΩ across the supply: half the supply, low enough that no junction under test is driven into reverse breakdown.
- A socket: four buttons put a silicon diode (1N4148), a germanium diode (1N34A), a red LED or an infrared LED between the anode row A and the common cathode row K. Two slide switches clip the probes: red probe left on A / right on K, black probe left on K / right on A. A voltmeter reads A against K.

## Observable behaviour
- Nothing in the socket: silence.
- Both switches left (forward): each of the four beeps (about 616 Hz); the meter shows its drop: silicon 0.56 V, germanium 0.28 V, infrared LED 0.94 V, red LED 1.53 V (the LED glows faintly at about 0.44 mA).
- Both switches right (reversed): silence for all four; each blocks the whole probe voltage.
- Black right, red left: both probes on row A — a short, so it beeps with nothing pressed.

## Measured on the engine
bw-board d4113b4b, `test/lab-circuits-r6h.test.mjs`: idle 0.001 V pp; forward 7.17–7.18 V pp for all four with drops 0.563 V (Si), 0.277 V (Ge), 0.938 V (IR), 1.527 V (red LED) at 0.62, 0.68, 0.55 and 0.44 mA into the sense base; reversed 0.000–0.001 V pp, the current then 0.45 µA (the voltmeter's own) and 0.65 µA with the germanium diode; probes on one row 7.17 V pp.

## What this verifies
1. A diode conducts in one direction only; the beeper finds which.
2. Forward voltage depends on the material: germanium below silicon, LEDs well above, an infrared LED below a red one.
3. A germanium diode leaks a little in reverse, still far too little to sound the beeper.

## Simulation notes
The sense transistor needs about 15 µA before its 47 kΩ base resistor lets it conduct, so reverse leakage of a microamp stays silent.

```assert
# 1 ms after switch-on (the solve assert-physics runs): socket empty, tone held off
net lm386_3.vout V 0.897 +-0.02
net npn_13.base V 0.688 +-0.02
net lm386_3.inp V 0.025 +-0.02
```

<!-- engine-provenance -->
> **Engine provenance.** The measured numbers on this page were last held against
> `bw-board@d21d6d8` and `bw-circuit-ui@d9e0982` — the revisions pinned in
> `test/fixtures/siblings.json`. `test/expected-quantities-hold.test.mjs` compares
> **24 of this page's 33** numeric claims against that engine
> (0 of them disagreeing) and declines the rest with a stated reason;
> `node scripts/expected-claim-census.mjs lab-beeper-diode-check` prints them one by one.
<!-- engine-provenance -->
