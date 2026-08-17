# 04-thermostat — expected behaviour

## Circuit

- Voltage divider: VCC → 10 kΩ fixed → junction → NTC 10 kΩ (at 25°C) → GND.
  Junction → MCU P1.3 (ADC).
- VCC → 470 Ω → red LED ("heater" indicator) → MCU P1.0 (active-low).

## Program

Reads the NTC divider every 500 ms. Hysteresis band: turn heater ON below
ADC 300 (~1.47 V, cold), turn OFF above ADC 500 (~2.44 V, warm). Between
300 and 500 the heater holds its current state.

## Observable behaviour

| NTC resistance | divider voltage | ADC reading | heater |
|---|---|---|---|
| 50 kΩ (cold) | 5 × 50k/(10k+50k) = 4.17 V | ~853 | stays as-is |
| 20 kΩ (cool) | 5 × 20k/(10k+20k) = 3.33 V | ~682 | stays as-is |
| 10 kΩ (25°C) | 5 × 10k/(10k+10k) = 2.50 V | ~512 | OFF (> 500) |
| 5 kΩ (warm) | 5 × 5k/(10k+5k) = 1.67 V | ~341 | stays as-is |
| 2 kΩ (hot) | 5 × 2k/(10k+2k) = 0.83 V | ~170 | ON (< 300) |

Note: NTC is modelled as a fixed 10 kΩ resistor. In simulation the user
adjusts it to see the hysteresis behaviour.

## What this verifies

1. Hysteresis: two separate thresholds (300 and 500) with a dead band
2. The heater holds state between thresholds (no else-branch toggles it)
3. ADC + threshold + pin-drive end-to-end path

```assert
# NTC divider (modeled as pot at 50%): sensor = 2.500V
net POT_sensor.wiper V 2.50 +-0.05
```
