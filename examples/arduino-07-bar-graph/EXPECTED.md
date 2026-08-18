# arduino-07-bar-graph — expected behaviour

## Circuit

Arduino Uno A0 <- wiper of 10 kohm pot (VCC to GND). D2-D6 → 220 ohm resistors → five green LEDs → GND.

## Program

Reads pot on A0, maps to a 0-5 level, and lights that many LEDs from D2 upward. More LEDs = higher reading.

## Observable behaviour

- **Pot fully CCW (0):** all LEDs **OFF**.
- **Pot at ~20 %:** LED on D2 **ON**, rest OFF.
- **Pot at ~40 %:** D2 and D3 **ON**.
- **Pot at ~60 %:** D2, D3, D4 **ON**.
- **Pot at ~80 %:** D2, D3, D4, D5 **ON**.
- **Pot fully CW:** all five LEDs **ON** — full bar.
- The bar graph fills from bottom to top as the pot is turned.

## What this verifies

1. Analog-to-level mapping: `(read pot * 5) / 1023` produces 0-5
2. Threshold-based LED control: `if level >= N then: turn on ledN`
3. Visual bargraph display from an analog input

```assert
# Supply rail: VCC = 5.0V
net vcc1.vcc V 5.00 +-0.01
# Pot at 50%: wiper = 5.0 × 0.5 = 2.500V
net pot1.wiper V 2.50 +-0.05
```
