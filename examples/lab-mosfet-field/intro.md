# MOSFET feels a charge

A wire on the gate of a MOSFET. Bring a charged ruler near and the LED switches on, and stays on as long as the ruler stays. Take it away and the LED goes out.

**Teaches:** a MOSFET gate as a capacitor, induced charge, why MOSFETs fear static

## What to do

Click **Sim**. Turn the probe's knob slowly up from 0 (the ruler approaches), wait, then back to 0.

## What you should see

- Somewhere around a third of the way the gate passes about 2 V and the LED switches fully on.
- Hold the knob still: the LED stays on; the gate voltage does not leak away.
- Back to 0: the gate returns to 0 V and the LED goes out.

## Why it works

No current can flow into a MOSFET gate: it is one plate of a tiny capacitor. The ruler induces a charge on the wire and gate, and that charge has nowhere to go, so the gate keeps its voltage as long as the ruler stays. Unlike the Darlington detector, which only reacts while the ruler moves, the MOSFET shows where the ruler is. It also shows why MOSFETs are handled carefully: a charged finger can put tens of volts on a gate.
