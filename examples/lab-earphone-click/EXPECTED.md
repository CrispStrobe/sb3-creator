# lab-earphone-click — expected behaviour

## Circuit
9 V battery (`vsource_2`) → key (`button_3`) → red LED (`led_4`) → magnetic earphone (`earphone_7`, 2 kΩ coil, 0.1 H) → back to the battery. Two slide switches (`slide_switch_5`, `slide_switch_6`) connect the earphone's two leads; at position 0 lead a takes the LED side, flipping both to position 1 reverses the earphone.

## Observable behaviour
- Key up: no current; the earphone is silent.
- Key down: the LED lights with about 3.67 mA ((9 V − 1.9 V) / 2 kΩ) and the earphone gives one click: its coil current jumps from zero.
- Key held: the current stays at 3.67 mA and the earphone is silent; a steady current does not move the diaphragm.
- Key released: a second click as the current drops to zero.
- Both slide switches flipped: the same two clicks; the direction of the current does not matter.

## Measured on the engine
bw-board f4aaec43, `test/lab-circuits-r6a.test.mjs`. The earphone reports `amps`, the RMS of the AC part of its coil current (DC removed over about 5 ms, averaged over about 20 ms): it is the click's loudness. The rows are one run, each stepped from the one before:

| moment | `amps`, either polarity |
|---|---|
| 3 ms after the key goes down | about 1.04 mA |
| key held for 130 ms | below 0.1 mA (0.036 mA) |
| 3 ms after the key comes up | about 1.05 mA |

## What this verifies
1. A magnetic earphone answers changes of current, not current: one click per switching, silence in between.
2. The polarity of the current makes no difference to a click.
3. A tone needs the current to change hundreds of times a second (the transistor oscillators do that).

## Simulation notes
The earphone is a coil (2 kΩ, 0.1 H); with the key open the loop is broken and the coil current simply stops, so the opening click is the same size as the closing one. The engine has no acoustic model of the click's sound itself; the loudness readout is the coil current's AC RMS.

```assert
# key up at t = 1 ms: nothing flows
net vsource_2.pos V 9.00 +-0.01
net earphone_7.a V 0.00 +-0.01
net earphone_7.b V 0.00 +-0.01
```

<!-- engine-provenance -->
> **Engine provenance.** The measured numbers on this page were last held against
> `bw-board@2965782` and `bw-circuit-ui@e3441d2` — the revisions pinned in
> `test/fixtures/siblings.json`. `test/expected-quantities-hold.test.mjs` compares
> **7 of this page's 19** numeric claims against that engine
> (0 of them disagreeing) and declines the rest with a stated reason;
> `node scripts/expected-claim-census.mjs lab-earphone-click` prints them one by one.
<!-- engine-provenance -->
