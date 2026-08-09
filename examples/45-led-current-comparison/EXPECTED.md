# 45-led-current-comparison -- expected behaviour

## Circuit

VCC (5 V) -> three parallel paths, each with a different resistor and identical red LED:
- R1 (220 Ohm) -> LED1 -> GND
- R2 (470 Ohm) -> LED2 -> GND
- R3 (1 kOhm) -> LED3 -> GND

No MCU -- all three LEDs always on at different brightness levels.

## Observable behaviour

| Path | R (Ohm) | I = (5.0 - 2.0) / R (mA) | V_R (V) | Brightness |
|------|---------|---------------------------|---------|------------|
| 1    | 220     | 13.6                      | 3.0     | bright     |
| 2    | 470     | 6.4                       | 3.0     | medium     |
| 3    | 1000    | 3.0                       | 3.0     | dim        |

- **Total supply current:** 13.6 + 6.4 + 3.0 = 23.0 mA
- **All LEDs have the same voltage drop** (2.0 V) regardless of current
- **Brightness is proportional to current**, which is set by the resistor

## What this verifies

1. Higher resistance = less current = dimmer LED
2. LED forward voltage is constant (2.0 V) independent of current
3. Resistor value is the primary control for LED brightness in a fixed-voltage circuit
