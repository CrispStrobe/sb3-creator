# 16-ldr-bargraph -- expected behaviour

## Circuit

Potentiometer (10 kOhm, simulating LDR) wiper -> MCU P1.7 (ADC).
Three LEDs (green, yellow, red) on P1.0, P1.1, P1.2 via 1 kOhm resistors (active-low).

## Program

Reads ADC and lights LEDs as a bar graph with thresholds at 256, 512, and 768.

## Observable behaviour

| pot position | wiper voltage | ADC value | LEDs on          |
|-------------|---------------|-----------|------------------|
| 0%          | 0.00 V        | 0         | none             |
| 25%         | 1.25 V        | 256       | green            |
| 50%         | 2.50 V        | 512       | green, yellow    |
| 75%         | 3.75 V        | 768       | green, yellow, red |
| 100%        | 5.00 V        | 1023      | green, yellow, red |

- **LED current (each, when on):** (5.0 - 2.0) / 1000 = 3.0 mA
- **Max total current (all 3 on):** 9.0 mA
- **Pot current:** 5.0 / 10000 = 0.5 mA
- **Sampling rate:** 10 Hz (every 100 ms)
- **Thresholds in volts:** 1.25 V, 2.50 V, 3.75 V

## What this verifies

1. ADC input with multiple threshold comparisons
2. Bar-graph display pattern (cumulative, not exclusive)
3. Potentiometer as analog input (simulating LDR)

```assert
# LDR (pot model at 50%): ADC input = 2.500V
net MCU.P1.7 V 2.50 +-0.05
net MCU.VCC V 5.00 +-0.01
```
