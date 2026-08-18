# arduino-01-digital-read-serial — expected behaviour

## Circuit

Arduino Uno D2 <- pushbutton -> VCC (5 V). 10 kohm pull-down resistor from D2 to GND.

## Program

Reads D2 as a digital input and prints the state (0 or 1) to serial every 100 ms, forever.

## Observable behaviour

- **Button released:** D2 is pulled LOW by the 10 kohm resistor. Serial prints **0**.
- **Button pressed:** D2 is connected to VCC through the button. Serial prints **1**.

## What this verifies

1. Digital read on D2 returns 0 (LOW) or 1 (HIGH)
2. Pull-down resistor holds the pin LOW when the button is released
3. Button press connects D2 to VCC, overriding the pull-down

```assert
# Supply rail: VCC = 5.0V
net vcc1.vcc V 5.00 +-0.01
```
