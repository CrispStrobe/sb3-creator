# arduino-03-analog-in-out-serial — expected behaviour

## Circuit

Arduino Uno A0 <- wiper of 10 kohm pot (VCC to GND). D9 (PWM) → 220 ohm → green LED → GND.

## Program

Reads pot on A0 (0-1023), maps to 0-255 PWM, writes to LED on D9. Prints raw sensor value to serial every 20 ms.

## Observable behaviour

- **Pot fully CCW (0 V):** LED is OFF. Serial prints values near **0**.
- **Pot at midpoint:** LED at ~50 % brightness. Serial prints ~**512**.
- **Pot fully CW (5 V):** LED at full brightness. Serial prints ~**1023**.
- Turning the pot smoothly dims or brightens the LED in real time.

## What this verifies

1. Analog-to-PWM mapping: `(sensorValue * 255) / 1023` scales 10-bit to 8-bit
2. `set pwm led to outputValue` controls LED brightness proportionally
3. Simultaneous serial output and PWM output

```assert
# Supply rail: VCC = 5.0V
net vcc1.vcc V 5.00 +-0.01
# Pot at 50%: wiper = 5.0 × 0.5 = 2.500V
net pot1.wiper V 2.50 +-0.05
```
