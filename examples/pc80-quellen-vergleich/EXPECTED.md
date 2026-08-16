# pc80-quellen-vergleich — expected behaviour

## Circuit
Battery 1: EMF = 9 V, r_int = 0.5 Ω → 470 Ω → green LED → return.
Battery 2: EMF = 9 V, r_int = 5.0 Ω → 470 Ω → red LED → return.

## Meter readings (hand-computed)
- **Battery 1:** I₁ = (9 − 2) / (0.5 + 470) = 7.0 / 470.5 ≈ 14.88 mA.
  V_terminal1 = 9 − 0.01488 × 0.5 = 8.993 V.
- **Battery 2:** I₂ = (9 − 2) / (5.0 + 470) = 7.0 / 475.0 ≈ 14.74 mA.
  V_terminal2 = 9 − 0.01474 × 5.0 = 8.926 V.
- **At 470 Ω load:** difference is only ~0.07 V (light load).
- **At 10 Ω load (hypothetical):** V₁ = 8.57 V vs V₂ = 6.0 V — dramatic difference.

## What this verifies
1. Same EMF, different internal R → different terminal voltages under load
2. The difference grows with load current
3. Internal resistance is the battery's hidden quality metric
