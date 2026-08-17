# 36-parallel-leds -- expected behaviour

## Circuit

VCC (5 V) splits into two parallel paths:
- Path 1: R1 (1 kOhm) -> red LED (Vf = 2.0 V) -> GND
- Path 2: R2 (1 kOhm) -> green LED (Vf = 2.0 V) -> GND

No MCU -- pure passive circuit, both LEDs always on.

## Observable behaviour

- **Current per branch:** (5.0 - 2.0) / 1000 = 3.0 mA each
- **Total current from VCC:** 3.0 + 3.0 = 6.0 mA
- **Voltage across each resistor:** 3.0 V
- **Voltage across each LED:** 2.0 V
- **LED states:** both always ON, equal brightness

## What this verifies

1. Each parallel branch is independent -- same current as a single branch
2. Total supply current is the sum of branch currents
3. Each LED has its own current-limiting resistor (correct practice)

```assert
# Equal parallel branches: both LEDs at Shockley Vf ≈ 2.03V
net led1.anode V 2.03 +-0.15
```
