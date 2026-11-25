# lab-bounce-counter — expected behaviour

## Circuit
- 5 V supply. A 74HC93 binary counter, used as its 3-bit half: CLK B in, QB, QC, QD out to three red LEDs (1 kΩ each): the count 0 … 7 in binary. CLK A is grounded and QA unused.
- **CLOCK FROM** (slide switch) picks the clock. **BOUNCY** (as authored): a push button to +5 V with 10 kΩ to ground, straight in. **CLEAN**: the same kind of button charges a 1 µF electrolytic through 1 kΩ, with 100 kΩ to discharge it, and a 555 with TRIGGER and THRESHOLD tied together on the capacitor acts as a Schmitt trigger (CONTROL decoupled with 10 nF). Its output falls once per press.
- Both buttons bounce: each closing and opening is followed by a few brief reversals within 5 ms (the engine's contact bounce: 4 on a press, 2 on a release, from a fixed seed).
- **RESET** to +5 V on both R0 inputs, 10 kΩ down.

## Observable behaviour
- BOUNCY: one press adds 4 to the count, its release 3 more: every opening of the contact is a falling edge.
- CLEAN: each press adds exactly 1.

## Measured on the engine
`test/lab-circuits-r6e.test.mjs`: after RESET 0; one press of BOUNCY 4, its release 7; switched to CLEAN and reset, three presses count 1, 2, 3.

## What this verifies
1. Mechanical contacts bounce; a fast counter sees every bounce as a separate press.
2. An RC filter slower than the bounce plus a Schmitt trigger gives one clean edge per press (debouncing).

## Simulation notes
The bounce timing is pseudo-random from the buttons' bounceSeed, so the counts repeat exactly from run to run; a real button gives a different number each time. The counter's 1-bit half is left out because in the engine an edge that reaches CLK B while RESET is held is counted once RESET is let go (an engine model issue, reported with this bench), which would make RESET after an odd count show 2.

```assert
# at rest: count 0, the Schmitt trigger's output high
net 74hc93_3.qb V 0.00 +-0.05
net timer_555_11.output V 5.00 +-0.05
net vsource_2.pos V 5.00 +-0.01
```

<!-- engine-provenance -->
> **Engine provenance.** The measured numbers on this page were last held against
> `bw-board@b094eb2` and `bw-circuit-ui@0b594d6` — the revisions pinned in
> `test/fixtures/siblings.json`. `test/expected-quantities-hold.test.mjs` compares
> **8 of this page's 11** numeric claims against that engine
> (0 of them disagreeing) and declines the rest with a stated reason;
> `node scripts/expected-claim-census.mjs lab-bounce-counter` prints them one by one.
<!-- engine-provenance -->
