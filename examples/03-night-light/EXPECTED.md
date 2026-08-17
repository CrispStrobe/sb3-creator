# 03-night-light — expected behaviour

## Circuit

- Voltage divider: VCC → 10 kΩ fixed resistor → junction → LDR (modelled as
  variable resistor, ~5 kΩ at moderate light) → GND. Junction → MCU P1.3 (ADC).
- VCC → 1 kΩ → white LED (Vf = 2.0 V) → MCU P1.0 (active-low).

## Program

Reads the LDR voltage divider every 100 ms. Below threshold 200 (~1.0 V,
dark): LED on. Above threshold: LED off.

## Observable behaviour

| light level | LDR resistance | P1.3 voltage | ADC reading | LED |
|---|---|---|---|---|
| bright | ~1 kΩ | 5 × 1k/(10k+1k) ≈ 0.45 V | ~93 | ON (< 200) |
| moderate | ~5 kΩ | 5 × 5k/(10k+5k) ≈ 1.67 V | ~341 | OFF (> 200) |
| dark | ~50 kΩ | 5 × 50k/(10k+50k) ≈ 4.17 V | ~853 | OFF (> 200) |

Note: the LDR is modelled as a fixed resistor in the circuit JSON. In a real
simulation, the user would adjust it interactively. The threshold of 200
corresponds to ~1.0 V at the divider junction.

## What this verifies

1. Voltage divider read via ADC
2. Threshold comparison with IF/ELSE
3. Active-low LED control based on sensor input

```assert
# LDR divider (modeled as pot at 50%): sensor = 2.500V
net POT_ldr.wiper V 2.50 +-0.05
```
