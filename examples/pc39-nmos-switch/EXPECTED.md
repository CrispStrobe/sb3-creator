# N-MOSFET switch

A low-side switch: the LED branch hangs from 5 V down to the MOSFET's drain,
and the MOSFET's source sits on ground. The gate is pulled to ground by a
10 kΩ resistor, and a switch lifts it to 5 V.

Measured on the engine (`audit-solve pc39-nmos-switch [--set gate=1]`):

| node | gate low | gate high |
|---|---|---|
| `q1.gate` | 0.0000 V | 5.0000 V |
| `q1.drain` | 3.0000 V | 0.1358 V |
| LED current | 0.000 mA | 2.836 mA |

The gate resistor is doing real work: with the switch open it holds the gate
at ground instead of leaving it floating. A MOSFET gate is a capacitor with no
DC path anywhere, so an unheld gate keeps whatever charge it last collected and
the transistor switches at random. The current through `rg` when the switch is
closed is 5 V / 10 kΩ = 0.5 mA, and it is the *only* current the gate ever
draws — a MOSFET is voltage-controlled, unlike a BJT.

The 0.136 V left across the drain is the on-state drop, the MOSFET equivalent
of a bipolar transistor's ~0.2 V saturation voltage. Compare
[pc05-npn-switch](../pc05-npn-switch), where the drop is larger and the control
terminal draws continuous base current.

> **Engine caveat (logged in `AUDIT/pc37-pc48.md`).** bw-board's MOSFET model
> has a saturation region only — drain current is `k·(Vgs − Vth)²` no matter
> what the drain voltage is, so there is no triode region for it to fall into
> and no `rOn` parameter. `k` here is therefore not a device datasheet number;
> it is chosen so the model's demanded current matches what this branch can
> supply. Treat this example as *on versus off*, and do not read `k` as a
> statement about any real part.

```assert
# NMOS gate low: transistor off, drain floats high
net src.pos V 5.00 +-0.01
```
