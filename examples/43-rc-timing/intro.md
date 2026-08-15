---
level: intermediate
age: 12+
prereqs: []
teaches: [rc-circuit, time-constant, exponential-charge]
---
## What you see
A resistor and capacitor in series, with a voltage probe across the capacitor. When power is applied, the capacitor charges gradually — not instantly. With R = 1 kohm and C = 1 mF, the time constant is exactly 1 second, slow enough to watch the voltage rise in real time.

## Try this
1. Run the simulation and watch the capacitor voltage climb from 0 V toward the supply voltage.
2. Note the time it takes to reach about 63% of the supply — that is one time constant (tau = R * C).
3. Change the resistor or capacitor value and observe how the charging speed changes proportionally.

## What is going on
When voltage is applied to an RC circuit, current flows through the resistor into the capacitor. As the capacitor charges, the voltage across it rises and the current decreases — the capacitor resists further charging. The voltage follows an exponential curve: V(t) = VCC * (1 - e^(-t/RC)). After one time constant (tau), the capacitor reaches 63% of VCC. After five time constants, it is effectively fully charged. This predictable timing behaviour makes RC circuits the basis of timers, filters, and debounce circuits.

## Why it matters
RC timing appears in debounce circuits, audio filters, power supply smoothing, and the 555 timer. Understanding the exponential charge curve is essential for predicting how fast a circuit responds to changes.

## Go further
- [51-555-astable](../51-555-astable) — see RC timing used inside a 555 timer to build an oscillator.
- [50-rc-scope](../50-rc-scope) — observe the RC response on an oscilloscope and understand frequency filtering.
- Experiment: calculate the time constant for R = 10 kohm and C = 100 uF, predict when the capacitor reaches 3.15 V (from 5 V), then verify.
