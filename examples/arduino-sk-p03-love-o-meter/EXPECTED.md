# arduino-sk-p03-love-o-meter — expected behaviour

## Circuit

Arduino Uno A0 <- wiper of 10 kohm pot (simulating TMP36 sensor, VCC to GND). D2, D3, D4 → three LEDs → GND.

## Program

Reads A0, converts ADC to voltage, then to temperature via `(voltage - 0.5) * 100`. Lights 0-3 LEDs based on temperature thresholds relative to a 20 C baseline.

## Observable behaviour

- **Pot low (cold, < 20 C):** all three LEDs **OFF**. Serial prints low temperature.
- **Pot ~20-22 C range:** LED 1 (D2) turns **ON**.
- **Pot ~22-24 C range:** LEDs 1 and 2 (D2, D3) **ON**.
- **Pot > 24 C:** all three LEDs **ON** — full bar.
- Serial monitor shows the computed temperature value.

## What this verifies

1. ADC -> voltage -> temperature conversion chain
2. Threshold-based bargraph: each LED lights at a progressively higher temperature
3. Simulated analog sensor via potentiometer

```assert
# Supply rail: VCC = 5.0V
net vcc1.vcc V 5.00 +-0.01
# Pot at 50%: wiper = 5.0 × 0.5 = 2.500V
net pot1.wiper V 2.50 +-0.05
```
