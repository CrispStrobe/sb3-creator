---
level: beginner
age: 10+
prereqs: [pc04-parallel-leds]
teaches: [parallel-circuits, unequal-branches]
---
## What you see
Two LEDs in parallel with different series resistors, both powered from 9 V. They glow at different brightnesses because each branch carries a different current.

## Try this
1. Click **Sim** and compare the brightness of the two LEDs.
2. Check the voltage across each LED — they are slightly different because of the Shockley diode model (higher current = higher forward voltage).
3. Change one resistor to match the other. Now both LEDs glow equally.

## What is going on
Each parallel branch is independent: both see the full 9 V supply, but different resistor values mean different currents. The branch with the smaller resistor carries more current and glows brighter. The total supply current is the sum of both branches. Changing one branch has no effect on the other — that is the defining property of parallel circuits.

## Why it matters
Real parallel circuits almost never have identical branches. Understanding that each branch sets its own current independently lets you mix different loads on the same supply without them interfering.

## Go further
- [pc04-parallel-leds](../pc04-parallel-leds) — equal branches for comparison.
- [pc30-resistor-ladder](../pc30-resistor-ladder) — many parallel branches forming a ladder.
- Experiment: predict the current in each branch from Ohm's law, then verify with the simulator.
