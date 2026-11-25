# lab-amp-ic-pedestrian — expected behaviour

## Circuit
- 9 V battery, one LM386 (pins 1, 7 and 8 open) used as a one-shot.
- −IN (pin 2) is held low by 100 kΩ from the battery and 33 kΩ to ground (with the chip's own input resistance in parallel).
- +IN (pin 3) is pulled towards ground by 10 kΩ in series with a 100 kΩ pot (wired as a variable resistor), in parallel with the chip's own input resistance.
- A 100 µF electrolytic runs from the output (+) to +IN (−).
- A button connects +IN to the battery through 2.2 kΩ.
- Red LED: battery + → 1 kΩ → red LED → output (lit while the output is low). Green LED: output → 1 kΩ → green LED → ground (lit while it is high).

## Observable behaviour
- At rest +IN sits below −IN, the output is low (0.9 V) and the red LED is lit.
- A press lifts +IN to about 8 V: the output jumps to 8.1 V, green lights, red goes out.
- After release the capacitor holds +IN up and lets it fall through the pot and the chip's input resistance. When +IN has sunk to about 1.7 V the amplifier swings back: red again.
- The pot sets the green time: with the pot at its short end (10 kΩ in all) about 1.4 s; turned fully up about 5.7 s.
- At switch-on the output steps from 0 V to 0.9 V; that small step through the capacitor is not enough to fire the one-shot, so it starts at red.

## Measured on the engine
- Rest, at t = 1 ms: output 0.901 V, −IN 1.492 V; red LED about 6 mA.
- Pressed: output 8.10 V; green LED about 6 mA.
- Pot at its short end: green for 1.4 s after the release (measured to 50 ms).
- Pot fully up: green for 5.7 s (measured to 100 ms).

## What this verifies
1. A comparator with a capacitor from its output to its own input makes a one-shot (monostable): the output's own jump holds it in the new state until the capacitor has discharged.
2. The time is set by R·C at the input.
3. One output can drive one LED to ground and another from the battery: red and green take turns.

## Simulation notes
The capacitor and the input resistance inside the chip limit the longest time: the pot can add resistance only in parallel with it. `test/lab-circuits-r6b.test.mjs` presses the button with the pot at both ends and times the green phase.

```assert
# t = 1 ms: at rest. The switch-on step has lifted +IN to 0.9 V, still below -IN.
net lm386_3.vout V 0.901 +-0.03
net lm386_3.inn V 1.492 +-0.03
net lm386_3.inp V 0.901 +-0.05
```

<!-- engine-provenance -->
> **Engine provenance.** The measured numbers on this page were last held against
> `bw-board@d4113b4` and `bw-circuit-ui@0b594d6` — the revisions pinned in
> `test/fixtures/siblings.json`. `test/expected-quantities-hold.test.mjs` compares
> **20 of this page's 28** numeric claims against that engine
> (0 of them disagreeing) and declines the rest with a stated reason;
> `node scripts/expected-claim-census.mjs lab-amp-ic-pedestrian` prints them one by one.
<!-- engine-provenance -->
