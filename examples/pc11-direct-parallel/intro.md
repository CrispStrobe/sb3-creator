---
level: beginner
age: 10+
prereqs: [pc09-direct-led]
teaches: [parallel-circuits, independent-branches]
---
## What you see
Two LEDs in parallel, each with its own 470 Ω resistor, wired directly to a 5 V supply. Both light up at the same brightness.

## Try this
1. Click **Sim** and check that both LEDs show the same voltage and current.
2. Disconnect one branch — the other LED stays exactly the same.
3. Change one resistor to 1 kΩ. That LED dims while the other is unchanged.

## What is going on
Each branch is independent: it sees the full 5 V supply and carries its own current of about 6.4 mA. The total supply current is the sum of both branches, roughly 12.8 mA. Parallel branches do not affect each other — adding or removing one leaves the rest untouched.

## Why it matters
Parallel wiring is how the real world works: every outlet in a house, every lane of traffic, every thread in a program. Independence is the reason a blown lamp does not darken the whole house.

## Go further
- [pc04-parallel-leds](../pc04-parallel-leds) — the same idea on a breadboard.
- [pc10-direct-series](../pc10-direct-series) — compare: in series, both LEDs share the current but not the voltage.
- Experiment: add a third branch and predict the total current before simulating.
