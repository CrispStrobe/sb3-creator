# arduino-02-tone-pitch-follower — expected behaviour

## Circuit

Arduino Uno A0 <- LDR and 4.7 kohm resistor voltage divider (VCC -> LDR -> A0 -> 4.7k -> GND). D9 → buzzer → GND.

## Program

Reads LDR on A0, maps range 400-1000 to 120-1500 Hz, plays that frequency on
the buzzer. Prints the raw sensor reading to serial.

The mapping divides LAST: `((reading - 400) * 1380) / 600`. Written as
`(reading - 400) * (1380 / 600)` the emitted C computed `1380 / 600` in integer
arithmetic — 2, not 2.3 — which flattened the top of the range by 186 Hz.

The `sensorReading > 400` guard is the source sketch's threshold, restored: below
400 the mapping goes negative and there is no such thing as a negative tone.

## Observable behaviour

- **Dark (low light):** LDR resistance high, A0 reads ~400. Buzzer plays **low tone** (~120 Hz).
- **Bright (high light):** LDR resistance low, A0 reads ~1000. Buzzer plays **high tone** (~1500 Hz).
- Changing light smoothly changes the pitch — like a theremin.
- Serial monitor shows raw ADC reading updating every 50 ms.

## What this verifies

1. Analog sensor (LDR voltage divider) reads light level
2. Linear mapping: sensor reading scaled to Hz range, integer-safe (divide last)
   — 120 Hz at 400, 377 Hz at 512, 810 Hz at 700, 1552 Hz at 1023
3. Continuous tone modulation: buzzer pitch follows sensor in real time

```assert
# Supply rail: VCC = 5.0V
net vcc1.vcc V 5.00 +-0.01
```
