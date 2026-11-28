# lab-555-direction-tester — expected behaviour

## Circuit
- 9 V supply. 555 astable (timer_555_3): 1 kΩ, 10 kΩ, 100 nF (about 680 Hz) on a piezo (piezo_8). Its reset pin is held low by 10 kΩ (resistor_9): silent.
- Red probe: +9 V through 1 kΩ (resistor_10). Black probe: the reset pin. Two slide switches (slide_switch_11 red, slide_switch_12 black) put the probes on socket row A and row K (left) or the other way round (right).
- Socket: buttons put a silicon diode (button_13), a red LED (button_15), an NPN's base junction (button_17, base on A) or a PNP's (button_19, base on A) between A and K. Each transistor's collector sits on row K with its emitter.
- LEAK (switch_21): 4.7 kΩ plus a 47 kΩ rheostat (potentiometer_23) from the control pin to ground.

## Observable behaviour
- Nothing in the socket: silent.
- Probes forward (red on A): diode, LED and NPN sound at 679 Hz (reset pin 7.66 / 6.77 / 7.54 V); the PNP is silent.
- Probes reversed: diode, LED and NPN silent; the PNP sounds. An NPN beeps red-on-base, a PNP black-on-base.
- LEAK on (with the diode sounding): 725 Hz with the rheostat at full resistance, 758 Hz at half, 976 Hz at its minimum (CV 5.64 / 5.37 / 3.51 V).

## Measured on the engine
bw-board 2965782a, `test/lab-circuits-r10b.test.mjs`: 679.3 Hz for every conducting part, 0 Hz for every blocking one; with LEAK 724.6 / 757.6 / 976.3 Hz.

## What this verifies
1. A junction conducts only one way: the reset pin is lifted above its 2.7 V threshold only when the part conducts from red to black.
2. An NPN's base is the anode of its junctions, a PNP's base the cathode.
3. Pulling the control pin down lowers both 555 thresholds, so the capacitor reaches them sooner: the pitch rises.

## Simulation notes
The red LED drops more than the diode (reset 6.77 V instead of 7.66 V) but still clears the threshold. A transistor's collector left open on its own gave the solver a node held only by a junction; tied to the emitter it is the same test.

```assert
# switched on, socket empty: reset held low, silent
net timer_555_3.reset V 0 +-0.01
net timer_555_3.output V 0 +-0.01
net slide_switch_11.a V 9.0 +-0.01
net timer_555_3.control V 6.0 +-0.01
```

<!-- engine-provenance -->
> **Engine provenance.** The measured numbers on this page were last held against
> `bw-board@818e026` and `bw-circuit-ui@659431c` — the revisions pinned in
> `test/fixtures/siblings.json`. `test/expected-quantities-hold.test.mjs` compares
> **8 of this page's 22** numeric claims against that engine
> (0 of them disagreeing) and declines the rest with a stated reason;
> `node scripts/expected-claim-census.mjs lab-555-direction-tester` prints them one by one.
<!-- engine-provenance -->
