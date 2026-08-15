# PNP high-side switch

The PNP conducts when its base is pulled below its emitter. The load is then
connected to the positive rail, illustrating the complementary arrangement to an
NPN low-side switch.

With the switch open the base sits just under the emitter (4.99 V against
5.00 V), the transistor is off, and the load branch is dark — the correct idle
state for this circuit.

Expected with the switch closed: the base is pulled to ground through `rb`, so
V_EB ≈ 4.3 V across a 10 kΩ base resistor gives roughly 0.43 mA of base current;
with β = 100 the transistor saturates, the collector rises to within a few tenths
of the 5 V rail, and the LED branch carries about (5 − 2.05) V / 1 kΩ ≈ **2.9 mA**.

## Measured on the engine (switch open)

`audit-solve pc32-pnp-high-side` at t = 1 ms:

| node | volts |
|---|---|
| emitter (VCC) | 5.0000 |
| base | 4.9900 |
| collector / rl top | 0.9960 |
| rl bottom / LED anode | 0.9960 |
| GND | 0.0000 |

With the switch open the base floats near the emitter, V_EB ≈ 0.01 V — the
PNP is off and the collector shows only leakage-level voltage (no significant
current through the LED branch).
