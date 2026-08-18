# arduino-05-switch-case — expected behaviour

## Circuit

Arduino Uno A0 <- LDR with 10 kohm pull-down resistor (VCC -> LDR -> A0 -> 10k -> GND). No LEDs — serial output only.

## Program

Reads LDR on A0, divides into 4 ranges (0-3), and prints a label: "dark", "dim", "medium", or "bright". Updates every 500 ms.

## Observable behaviour

- **Dark (sensor ~0):** serial prints **"dark"**.
- **Low light (~256):** serial prints **"dim"**.
- **Medium light (~512):** serial prints **"medium"**.
- **Bright light (~768+):** serial prints **"bright"**.
- Output updates every 500 ms. One word per line.

## What this verifies

1. Range mapping: `(sensorReading / 1024) * 3` converts ADC to a 0-3 integer
2. Cascaded if-statements simulate switch/case
3. LDR voltage divider reading maps to descriptive labels

```assert
# Supply rail: VCC = 5.0V
net vcc1.vcc V 5.00 +-0.01
```
