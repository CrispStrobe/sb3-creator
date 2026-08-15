---
level: beginner
age: 10+
prereqs: [pc01-led-resistor]
teaches: [parallel-circuits, current-splitting]
---
## What you see
Two LEDs, each with its own 1 kΩ resistor, connected in parallel across a 5 V supply. Both LEDs glow at the same brightness.

## Try this
1. Click **Sim** and check that both LEDs show the same voltage and current.
2. Change one resistor to 2.2 kΩ. That LED gets dimmer — but the other one stays the same.
3. Disconnect one branch entirely (set its resistor to a very high value). The remaining LED is unaffected.

## What is going on
In a parallel circuit each branch has the full supply voltage across it and carries its own current independently. Each LED sees (5 V − 2 V) / 1 kΩ ≈ 3 mA. The total current drawn from the supply is the sum of all branches: about 6 mA. Changing one branch does not affect the others — that is the defining property of parallel connections.

## Why it matters
Most real circuits are parallel: every appliance in your house is wired in parallel across the mains. Understanding that each branch is independent is the key to diagnosing and designing multi-load circuits.

## Go further
- [pc03-series-resistors](../pc03-series-resistors) — compare with a series arrangement where the current is shared.
- [pc17-current-compare](../pc17-current-compare) — see what happens when branches have very different resistances.
- Experiment: add a third parallel branch and predict the total supply current before simulating.
