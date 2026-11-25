# lab-diff-pair-amp — expected behaviour

## Circuit
- 9 V supply. Two NPN with exponential junctions share 4.7 kΩ to ground; 4.7 kΩ collector resistors. Q1's collector feeds the LM386's − input, Q2's its + input: the output is high while Q2's base is below Q1's.
- Q1's base is the reference (two 10 kΩ, half the supply); 150 kΩ from the output to it adds a little hysteresis.
- Q2's base, through the slide switch: left, a 10 kΩ pot across the supply; right, a 47 µF capacitor that the amplifier's output charges through 47 kΩ.
- Red LED (1 kΩ) from the output to ground, green LED (1 kΩ) from +9 V to the output.

## Observable behaviour
- Left: turning the pot up, the output flips (red off, green on) at 0.515 of its travel, with the input 4.62 V against a reference of 4.59 V. The 150 kΩ then lowers the reference to 4.38 V, so the way back needs a lower setting (0.485): a sensitive comparator with a little snap.
- Right: the output charges the capacitor until it passes the (raised) reference, flips, discharges it past the (lowered) reference, flips again: red and green blink, half period about 135 ms. This is the amplifier-chip blinker with a transistor pair in front.

## Measured on the engine
bw-board f4aaec43, `test/lab-circuits-r6c.test.mjs`: pot 0.4: input 3.60 V, reference 4.59 V, output 8.10 V; turning up in steps of 0.005 the output falls at 0.515 (input 4.62 V; the reference then drops to 4.38 V); turning down it rises again at 0.485 (input 4.37 V). Capacitor: first flip at 1.86 s, then every 130–140 ms.

## What this verifies
1. A differential pair in front of an amplifier makes a sensitive comparator.
2. Negative feedback through an RC plus a little positive feedback (hysteresis) makes it oscillate.

## Simulation notes
The capacitor starts empty, so the first flip comes after about 1.9 s.

```assert
# 1 ms after switch-on (the solve assert-physics runs)
net npn_10.base V 4.59 +-0.01
net npn_11.base V 3.60 +-0.01
net npn_10.collector V 4.65 +-0.03
net npn_11.collector V 8.23 +-0.03
net lm386_15.vout V 8.10 +-0.02
```

<!-- engine-provenance -->
> **Engine provenance.** The measured numbers on this page were last held against
> `bw-board@d4113b4` and `bw-circuit-ui@0b594d6` — the revisions pinned in
> `test/fixtures/siblings.json`. `test/expected-quantities-hold.test.mjs` compares
> **20 of this page's 25** numeric claims against that engine
> (0 of them disagreeing) and declines the rest with a stated reason;
> `node scripts/expected-claim-census.mjs lab-diff-pair-amp` prints them one by one.
<!-- engine-provenance -->
