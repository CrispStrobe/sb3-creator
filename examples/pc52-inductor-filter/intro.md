---
level: intermediate
age: 12+
prereqs: []
teaches: [inductor, low-pass-filter, energy-storage]
---
## What you see
An inductor and resistor form a low-pass filter. Low-frequency signals pass through with little loss, while high-frequency signals are strongly attenuated by the inductor's rising impedance.

## Try this
1. Run the simulation and observe how a low-frequency input passes through almost unchanged.
2. Increase the input frequency and watch the output amplitude drop as the inductor blocks higher frequencies.
3. Replace the inductor with a larger value and note that the cutoff frequency shifts lower.

## What is going on
An inductor opposes changes in current. At low frequencies the current changes slowly, so the inductor acts like a short circuit and the signal passes. At high frequencies the current must change rapidly, the inductor's impedance rises (X_L = 2*pi*f*L), and it drops most of the voltage, leaving little at the output. This is the dual of an RC filter: the capacitor blocks DC while the inductor blocks AC, but both create a low-pass characteristic when paired with a resistor.

## Why it matters
Inductor filters handle higher currents than RC filters without wasting power in a resistor. They are standard in power supplies, where switching noise must be filtered from the DC output without significant voltage drop or heat.

## Go further
- [pc50-two-stage-rc](../pc50-two-stage-rc) — compare with an RC-based low-pass filter.
- [pc56-inductor-freewheel](../pc56-inductor-freewheel) — what happens when you suddenly interrupt an inductor's current.
- Experiment: add a capacitor after the inductor to form an LC filter and observe the sharper roll-off and possible resonance.
