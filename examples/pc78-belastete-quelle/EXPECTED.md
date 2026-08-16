# pc78-belastete-quelle — expected behaviour

## Circuit
Battery: EMF = 9 V, r_internal = 2 Ω. Light load path: 1 kΩ + 470 Ω + green LED. Heavy load path: 100 Ω + 470 Ω + red LED.

## Meter readings (hand-computed)
- **Light path resistance:** 1000 + 470 = 1470 Ω (LED Vf subtracted from voltage).
- **Heavy path resistance:** 100 + 470 = 570 Ω.
- **Combined parallel load:** 1/(1/1470 + 1/570) ≈ 410 Ω.
- **Total with internal R:** 2 + 410 = 412 Ω.
- **Total current:** I = 9 / 412 ≈ 21.8 mA.
- **Terminal voltage:** 9 − 0.0218 × 2 = 8.96 V.
- **Heavy path gets more current:** brighter LED on that path.

## What this verifies
1. Higher load current → larger internal voltage drop
2. Both loads share the same terminal voltage
3. Battery with high internal R delivers less current to heavy loads
