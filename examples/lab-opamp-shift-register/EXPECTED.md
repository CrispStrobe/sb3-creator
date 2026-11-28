# lab-opamp-shift-register — expected behaviour

## Circuit
- 9 V supply. Three LM324 sections are latches. Each + input hangs between its own output (100 kΩ) and ground (100 kΩ), so it sits at half the output: above the shared threshold while the output is high, at ground while low. The three − inputs share a threshold from 100 kΩ / 27 kΩ, with 33 nF to +9 V, which holds them high for the first moment: power-on reset.
- CLOCK (button_3) lifts the clock line to +9 V (10 kΩ to ground otherwise).
- Clear: 22 nF and a diode from the clock line kick the shared − input up by about 3 V.
- Set, per stage: 47 nF from the clock line into a kick node (100 kΩ to ground), a diode from it into the + input, and a steering diode from it to the previous stage's delayed output (10 kΩ into 1 µF). The kick node can rise only as far as that delayed output.
- DATA (switch_5: +9 V through 10 kΩ, 47 kΩ and 1 µF to ground) is the first stage's steering input. A red LED (1 kΩ) on each output.

## Observable behaviour
- Switch-on: 000.
- DATA on, two presses: 100, 110. DATA off, two presses: 011, 001. DATA on, one long press: 100. DATA off, short and normal presses: 010, 001, 000.

## Measured on the engine
bw-board d4113b4b, `test/lab-circuits-r6h.test.mjs`: start 000, shared − input 1.913 V; a set latch 7.22 V holding its + input at 3.61 V; sequence 100 110 011 001 100 010 001 000 with presses of 30 ms, 200 ms and 5 ms.

## What this verifies
1. An op-amp with positive feedback is a one-bit memory.
2. A clock edge steered by the neighbour's previous value moves every bit one place at once.
3. The delay between a stage's output and the next stage's steering diode (10 ms) is what stops a change rippling through all three on one edge; press length does not matter because only the rising edge acts.

## Simulation notes
Wait about 30 ms between presses (three times the 10 ms delay) so each steering node has followed its stage; a learner's clicks are far slower.

```assert
# 1 ms after switch-on (the solve assert-physics runs): power-on reset still holding the - inputs high
net lm324_9.1_neg V 3.62 +-0.15
net lm324_9.1_out V 0.005 +-0.02
net lm324_9.3_out V 0.005 +-0.02
```

<!-- engine-provenance -->
> **Engine provenance.** The measured numbers on this page were last held against
> `bw-board@818e026` and `bw-circuit-ui@659431c` — the revisions pinned in
> `test/fixtures/siblings.json`. `test/expected-quantities-hold.test.mjs` compares
> **22 of this page's 29** numeric claims against that engine
> (0 of them disagreeing) and declines the rest with a stated reason;
> `node scripts/expected-claim-census.mjs lab-opamp-shift-register` prints them one by one.
<!-- engine-provenance -->
