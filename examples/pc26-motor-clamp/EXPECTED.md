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
| 100 µs | −9.0 V | −3.5 V |
| 10 µs | −90.0 V | −8.1 V |
| 1 µs | −900.0 V | −9.5 V |
| 0.1 µs | −9000.0 V | −9.7 V |

Without the diode the spike grows tenfold every time the step shrinks tenfold:
it is **unbounded**, which is the correct answer for an ideal switch opening an
inductive current (V = L·di/dt with dt → 0). Do not quote a single number for
it. With the diode it **converges** to about −9.7 V and stays there — bounded,
whatever the timebase.

Steady state before turn-off: 8.999 V at the node, 0.9 A through the 10 Ω
winding. That current is why the bound sits near 10 V rather than at one diode
drop: this engine's diode has a 10 Ω dynamic resistance, so 0.9 A through it
costs 0.7 V + 9 V. Real silicon diodes are far stiffer. The lesson is
*bounded versus unbounded*, not the exact bound.

```assert
# Motor running: 9V supply, steady state at switched node ~ 9V
net src.pos V 9.00 +-0.01
```
