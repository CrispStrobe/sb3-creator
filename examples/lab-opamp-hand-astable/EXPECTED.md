# lab-opamp-hand-astable — expected behaviour

## Circuit
- 9 V supply. LM324 section 1 as an inverting Schmitt trigger: + input on three 10 kΩ from +9 V, ground and its own output, so its threshold depends on the output's state.
- − input on a 22 µF capacitor (polarized_cap_11), read by voltmeter_18. CHARGE (button_7) fills it through 10 kΩ from +9 V; DRAIN (button_9) empties it through 10 kΩ to ground.
- AUTO (switch_12, open as built) adds 47 kΩ from the output to the capacitor.
- Green LED (led_15) from the output to ground: output high. Red LED (led_17) from +9 V to the output: output low.

## Observable behaviour
- At switch-on the capacitor is empty and the output high (7.24 V): green.
- Hold CHARGE: after about 0.2 s the capacitor passes 5.5 V and the output drops to a few tenths of a volt: red. It stays there after the button is let go.
- Hold DRAIN: after about 0.2 s the capacitor falls below 3 V and the output comes back: green.
- Close AUTO: the circuit charges and drains its own capacitor between 3.1 V and 5.4 V and blinks by itself, one cycle every 1.47 s.

## Measured on the engine
bw-board 2965782a, `test/lab-circuits-r10c.test.mjs`: CHARGE flips it after 205 ms (from empty), DRAIN after 195 ms (from 7.5 V); AUTO period 1.470 s, capacitor between 3.13 V and 5.41 V.

## What this verifies
1. A Schmitt trigger has two thresholds: it only flips when its input crosses the far one.
2. An astable is the same trigger charging and draining its own capacitor through a resistor.

## Simulation notes
The output's low level is a few tenths of a volt above ground, not zero, because the red LED pulls about 7 mA into it.

```assert
# 1 ms after switch-on (the solve assert-physics runs)
net lm324_3.1_pos V 5.413 +-0.02
net lm324_3.1_out V 7.24 +-0.03
net voltmeter_18.a V 0 +-0.01
```

<!-- engine-provenance -->
> **Engine provenance.** The measured numbers on this page were last held against
> `bw-board@b47e7e0` and `bw-circuit-ui@ee2b412` — the revisions pinned in
> `test/fixtures/siblings.json`. `test/expected-quantities-hold.test.mjs` compares
> **16 of this page's 24** numeric claims against that engine
> (0 of them disagreeing) and declines the rest with a stated reason;
> `node scripts/expected-claim-census.mjs lab-opamp-hand-astable` prints them one by one.
<!-- engine-provenance -->
