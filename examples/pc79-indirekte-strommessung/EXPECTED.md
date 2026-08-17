# pc79-indirekte-strommessung — expected behaviour

## Circuit
Battery: EMF = 9 V, r_internal = 0.5 Ω. Series: 1 Ω shunt → 470 Ω load → red LED → return.

## Meter readings (hand-computed)
- **Total R:** 0.5 + 1 + 470 = 471.5 Ω (ignoring LED Vf in loop).
- **Current:** I = (9 − 2) / 471.5 ≈ 14.84 mA (LED Vf = 2 V subtracted from EMF).
- **Shunt voltage:** V_shunt = 14.84 mA × 1 Ω = 14.84 mV.
- **Load voltage:** V_load = 14.84 mA × 470 = 6.97 V.
- **The shunt's 14.8 mV is small** — it barely affects the circuit (<0.2% of total).

## What this verifies
1. I = V_shunt / R_shunt — Ohm's law applied to current measurement
2. Small shunt minimizes circuit disturbance
3. Voltmeter across shunt replaces ammeter in series

```assert
# 1R shunt: V_shunt = I * 1R ~ 14.8mV, battery with r_internal=0.5R
net battery_1.pos V 8.99 +-0.10
```
