# lab-ir-tone-link — expected behaviour

## Circuit
- 9 V supply. Transmitter: the LM386 tone oscillator (47 kΩ / 100 kΩ, 1 nF, 10 kΩ and 100 nF, about 616 Hz), held off by its kill NPN (47 kΩ from +9 V) until the KEY grounds that transistor's base. Its output flashes an IR LED through 220 Ω.
- Receiver across the light path (30 cm as built, knob 5–60 cm): a phototransistor with 10 kΩ to +9 V, 100 nF into a common-emitter NPN (4.7 kΩ, 470 kΩ from collector to base), and a magnetic earphone through 10 µF.

## Observable behaviour
- Key up: the transmitter output sits at 0.9 V, the IR LED is dark, the earphone is quiet.
- Key down: the IR LED flashes at about 616 Hz; the receiver turns the flashes back into a tone of the same pitch in the earphone.
- Further away less light arrives and the tone gets weaker.

## Measured on the engine
bw-board f4aaec43, `test/lab-circuits-r6c.test.mjs`: key up output 0.90 V, phototransistor collector 5.94 V, earphone 0.17 V pp (coupling capacitors settling); key down 616.3 Hz at the earphone, 5.2 V pp, the phototransistor's collector 0.12 V pp; at 60 cm 0.023 V pp and 1.66 V pp.

## What this verifies
1. A tone can ride on light: on-off keying of an IR LED.
2. A phototransistor and one transistor stage recover it.

## Simulation notes
Measured headless on the committed circuit; `test/lab-circuits-r6c.test.mjs` replays the learner's controls.

```assert
# 1 ms after switch-on (the solve assert-physics runs)
net lm386_6.vout V 0.90 +-0.02
net phototransistor_15.collector V 5.94 +-0.05
net npn_5.base V 0.69 +-0.02
```

<!-- engine-provenance -->
> **Engine provenance.** The measured numbers on this page were last held against
> `bw-board@e744ede` and `bw-circuit-ui@3084f35` — the revisions pinned in
> `test/fixtures/siblings.json`. `test/expected-quantities-hold.test.mjs` compares
> **23 of this page's 26** numeric claims against that engine
> (0 of them disagreeing) and declines the rest with a stated reason;
> `node scripts/expected-claim-census.mjs lab-ir-tone-link` prints them one by one.
<!-- engine-provenance -->
