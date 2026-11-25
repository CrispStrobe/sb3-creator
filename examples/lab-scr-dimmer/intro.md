---
level: advanced
age: 14+
prereqs: [lab-scr-pair]
teaches: [thyristor, phase-angle-control, alternating-current, rc-phase-shift]
---
## What you see
A lamp on low-voltage AC, switched by the two-transistor thyristor, and a DIMMER pot in its gate circuit.

## What to do
1. Click **Sim**. The lamp is on, at reduced brightness.
2. Turn **DIMMER** up: the lamp gets brighter. Turn it down: dimmer, until at about a quarter it goes out.

## What is going on
A thyristor can only be switched on; on AC it switches itself off at every zero crossing, when its current stops. The gate circuit decides how far into each half-wave it fires again. The capacitor's voltage lags behind the AC, and the more resistance is in front of it, the later it reaches the firing voltage. Fire early and the lamp gets nearly the whole half-wave, fire late and only a sliver. Light dimmers and motor speed controls work this way.

## Go further
- [lab-scr-pair](../lab-scr-pair) — the thyristor on direct current.
- [lab-scr-flash](../lab-scr-flash) — the thyristor fired by a flash of light.
