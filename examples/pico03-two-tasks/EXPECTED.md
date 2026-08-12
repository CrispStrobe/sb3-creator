# pico03-two-tasks — expected behaviour

## Circuit

10 kΩ potentiometer: CW → VCC (3.3 V), CCW → GND, wiper → GP26.
GP25 → green LED (Vf = 2.1 V) → 220 Ω → GND.

## Program

Two cooperative scripts:
- Script 1: blinks GP25 at 1 Hz (500 ms on/off)
- Script 2: reads GP26 (ADC0) and prints the value over serial every 1 second

This is the Pico counterpart to nano03-two-tasks, exercising both the
cooperative scheduler with two tasks and the Pico's ADC + GPIO.

## Observable behaviour

| time (ms) | GP25 | serial output |
|---|---|---|
| 0 | ON | `2048` (at 1.65 V) |
| 500 | OFF | — |
| 1000 | ON | `2048` |
| 1500 | OFF | — |

- GP25 toggles every 500 ms regardless of serial output
- Serial prints once per second, unaffected by blink timing
- Moving the pot changes the printed value on the next read

## What this verifies

1. Two cooperative scripts with different periods coexist on RP2040
2. ADC on GP26 and digital output GP25 work in parallel
3. Serial output does not block the blink script
4. The symbol table has `bw_task0` and `bw_task1` with separate yields
5. No bw_ms in the symbol table (hardware TIMELR timebase)
6. Full chain: generateC → arm-none-eabi-gcc → binary + symbols

## Debugger test

A yield breakpoint on `(bw_task0, 3)` (first wait in blink) should pause
both tasks at exactly 500 ms program time. The coordinator proved this
end-to-end through the rp2040js debug target.
