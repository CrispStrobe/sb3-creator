# lab-crossing-latch — expected behaviour

## Circuit
- 9 V supply. Half of an LM358 is a comparator: its - input sits a little above half the supply (10 kΩ / 10 kΩ from +9 V, lifted slightly by the 100 kΩ that leads on to the + input).
- Its + input hangs between that divider (100 kΩ) and its own output (100 kΩ): positive feedback. 100 nF from the + input to +9 V starts it high at switch-on.
- Two track contacts (buttons): ARRIVE pulls the + input to ground, LEAVE pulls it to +9 V.
- The output pulls current through a yellow LED and 10 kΩ out of the base of a PNP (47 kΩ base to emitter, emitter at +9 V). The PNP's collector is the supply of a two-transistor flasher: two NPNs, each with 1 kΩ and a red LED in its collector, 47 kΩ base resistors and 10 µF cross couplings.
- The second half of the LM358 is unused (inputs grounded).

## Observable behaviour
- Switch-on: the output sits high at about 7.5 V, the + input at about 6.0 V, above the 4.6 V reference, so the comparator holds itself there. The flasher has no supply (below 0.1 V) and is dark.
- Press ARRIVE (a train reaches the crossing): the output falls to about 0.04 V and the + input to about 2.2 V, below the reference, so it stays there after the button is let go. The yellow LED lights, the PNP feeds the flasher about 8.9 V and the two red lamps blink in turn, a little under twice a second.
- Press LEAVE: the output goes high again and stays high, the flasher goes dark.

## Measured on the engine
Power-on: output 7.50 V, + input 6.04 V, flasher supply 0.09 V. After ARRIVE: output close to ground, + input 2.17 V, flasher supply 8.91 V; over 1.2 s the first lamp's transistor changes state 4 times (1.66 Hz flasher) and both lamps are lit together in only 3 of 60 samples. After LEAVE: output 7.50 V, flasher unpowered again. `test/lab-circuits-r6d.test.mjs` holds these.

## Why
A comparator with positive feedback has two stable states: whichever way the output points, the resistor from the output drags the + input further the same way. The contacts only need to tip it. With the output high, the 1.5 V left between it and +9 V is not enough for the yellow LED and the PNP's base-emitter junction together, so the PNP is off.

## What this verifies
1. Three resistors turn a comparator into a set/reset latch.
2. A PNP switches the supply of a two-transistor astable.

```assert
# t = 1 ms: the latch has started high, flasher unpowered
net vsource_2.pos V 9.00 +-0.01
net lm358_3.1_out V 7.50 +-0.05
net lm358_3.1_neg V 4.69 +-0.03
net pnp_14.collector V 0.09 +-0.05
```

<!-- engine-provenance -->
> **Engine provenance.** The measured numbers on this page were last held against
> `bw-board@f4aaec4` and `bw-circuit-ui@141b2cc` — the revisions pinned in
> `test/fixtures/siblings.json`. `test/expected-quantities-hold.test.mjs` compares
> **27 of this page's 33** numeric claims against that engine
> (0 of them disagreeing) and declines the rest with a stated reason;
> `node scripts/expected-claim-census.mjs lab-crossing-latch` prints them one by one.
<!-- engine-provenance -->
