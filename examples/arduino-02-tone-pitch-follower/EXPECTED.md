# arduino-02-tone-pitch-follower — expected behaviour

## Circuit

Arduino Uno A0 <- LDR and 4.7 kohm resistor voltage divider (VCC -> LDR -> A0 -> 4.7k -> GND). D9 → buzzer → GND.

## Program

Reads LDR on A0, maps range 400-1000 to 120-1500 Hz, plays that frequency on the buzzer. Prints raw sensor reading to serial.

## Observable behaviour

- **Dark (low light):** LDR resistance high, A0 reads ~400. Buzzer plays **low tone** (~120 Hz).
- **Bright (high light):** LDR resistance low, A0 reads ~1000. Buzzer plays **high tone** (~1500 Hz).
- Changing light smoothly changes the pitch — like a theremin.
- Serial monitor shows raw ADC reading updating every 50 ms.

## What this verifies

1. Analog sensor (LDR voltage divider) reads light level
2. Linear mapping: sensor reading scaled to Hz range
3. Continuous tone modulation: buzzer pitch follows sensor in real time
