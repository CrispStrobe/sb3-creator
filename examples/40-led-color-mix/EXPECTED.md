# 40-led-color-mix -- expected behaviour

## Circuit

VCC (5 V) -> three parallel paths:
- R1 (330 Ohm) -> red LED (Vf = 2.0 V) -> GND
- R2 (330 Ohm) -> green LED (Vf = 2.0 V) -> GND
- R3 (330 Ohm) -> blue LED (Vf = 3.2 V) -> GND

No MCU -- all three LEDs always on.

## Observable behaviour

- **Red LED current:** (5.0 - 2.0) / 330 = 9.1 mA
- **Green LED current:** (5.0 - 2.0) / 330 = 9.1 mA
- **Blue LED current:** (5.0 - 3.2) / 330 = 5.5 mA
- **Total supply current:** 9.1 + 9.1 + 5.5 = 23.7 mA
- **LED states:** all three ON simultaneously

## Notes

- Blue LEDs have higher forward voltage (3.2 V vs 2.0 V), so less current flows with the same resistor
- To equalise brightness, the blue LED would need a lower resistor value
- All three colours on together produce white-ish light if LEDs are co-located

## What this verifies

1. Different LED colours have different forward voltages
2. Parallel branches with different Vf draw different currents
3. Each LED needs its own resistor
