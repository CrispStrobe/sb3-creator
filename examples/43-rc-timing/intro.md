---
level: intermediate
age: 12+
prereqs: []
teaches: [rc-circuit, time-constant, exponential-charge]
---
## What you see
A resistor and capacitor in series, with a voltage probe across the capacitor, and a switch that puts a second resistor across the capacitor so you can drain it and start again. When power is applied, the capacitor charges gradually — not instantly. With R = 10 kohm and C = 100 uF the time constant is exactly 1 second, slow enough to watch the voltage rise in real time.

## Try this
1. Run the simulation and watch the capacitor voltage climb from 0 V toward the supply voltage.
2. Note the time it takes to reach about 63% of the supply — that is one time constant (tau = R * C).
3. Change the resistor or capacitor value and observe how the charging speed changes proportionally.
4. Close the discharge switch for about half a second and open it again — the capacitor drains through the 1 kohm resistor and then charges once more, so you can repeat the measurement as often as you like. It does not fall all the way to 0 V: the charging resistor is still connected, so the two resistors form a divider and the floor is 5 V * 1k/11k = 0.4545 V. The rise that follows starts from there, which is what the general form V(t) = Vf + (V0 - Vf) * e^(-t/RC) is for.

## What is going on
When voltage is applied to an RC circuit, current flows through the resistor into the capacitor. As the capacitor charges, the voltage across it rises and the current decreases — the capacitor resists further charging. The voltage follows an exponential curve: V(t) = VCC * (1 - e^(-t/RC)). After one time constant (tau), the capacitor reaches 63% of VCC. After five time constants, it is effectively fully charged. This predictable timing behaviour makes RC circuits the basis of timers, filters, and debounce circuits.

## Why it matters
RC timing appears in debounce circuits, audio filters, power supply smoothing, and the 555 timer. Understanding the exponential charge curve is essential for predicting how fast a circuit responds to changes.

## Go further
- [51-555-astable](../51-555-astable) — see RC timing used inside a 555 timer to build an oscillator.
- [50-rc-scope](../50-rc-scope) — observe the RC response on an oscilloscope and understand frequency filtering.
- Experiment: predict when the capacitor reaches 3.16 V from 0 V, then verify; then discharge, note the voltage you restart from, and predict the same crossing again with the general form.
