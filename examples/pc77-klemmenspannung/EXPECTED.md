# pc77-klemmenspannung — expected behaviour

## Circuit
Battery: EMF = 9 V, r_internal = 1 Ω. Load: 100 Ω. Also 470 Ω + red LED indicator.

## Meter readings (hand-computed)
- **Total load:** 100 Ω ∥ (470 + 2) ≈ 82.6 Ω. Total R = 1 + 82.6 = 83.6 Ω.
- **Total current:** I = 9 / 83.6 ≈ 107.7 mA.
- **Terminal voltage:** V_t = 9 − 0.1077 × 1 = 8.89 V.
- **Voltage drop on internal R:** 0.108 V.
- **LED current:** (8.89 − 2) / 470 ≈ 14.7 mA.

## What this verifies
1. V_terminal = EMF − I × r_internal
2. Under load, terminal voltage is always less than EMF
3. Internal resistance is invisible to the eye but measurable with a meter
