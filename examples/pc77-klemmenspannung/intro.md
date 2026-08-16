---
level: intermediate
age: 12+
prereqs: [pc02-voltage-divider]
teaches: [terminal-voltage, open-circuit, internal-resistance, battery]
---
## What you see
A battery (9 V, 1 Ω internal resistance) with a 100 Ω load resistor. Unloaded, the battery delivers its full open-circuit voltage. Under load, some voltage drops across the internal resistance — the terminal voltage is lower than the open-circuit voltage.

## Try this
1. Measure the voltage with no load: V = 9.0 V (open-circuit voltage = EMF).
2. Connect the 100 Ω load. I = 9 / (1 + 100) ≈ 89 mA.
3. Terminal voltage: V_terminal = 9 − I × r = 9 − 0.089 × 1 = 8.91 V.
4. The "lost" 0.09 V drops across the internal resistance.

## What is going on
Every real voltage source has an internal resistance. The more current flows, the more voltage drops internally: V_terminal = EMF − I × r_internal. The multimeter measures the terminal voltage, not the EMF. Only with no load (I = 0) are they equal.

## Go further
- [pc78-belastete-quelle](../pc78-belastete-quelle) — two different loads show different voltage sags.
- [pc79-indirekte-strommessung](../pc79-indirekte-strommessung) — measuring current through a shunt resistor.
