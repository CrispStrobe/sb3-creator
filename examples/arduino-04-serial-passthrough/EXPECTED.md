# arduino-04-serial-passthrough — expected behaviour

## Circuit

Arduino Uno A0 <- wiper of 10 kohm pot (VCC to GND). No LEDs — serial output only.

## Program

Reads analog sensor on A0 and prints the value to serial every 10 ms, forever.

## Observable behaviour

- **Serial monitor** shows a rapid stream of ADC readings (0-1023), ~100 values per second.
- Turning the pot changes the printed values smoothly.
- This is the fastest-printing serial example in the collection.

## What this verifies

1. High-frequency serial output (10 ms interval)
2. Continuous analog sensor streaming
3. Simplified from serial echo/passthrough concept

```assert
# Supply rail: VCC = 5.0V
net vcc1.vcc V 5.00 +-0.01
# Pot at 50%: wiper = 5.0 × 0.5 = 2.500V
net pot1.wiper V 2.50 +-0.05
```
