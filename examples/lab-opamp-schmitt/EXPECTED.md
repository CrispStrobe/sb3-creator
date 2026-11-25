# lab-opamp-schmitt — expected behaviour

## Circuit
- 9 V supply. One LM324 section; its − input at half the supply (two 10 kΩ).
- The INPUT pot (potentiometer_3, across the supply) reaches the + input through 22 kΩ; a voltmeter shows the wiper.
- FEEDBACK (switch_7, closed as built) puts 100 kΩ from the output to the + input.
- Red LED (1 kΩ to ground) lit while the output is high; green LED (1 kΩ from +9 V) lit while it is low. The other three sections are parked.

## Observable behaviour
- With feedback: turning up, the output switches high at an input of about 5.57 V; turning down, it switches low only at about 3.76 V. Between them the LED shows where the input came from.
- Without feedback: up and down at 4.5 V.
- Output high 7.22 V, low 0.35 V.

## Measured on the engine
bw-board d4113b4b, `test/lab-circuits-r6h.test.mjs` (pot steps of 0.005): feedback up 5.566 V, down 3.756 V; no feedback up 4.544 V, down 4.499 V; output 7.224 V / 0.346 V; wiper in the middle reached from below 0.347 V, from above 7.223 V.

## What this verifies
1. Positive feedback splits one threshold into two: 4.5 V × 122/100 = 5.49 V up and (549 − 7.22 × 22)/100 = 3.90 V down by hand, the measured points sit a little apart because the pot's wiper is loaded by the 22 kΩ.
2. Inside the hysteresis band the circuit remembers its last state.

## Simulation notes
The engine's LM324 swings to VCC − 1.5 V less the red LED's load, hence 7.22 V.

```assert
# 1 ms after switch-on (the solve assert-physics runs): input 4.42 V, below the upper threshold
net lm324_6.1_neg V 4.50 +-0.01
net lm324_6.1_out V 0.347 +-0.03
net lm324_6.1_pos V 3.68 +-0.03
```

<!-- engine-provenance -->
> **Engine provenance.** The measured numbers on this page were last held against
> `bw-board@b094eb2` and `bw-circuit-ui@0b594d6` — the revisions pinned in
> `test/fixtures/siblings.json`. `test/expected-quantities-hold.test.mjs` compares
> **14 of this page's 26** numeric claims against that engine
> (0 of them disagreeing) and declines the rest with a stated reason;
> `node scripts/expected-claim-census.mjs lab-opamp-schmitt` prints them one by one.
<!-- engine-provenance -->
