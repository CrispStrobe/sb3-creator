# arduino-sk-p14-serial-pot — expected behaviour

## Circuit

Arduino Uno A0 <- wiper of 10 kohm pot (VCC to GND). No LEDs — serial output only.

## Program

Reads pot on A0 and prints the raw ADC value (0-1023) to serial every 10 ms, forever.

## Observable behaviour

- **Serial monitor** shows a rapid stream of ADC values, ~100 per second.
- Turning the pot changes the printed value from 0 (fully CCW) to 1023 (fully CW).
- The fast update rate makes the output suitable for real-time graphing.

## What this verifies

1. High-frequency analog reading and serial output
2. Pot value maps linearly to 0-1023 ADC range
3. Simplified from original Processing-based visualisation
