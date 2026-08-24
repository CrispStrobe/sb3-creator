# Motor flyback clamp

The motor runs while the switch is closed. When the switch opens, the winding's
magnetic field collapses and the current has to go *somewhere*: the flyback
diode gives it a loop to run down in, instead of a voltage spike across the
opening contact.

`l1` (1 mH) is the winding inductance in series with the winding resistance —
the engine's `dc_motor` models resistance and back-EMF only, so without an
explicit inductor there is no field to collapse and nothing to see.

Measured at the switched node (`sw1.b` / `l1.a`), switch opened at t = 10 ms.
The value depends on the sample step, so the whole sweep is the result:

| sample step | no diode | with `d1` |
|---|---|---|
| 100 µs | unbounded | −9.7 V |
| 10 µs | unbounded | −9.7 V |
| 1 µs | unbounded | −9.7 V |
| 0.1 µs | unbounded | −9.7 V |

Without the diode the spike is **unbounded**, which is the correct answer for an
ideal switch opening an inductive current (V = L·di/dt with dt → 0): it grows
without limit as the step shrinks, and a single number for it would be a number
about the solver rather than about the circuit. Do not quote one. With the diode
it is **bounded at about −9.7 V** whatever the timebase.

(Re-measured 2026-08-24. The clamped column used to climb −3.5 / −8.1 / −9.5 /
−9.7 V as the step shrank; it now reads −9.7 V at every step, because the motor
winding's inductance moved onto a first-class solver inductor instead of a
device-side companion. The bound was always the teaching point; it is simply no
longer an artefact of the timebase.)

Steady state before turn-off: 8.999 V at the node, 0.9 A through the 10 Ω
winding. That current is why the bound sits near 10 V rather than at one diode
drop: this engine's diode has a 10 Ω dynamic resistance, so 0.9 A through it
costs 0.7 V + 9 V. Real silicon diodes are far stiffer. The lesson is
*bounded versus unbounded*, not the exact bound.

```assert
# Motor running: 9V supply, steady state at switched node ~ 9V
net src.pos V 9.00 +-0.01
```
