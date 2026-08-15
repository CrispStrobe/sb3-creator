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

> **Simulator limitation — this does not happen yet.** On the current bw-board
> engine the PNP never conducts: with the switch closed the base solves to
> 0.0000 V (no base current flows at all) and the collector floats at 2.0005 V
> with 0.000 mA in the load. The circuit as drawn is correct; the device model
> is not. Repro and mechanism are in `examples/AUDIT/pc25-pc36.md` — escalated,
> deliberately not worked around here.
