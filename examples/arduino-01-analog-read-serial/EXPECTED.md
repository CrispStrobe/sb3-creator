# arduino-01-analog-read-serial — expected behaviour

## Circuit

Arduino Uno A0 <- wiper of 10 kohm potentiometer. Pot ends: VCC (5 V) and GND.

## Program

Reads A0 as a 10-bit ADC value (0-1023) and prints it to serial every 100 ms, forever.

## Observable behaviour

- **Serial monitor** prints one integer per line, every ~100 ms.
- Pot fully CCW -> prints values near **0**.
- Pot fully CW -> prints values near **1023**.
- Mid-position -> prints values near **512**.

## What this verifies

1. Analog read on A0 returns a 10-bit integer (0-1023)
2. Potentiometer wiper voltage maps linearly to ADC reading
3. `print read pot` sends the value to the serial monitor
