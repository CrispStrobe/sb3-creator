# lab-opamp-binary-counter — expected behaviour

## Circuit
- 9 V supply. **Clock:** one op-amp of an LM324 as an astable (three 100 kΩ thresholds, 22 kΩ into 4.7 µF), about 6.7 cycles a second.
- **Each bit** is a transistor flip-flop: two NPN, collectors through 1 kΩ to +9 V (the "1" side through a red LED), each collector feeding the other base through 22 kΩ. Steering: from each collector 100 kΩ to a 1N4148 whose anode is that transistor's base, and 2.2 nF from the trigger line to the same point. A falling edge on the trigger line pulls the base of whichever transistor is on below zero, so every falling edge flips the pair.
- The clock is bit 0's trigger line. Bit 1's trigger line is bit 0's "0" collector, which falls when bit 0 goes from 1 to 0.
- **RESET**: +9 V through 1 kΩ and a 1N4148 to each "0" side base: both bits to 0.

## Observable behaviour
- After RESET: 00. Then at each falling clock edge: 01, 10, 11, 00, 01 …
- At switch-on the flip-flops land in whichever state the power-up race gives (here 11).

## Measured on the engine
`test/lab-circuits-r6e.test.mjs`: after RESET 00, then after five falling clock edges 01, 10, 11, 00, 01; one clock cycle takes about 150 ms.

## What this verifies
1. A flip-flop with steering diodes toggles on each edge: it divides the frequency by two.
2. Two in a row count in binary: the second flips when the first goes from 1 to 0, which is the carry.

## Simulation notes
The count is read 30 ms after each falling clock edge.

```assert
# 1 ms after switch-on: the clock's output high, + at its upper threshold
net lm324_3.1_out V 7.48 +-0.05
net lm324_3.1_pos V 5.49 +-0.05
```

<!-- engine-provenance -->
> **Engine provenance.** The measured numbers on this page were last held against
> `bw-board@2965782` and `bw-circuit-ui@e3441d2` — the revisions pinned in
> `test/fixtures/siblings.json`. `test/expected-quantities-hold.test.mjs` compares
> **9 of this page's 13** numeric claims against that engine
> (0 of them disagreeing) and declines the rest with a stated reason;
> `node scripts/expected-claim-census.mjs lab-opamp-binary-counter` prints them one by one.
<!-- engine-provenance -->
