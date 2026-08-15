---
level: intermediate
age: 12+
prereqs: [pc01-led-resistor]
teaches: [push-pull, switch-logic, mutual-exclusion]
---
## What you see
Two switches, each controlling one LED. Pressing one lights the upper LED; pressing the other lights the lower one. The circuit shows how two independent control paths share a common supply.

## Try this
1. Click **Sim** with both switches open — both LEDs are dark.
2. Press one switch — its LED lights up while the other stays dark.
3. Press the other switch — now both LEDs are on. Note that this is a wiring condition to inspect, not necessarily a normal operating mode.

## What is going on
Each switch completes a separate current path from the supply through a resistor and LED to ground. The two paths are electrically independent: pressing one has no effect on the other. The name "push-pull" refers to the complementary action — one is on while the other is off in normal use, like a status indicator showing two mutually exclusive states.

## Why it matters
Push-pull indicators are everywhere: on/off lights, charge/discharge status, direction indicators. Understanding that each path is independent — and that pressing both at once is a valid circuit state even if it is not the intended one — is important for designing safe interlocks.

## Go further
- [pc36-series-interlock](../pc36-series-interlock) — a circuit that prevents both paths from being active simultaneously.
- [pc01-led-resistor](../pc01-led-resistor) — the single-LED building block.
- Experiment: add a third switch and LED. Does it change the behaviour of the existing two?
