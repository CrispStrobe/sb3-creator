# lab-log-roots — expected behaviour

## Circuit
- 9 V supply; a stiff 1 kΩ / 1 kΩ divider makes the reference (about half the supply) every stage works around.
- **Log stage** (op-amp 1 of an LM324): the **INPUT** pot (10 kΩ between +9 V and the reference) drives x µA through 42 kΩ into the − input; the feedback is an NPN, collector on the − input, base on the reference, emitter on the output, so the output sits one base-emitter voltage, Vt·ln(x/Is), below the reference. 100 pF across it keeps the loop calm. A meter (4.2 V full scale) from the wiper to the reference reads x: 0–100 µA.
- **Reference log stage** (op-amp 2): the same with a fixed 1 µA from 4.3 MΩ.
- **ROOT** picks a divider between the two log outputs: 10 kΩ / 10 kΩ, halfway (square root), or 20 kΩ / 10 kΩ, a third of the way from the reference side (cube root). Op-amp 4 buffers it.
- **Antilog stage**: an NPN with its emitter on the buffer and its base on the reference conducts Is·exp(Vbe/Vt); op-amp 3 (100 kΩ ‖ 100 pF feedback) turns that collector current into volts: 1 V per 10 µA on the output meter (1 V full scale).
- All three transistors are identical (Is = 10 fA, ideal exponential).

## Observable behaviour
- ROOT on square: the output is √(x · 1 µA); x = 100 µA gives about 10 µA (1 V), x = 25 µA about 5 µA.
- ROOT on cube: ∛(x · 1 µA²); x = 100 µA gives about 4.6 µA.

## Measured on the engine
`test/lab-circuits-r6e.test.mjs`, each within 0.05 of the arithmetic (every column in microamps, the reference current about 0.99):

| ROOT | x | arithmetic | output |
|---|---|---|---|
| square | 99.8 | 9.86 | 9.88 |
| square | 58.2 | 7.58 | 7.59 |
| square | 15.3 | 3.90 | 3.90 |
| cube | 100.4 | 4.59 | 4.59 |
| cube | 58.5 | 3.86 | 3.86 |

## What this verifies
1. A transistor's base-emitter voltage is the logarithm of its collector current; another transistor turns a logarithm back into a current.
2. Averaging two logarithms is taking the square root of a product; weighting them 1 : 2 takes the cube root.

## Simulation notes
The transistors are matched and at one temperature, so Is and Vt cancel exactly; real ones need a matched pair and temperature compensation. The reference current is (9 V − reference)/4.3 MΩ ≈ 0.99 µA, which the test uses as measured.

```assert
# as authored: INPUT at half, x ≈ 45 µA, square root ≈ 6.7 µA (0.67 V)
net resistor_3.b V 4.746 +-0.01
net potentiometer_5.wiper V 6.647 +-0.01
net lm324_8.1_out V 4.171 +-0.01
net lm324_8.2_out V 4.270 +-0.01
net lm324_8.4_out V 4.221 +-0.01
net lm324_8.3_out V 5.416 +-0.02
```

<!-- engine-provenance -->
> **Engine provenance.** The measured numbers on this page were last held against
> `bw-board@9de91e3` and `bw-circuit-ui@3084f35` — the revisions pinned in
> `test/fixtures/siblings.json`. `test/expected-quantities-hold.test.mjs` compares
> **28 of this page's 32** numeric claims against that engine
> (0 of them disagreeing) and declines the rest with a stated reason;
> `node scripts/expected-claim-census.mjs lab-log-roots` prints them one by one.
<!-- engine-provenance -->
