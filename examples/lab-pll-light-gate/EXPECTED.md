# lab-pll-light-gate — expected behaviour

## Circuit
- 9 V supply. Transmitter: an LM386 (`lm386_3`, pins 1 and 8 joined) relaxation oscillator (1 MΩ / 1 MΩ, 220 kΩ, 10 nF, about 2 kHz) flashes a red LED (`led_9`, 220 Ω) across a 20 cm gap (`light_path_26`, air; the knob is how much of the beam is blocked).
- Receiver: phototransistor (`phototransistor_10`, 10 kΩ on its emitter), 10 nF into an NPN stage (`npn_15`, 1 MΩ collector to base, 10 kΩ load), then a diode pump: 100 nF and two diodes charge 220 nF, with 100 kΩ letting it run down. That voltage drives INHIBIT of a 4046 (`cd4046_21`).
- The 4046's VCO (R1 = 100 kΩ, C1 = 10 nF, VCO_IN on +9 V: 500 Hz) drives a piezo through 1 kΩ.

## Observable behaviour
- Beam clear: the pulses keep INHIBIT at about 6.5 V; the VCO is stopped and the piezo silent.
- Beam blocked: INHIBIT runs down below half the supply within about 7 ms and the alarm sounds at 500 Hz.
- Beam clear again: silent within a few milliseconds.

## Measured on the engine
bw-board f4aaec43 / bw-circuit-ui 141b2cc, `test/lab-circuits-r6f.test.mjs`.

| state | INHIBIT | VCO |
|---|---|---|
| beam clear | 6.48 V | stopped |
| blocked, 15 ms | 3.37 V | 500.5 Hz |
| clear again | above 4.5 V | stopped |

## What this verifies
1. A pulsed light link ignores steady light: the 10 nF coupling capacitor passes only the flashes, so a bright room cannot keep the alarm quiet.
2. A diode pump turns a stream of pulses into a held voltage; when the pulses stop, it decays.
3. The 4046's INHIBIT input stops and starts its oscillator.

```assert
# t = 1 ms: VCO_IN tied to the supply; the pump is still charging
net cd4046_21.r1 V 9.00 +-0.01
net lm386_3.inp V 0.466 +-0.01
```

<!-- engine-provenance -->
> **Engine provenance.** The measured numbers on this page were last held against
> `bw-board@f48ea7c` and `bw-circuit-ui@3084f35` — the revisions pinned in
> `test/fixtures/siblings.json`. `test/expected-quantities-hold.test.mjs` compares
> **18 of this page's 28** numeric claims against that engine
> (0 of them disagreeing) and declines the rest with a stated reason;
> `node scripts/expected-claim-census.mjs lab-pll-light-gate` prints them one by one.
<!-- engine-provenance -->
