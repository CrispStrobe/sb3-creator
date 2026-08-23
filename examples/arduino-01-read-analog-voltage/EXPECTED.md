# arduino-01-read-analog-voltage — expected behaviour

## Circuit

Arduino Uno A0 <- wiper of 10 kohm potentiometer. Pot ends: VCC (5 V) and GND.

## Program

Reads A0 as a 10-bit ADC value, converts it to MILLIVOLTS via
`(sensorValue * 5000) / 1023`, and prints that to serial every 100 ms.

Millivolts, not volts, because the device target has no floating point. The
port originally wrote `sensorValue * (5.0 / 1023)`; the emitter renders every
numeric literal as an integer, so the C read `sensorValue * (5 / 1023)`, and
`5 / 1023` is 0 in C. It printed 0 at every pot position while the Scratch VM,
which divides in floating point, showed the right answer — so the example was
correct in the simulator and dead on hardware. Scaling by 5000 first keeps the
resolution and gives both targets the same number.

## Observable behaviour

- **Serial monitor** prints one millivolt reading per line, every ~100 ms.
- Pot fully CCW -> prints **0**.
- Pot at midpoint (ADC 512) -> prints **2502**.
- Pot fully CW (ADC 1023) -> prints **5000**.

## What this verifies

1. ADC reading converted to a real voltage using the 5 V / 1023 scale factor
2. Integer-safe scaling: multiplying before dividing, so the emitted C and the
   VM compute the same number
3. `print millivolts` outputs the reading to the serial monitor

```assert
# Supply rail: VCC = 5.0V
net vcc1.vcc V 5.00 +-0.01
# Pot at 50%: wiper = 5.0 × 0.5 = 2.500V
net pot1.wiper V 2.50 +-0.05
```
