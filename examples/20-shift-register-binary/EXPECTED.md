# 20-shift-register-binary -- expected behaviour

## Circuit

MCU P1.0 (data), P1.1 (clock), P1.2 (latch) -> 74HC595 shift register.
8 outputs Q0-Q7 -> 330 Ohm resistors -> red LEDs (Vf = 2.0 V) -> GND.

## Program

Counts 0 to 255 in binary, shifting each byte MSB-first into the 595, then latching.
Increments every 250 ms. Wraps back to 0 after 255.

## Observable behaviour

| time (s) | counter | binary     | LEDs on (Q7..Q0) |
|----------|---------|------------|-------------------|
| 0.00     | 0       | 00000000   | none              |
| 0.25     | 1       | 00000001   | Q0                |
| 0.50     | 2       | 00000010   | Q1                |
| 0.75     | 3       | 00000011   | Q0, Q1            |
| 1.00     | 4       | 00000100   | Q2                |
| ...      | ...     | ...        | ...               |
| 63.75    | 255     | 11111111   | all 8             |
| 64.00    | 0       | 00000000   | none (wraps)      |

- **Full cycle:** 256 x 0.25 s = 64.0 seconds
- **LED current (each, when on):** (5.0 - 2.0) / 330 = 9.1 mA
- **Max total LED current (all 8 on, counter=255):** 8 x 9.1 = 72.7 mA
- **Average LEDs on:** 4 (each bit is on 50% of the count range)
- **Clock frequency per byte:** 8 pulses in rapid succession, then 250 ms pause

## What this verifies

1. Bit manipulation with bitand and shiftleft
2. SPI-like bit-banging protocol (data, clock, latch)
3. Binary counting displayed on 8 LEDs
4. REPEAT 8 for the shift loop, FOREVER for the count loop

```assert
# Supply rail: VCC = 5.0V
net VCC.vcc V 5.00 +-0.01
```
