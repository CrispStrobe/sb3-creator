# 75-battery-tester — expected behaviour

## Circuit

- AA cell (params.volts, default 1.45 V) with a 10 Ω load resistor
  across it — batteries are tested UNDER LOAD; open-circuit voltage
  flatters a dying cell.
- MCU analog pin on the cell's positive terminal.
- SSD1306 OLED on SDA/SCL.

## Program

Every 500 ms: read the ADC, convert to millivolts, print the value and
a verdict:

| loaded voltage | verdict |
|---|---|
| > 1399 mV | FULL |
| 1200–1399 mV | GOOD |
| 1000–1199 mV | WEAK |
| ≤ 999 mV | DEAD |

## Observable behaviour

- Default 1.45 V cell: shows ~1450 mV, "FULL".
- Edit the battery's volts parameter to 1.3 → "GOOD", 1.1 → "WEAK",
  0.9 → "DEAD". The verdict follows within one refresh.

```assert
# Supply rail: VCC = 5.0V
net vcc1.vcc V 5.00 +-0.01
```
