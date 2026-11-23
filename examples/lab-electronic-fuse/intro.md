---
level: advanced
age: 14+
prereqs: [38-npn-switch, pc32-pnp-high-side]
teaches: [current-sensing, overcurrent-protection, thyristor-latch, positive-feedback]
---
## What you see
A green LED is the load. Under it sits a tiny 4.7 Ω resistor that turns the load current into a voltage, and next to it a latch built from one NPN and one PNP transistor. A red LED shows when the fuse has blown.

## Try this
1. Click **Sim**: the green LED is on, the red one is off.
2. Press **short circuit**: the green LED goes out and the red one lights.
3. Release it. The fuse stays blown, even though the short is gone.
4. Press **reset**: the load is back.
5. Make the sense resistor smaller. Does the fuse still trip?

## What is going on
At normal current the sense resistor drops less than a tenth of a volt. A short makes the current jump, and once the drop passes about 0.6 V the sensing transistor wakes up. It turns on the PNP, the PNP feeds current back into the sensing transistor's base, and the two hold each other on for good — the same trick a thyristor uses. The latch also switches off the transistor that carries the load. Because the latch feeds itself, it stays tripped when the overload is gone; only the reset button can break the loop.

## Go further
- [lab-break-loop-alarm](../lab-break-loop-alarm) — another latch, triggered by a cut wire.
- [pc32-pnp-high-side](../pc32-pnp-high-side) — how a PNP switches.
