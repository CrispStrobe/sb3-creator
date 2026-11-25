# lab-amp-probe-harp — expected behaviour

## Circuit
- 9 V supply. The LM386 relaxation oscillator (47 kΩ and 100 kΩ on the + input, 1 nF speed-up) with 220 nF from the − input to ground. Its timing resistor is 1 kΩ from the output to probe A, plus whatever lies between probe A and probe B (the − input).
- A harp: four resistors in a chain from probe A (2.2 kΩ, 2.2 kΩ, 2.7 kΩ, 3.3 kΩ); four touch buttons connect the taps after each of them to probe B.
- The PROBES button puts a test object between the tips: a 47 kΩ rheostat (its wiper tied to one end), its knob at 0.75 as built.
- Output to a loudspeaker through 47 µF and 47 Ω.

## Observable behaviour
- Nothing touched: no timing path, the − input sits at 0 V and the output stays high: silence.
- First touch point (3.2 kΩ in the path): about 860 Hz; second (5.4 kΩ): about 520 Hz; fourth (11.4 kΩ): about 245 Hz.
- Probes on the test object (11.75 kΩ): about 220 Hz. Turn it to its full 47 kΩ: the − input can no longer reach the upper threshold and the tone stops — no continuity.

## Measured on the engine
bw-board f4aaec43, `test/lab-circuits-r6c.test.mjs`: idle swing 0.021 V (no tone); touch points 860.3 Hz, 516.9 Hz and 245.3 Hz (first, second, fourth); probes on 11.75 kΩ 218.0 Hz; on 47 kΩ 0.001 V swing.

## What this verifies
1. The resistance in the timing path sets the pitch: more resistance, lower note.
2. A resistor chain with taps is a keyboard.
3. Above a limit the oscillator cannot complete its cycle: a continuity tester that falls silent.

## Simulation notes
The upper limit comes from the LM386's 50 kΩ input resistance: the − input can charge at most to 8.1 V × 50 k/(50 k + R).

```assert
# 1 ms after switch-on (the solve assert-physics runs)
net lm386_3.vout V 8.07 +-0.03
net lm386_3.inp V 5.11 +-0.02
net lm386_3.inn V 0.000 +-0.01
```

<!-- engine-provenance -->
> **Engine provenance.** The measured numbers on this page were last held against
> `bw-board@2c62bd5` and `bw-circuit-ui@15b936d` — the revisions pinned in
> `test/fixtures/siblings.json`. `test/expected-quantities-hold.test.mjs` compares
> **14 of this page's 33** numeric claims against that engine
> (0 of them disagreeing) and declines the rest with a stated reason;
> `node scripts/expected-claim-census.mjs lab-amp-probe-harp` prints them one by one.
<!-- engine-provenance -->
