# lab-fusion-divider — expected behaviour

## Circuit
- 9 V supply. Half of an LM358 is a square-wave oscillator: three 100 kΩ resistors at its + input (to +9 V, to ground, from its output) set the two switching levels, and 100 nF at its - input charges and discharges through 15 kΩ plus the RATE pot (100 kΩ used as a variable resistor).
- Its output clocks a two-transistor divider: two NPNs cross-coupled through 22 kΩ (with 470 pF across each), 2.2 kΩ collector resistors, 47 kΩ from each base to ground.
- Steering: the clock reaches each base through 1 nF and a diode; the diode's anode is held by 47 kΩ at the OTHER transistor's collector, so only the transistor that is off receives the rising edge.
- A green LED with 1 kΩ from the first transistor's collector to ground shows the divider's output. The second LM358 half is unused.

## Observable behaviour
- The op-amp clock runs at about 108 Hz with RATE in the middle; its high and low times are not equal (the LM358's output reaches about 7.5 V, not 9 V).
- The divider changes state on every rising clock edge: about 54 Hz, and high exactly half the time.
- Turning RATE changes both together; at the slow end the LED visibly flickers, at the fast end it looks steady.

## Measured on the engine
RATE at 0.5: clock 108 Hz, divider 54 Hz with a duty of 0.50 (over 40 ms after 15 ms of start-up). `test/lab-circuits-r6d.test.mjs` holds these.

## Why
A divide-by-two can only be in step with every second edge, so its high and low times are both exactly one clock period, whatever the clock's own duty. That even split is what a flicker test needs: the LED's brightness does not change as the frequency is turned.

## What this verifies
1. An op-amp comparator with RC feedback is an astable.
2. A transistor flip-flop with steering diodes divides by two with a 50 % duty.

## Simulation notes
The on-screen LED is drawn at the screen's frame rate, so the flicker you see on screen is not the flicker a real LED would show; the frequencies above are the circuit's.

```assert
# t = 1 ms: oscillator output high, divider started with the second transistor off
net vsource_2.pos V 9.00 +-0.01
net lm358_3.1_out V 7.49 +-0.05
net lm358_3.1_pos V 5.50 +-0.05
net npn_16.collector V 0.06 +-0.05
```

<!-- engine-provenance -->
> **Engine provenance.** The measured numbers on this page were last held against
> `bw-board@d4113b4` and `bw-circuit-ui@0b594d6` — the revisions pinned in
> `test/fixtures/siblings.json`. `test/expected-quantities-hold.test.mjs` compares
> **13 of this page's 22** numeric claims against that engine
> (0 of them disagreeing) and declines the rest with a stated reason;
> `node scripts/expected-claim-census.mjs lab-fusion-divider` prints them one by one.
<!-- engine-provenance -->
