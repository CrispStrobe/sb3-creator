# arduino-04-dimmer — expected behaviour

## Circuit

Arduino Uno A0 <- wiper of 10 kohm pot (VCC to GND). D9 (PWM) → 220 ohm → white LED → GND.

## Program

Reads pot on A0, maps to 0-255, writes PWM to LED on D9. Updates every 20 ms.

## Observable behaviour

- **Pot fully CCW:** white LED is OFF.
- **Pot at midpoint:** LED at ~50 % brightness.
- **Pot fully CW:** LED at full brightness.
- Smooth, continuous dimming as the pot is turned.

## What this verifies

1. Pot-to-PWM mapping: `(read pot * 255) / 1023` scales the analog reading
2. Adapted from serial-input original — pot replaces typed commands
3. Real-time LED brightness control from an analog sensor
