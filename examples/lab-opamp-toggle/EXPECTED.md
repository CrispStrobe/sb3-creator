# lab-opamp-toggle — expected behaviour

## Circuit
- 9 V supply; a 47 kΩ / 10 kΩ / 10 kΩ chain gives both latches' reference (upper tap) and their feedback tap (lower tap).
- Latch 1 (LM324 section 1): + input between its output (100 kΩ) and the feedback tap (47 kΩ), − input on the reference. SET (button_9) pulls the + input to +9 V through 4.7 kΩ, RESET (button_11) to ground through 4.7 kΩ. Yellow LED (led_14): latch 1 on.
- Latch 2 (section 2): the same latch, its − input reaching the reference through 10 kΩ. Its output charges 1 µF (polarized_cap_20) through 220 kΩ, so the capacitor holds the output's level of a moment ago. TOGGLE (button_18) connects the capacitor to the − input. Red LED (led_22): latch 2 on.

## Observable behaviour
- Switched on, both latches are off.
- SET turns the yellow LED on, RESET turns it off; each holds after the button is let go.
- Each press of TOGGLE changes the red LED: on, off, on, off. Holding the button down does not make it flip back. Wait about half a second between presses, until the capacitor has caught up.

## Measured on the engine
bw-board 2965782a, `test/lab-circuits-r10c.test.mjs`: outputs 7.22 V (on) and 0.005 V (off); four presses (150 ms held, 800 ms apart) give on, off, on, off, the same while held as after release.

## What this verifies
1. Positive feedback (output → + input) makes an op-amp hold either state: a latch.
2. A capacitor that lags the output remembers the old state, and steering it to the − input on a press inverts the latch: one button toggles it.

## Simulation notes
While the button is held, the capacitor sits between the output (220 kΩ) and the 2.7 V reference (10 kΩ): the − input then rests 0.4 V away from the + input on the side that keeps the new state.

```assert
# 1 ms after switch-on (the solve assert-physics runs)
net resistor_4.b V 2.572 +-0.01
net lm324_3.1_pos V 0.821 +-0.01
net lm324_3.1_out V 0.005 +-0.01
net lm324_3.2_out V 0.005 +-0.01
```

<!-- engine-provenance -->
> **Engine provenance.** The measured numbers on this page were last held against
> `bw-board@2965782` and `bw-circuit-ui@e3441d2` — the revisions pinned in
> `test/fixtures/siblings.json`. `test/expected-quantities-hold.test.mjs` compares
> **16 of this page's 20** numeric claims against that engine
> (0 of them disagreeing) and declines the rest with a stated reason;
> `node scripts/expected-claim-census.mjs lab-opamp-toggle` prints them one by one.
<!-- engine-provenance -->
