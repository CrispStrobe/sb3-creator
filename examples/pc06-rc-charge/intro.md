---
level: intermediate
age: 12+
prereqs: [pc01-led-resistor]
teaches: [capacitor, rc-time-constant, exponential-charge]
---
## What you see
A capacitor charges through a resistor. The voltage across the capacitor rises from 0 V toward 5 V, following a smooth curve — fast at first, then slower and slower.

## Try this
1. Click **Sim** and watch the capacitor voltage rise over time.
2. Note when it reaches about 3.16 V (63% of 5 V) — that is one time constant, τ = RC = 1.0 second.
3. After about 5 seconds (5τ), the voltage is within 1% of 5 V — effectively fully charged.

## What is going on
A capacitor stores charge. When you connect it through a resistor to a voltage source, current flows in and the voltage rises. But as the capacitor charges, the voltage difference across the resistor shrinks, so the current slows down. This gives the characteristic exponential curve: V(t) = 5 × (1 − e^(−t/RC)). The time constant τ = R × C = 10 kΩ × 100 µF = 1.0 second tells you how fast the charging happens.

## Why it matters
RC circuits are everywhere: timing circuits, filters, power supply smoothing, debouncing switches. The time constant is the single number that controls all of them. If you understand this curve, you understand half of analogue electronics.

## Go further
- [pc29-capacitor-discharge](../pc29-capacitor-discharge) — the reverse: watch a capacitor discharge.
- [pc21-rc-smoothing](../pc21-rc-smoothing) — using an RC circuit to smooth a signal.
- Experiment: change R to 20 kΩ. The time constant doubles — verify that the voltage at t = 2 s matches the old value at t = 1 s.
