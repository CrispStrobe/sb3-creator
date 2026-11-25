# lab-opamp-monoflop — expected behaviour

## Circuit
- 9 V supply. The second half of an LM358 buffers half the supply from 10 kΩ / 10 kΩ: the circuit's middle.
- First half: its + input sits between the middle (22 kΩ) and its own output (22 kΩ). 47 kΩ from the output charges 10 µF, which hangs from the - input to the middle.
- A slide switch (right = position 1, as authored) adds a 1N4148 diode from the - input (anode) to the middle (cathode).
- START: 100 kΩ holds one side of a 100 nF capacitor at +9 V, the other side is the + input; the button pulls the 100 kΩ side to ground.
- A green LED with 1 kΩ from the output to ground (lit while the output is high), a red LED with 1 kΩ from +9 V to the output (lit while it is low).

## Observable behaviour
- Switch-on: the output starts low (red) for one pulse, then goes high (green) and stays there. Once the capacitor has settled, the diode holds the - input at about 4.95 V, below the + input's 5.9 V.
- Press START: the 100 nF kicks the + input down, the output falls (red) and the capacitor runs down through 47 kΩ. After about 0.38 s it reaches the + input's lowered level and the output goes high again by itself.
- Slide the switch left (no diode): the circuit blinks red and green on its own, about once a second.

## Measured on the engine
At 1 ms the output is 0.37 V. After 2.5 s: output 7.24 V, - input 4.95 V. START: output 0.37 V, back high after 380 ms (+-30); high again 300 ms later. Without the diode: 0.95 Hz. `test/lab-circuits-r6d.test.mjs` holds these.

## Why
In the astable the capacitor swings between the two levels the + input takes. The diode stops it on its way up a little above the middle, short of the upper level, so the swing stalls there and the circuit waits. A kick from the button starts one downward swing, and the timing of that one swing is the pulse.

## What this verifies
1. An op-amp astable becomes a monostable when one diode clamps its timing capacitor.
2. The pulse length is set by the RC and the two levels, not by how long the button is held.

```assert
# t = 1 ms: middle established, output low for the switch-on pulse
net vsource_2.pos V 9.00 +-0.01
net lm358_3.2_out V 4.50 +-0.01
net lm358_3.1_out V 0.37 +-0.05
net lm358_3.1_pos V 3.03 +-0.05
```

<!-- engine-provenance -->
> **Engine provenance.** The measured numbers on this page were last held against
> `bw-board@9de91e3` and `bw-circuit-ui@3084f35` — the revisions pinned in
> `test/fixtures/siblings.json`. `test/expected-quantities-hold.test.mjs` compares
> **14 of this page's 28** numeric claims against that engine
> (0 of them disagreeing) and declines the rest with a stated reason;
> `node scripts/expected-claim-census.mjs lab-opamp-monoflop` prints them one by one.
<!-- engine-provenance -->
