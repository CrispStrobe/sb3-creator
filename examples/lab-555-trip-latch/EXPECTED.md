# lab-555-trip-latch — expected behaviour

## Circuit
- 9 V supply. Latch 555 (timer_555_3): the trip wire (switch_5, closed) holds its trigger at +9 V against 100 kΩ (resistor_6) to ground; its threshold is grounded; reset held high by 10 kΩ (resistor_7), RESET (button_8) pulls it to ground.
- Its output lights the red LED (1 kΩ) and drives the reset pin of a tone 555 (timer_555_11; 1 kΩ, 10 kΩ, 100 nF: about 680 Hz) on a piezo.

## Observable behaviour
- Armed (wire intact): output 0 V, silent.
- Wire broken: output 8.65 V, LED on, 679 Hz tone.
- Wire joined again: still on.
- RESET held: off; released with the wire intact: stays off.
- RESET while the wire is still broken: off only while held; on release the alarm is back.

## Measured on the engine
bw-board 2965782a, `test/lab-circuits-r10b.test.mjs`: latch output 8.653 V / 0 V, tone 678.7–679.1 Hz / 0 Hz.

## What this verifies
1. The 555's flip-flop as a memory: a moment with the trigger below 3 V sets it, and with the threshold grounded nothing but the reset pin clears it.
2. While the trigger is still low the set input wins as soon as reset is released.

## Simulation notes
The latch output is 8.65 V because the LED (1 kΩ) and the tone 555's reset pin share it.

```assert
# armed: trigger held high by the wire, latch off, tone 555 held in reset
net timer_555_3.trigger V 9.0 +-0.01
net timer_555_3.reset V 9.0 +-0.01
net timer_555_3.output V 0 +-0.01
net led_10.anode V 0 +-0.01
```

<!-- engine-provenance -->
> **Engine provenance.** The measured numbers on this page were last held against
> `bw-board@2965782` and `bw-circuit-ui@e3441d2` — the revisions pinned in
> `test/fixtures/siblings.json`. `test/expected-quantities-hold.test.mjs` compares
> **8 of this page's 19** numeric claims against that engine
> (0 of them disagreeing) and declines the rest with a stated reason;
> `node scripts/expected-claim-census.mjs lab-555-trip-latch` prints them one by one.
<!-- engine-provenance -->
