# 08-led-chaser-595 — expected behaviour

## Circuit

MCU P1.0/P1.1/P1.2 → 74HC595 (data/clock/latch) → 8 × (330 Ω + red LED) → GND.
Wire /SRCLR to the register supply and /OE to ground. The Pico and STM32
variants power the register at 3.3 V. A single bit walks left and right across
the eight LEDs.

## Program

Shifts a 1-bit pattern through the 595's 8 outputs: 0x01 → 0x02 → … → 0x80,
then reverses: 0x80 → 0x40 → … → 0x01. Each end stays lit for two 100 ms steps,
for a nominal 1.6 s cycle.

## Observable behaviour

| step | pattern (binary) | pattern (hex) | lit LED |
|---|---|---|---|
| 0 | 00000001 | 0x01 | D1 |
| 1 | 00000010 | 0x02 | D2 |
| 7 | 10000000 | 0x80 | D8 |
| 8 | 10000000 | 0x80 | D8 (held) |
| 9 | 01000000 | 0x40 | D7 (reversing) |
| 15 | 00000001 | 0x01 | D1 (held) |
| 16 | 00000001 | 0x01 | D1 (next cycle) |

- **LED current per channel (when on):** (5.0 − 2.0) / 330 ≈ 9.1 mA
- **Only one LED lit at a time** — total current ~9.1 mA + quiescent
- **Cycle period:** 16 steps × 100 ms = 1600 ms
- **595 clock frequency:** not speed-critical (one shift per 100 ms)

## What this verifies

1. PART declaration for 74HC595 with data/clock/latch pin mapping
2. `set leds to <value>` shifts a byte to the register
3. `shiftleft` / `shiftright` operators in a control variable
4. Bounce logic with a direction flag

```assert
# Authored STC12 supply rail: VCC = 5.0 V
net vcc1.vcc V 5.00 +-0.01
```
