# nano03-two-tasks — expected behaviour

## Circuit

10 kΩ potentiometer: CW → VCC, CCW → GND, wiper → A6.
D13 → green LED (Vf = 2.1 V) → 220 Ω → GND.

## Program

Two cooperative scripts:
- Script 1: blinks D13 at 1 Hz (500 ms on/off)
- Script 2: reads A6 and prints the value over serial every 1 second

This is the Nano counterpart to avr06-blink-and-print, exercising both the
cooperative scheduler with two tasks and the Nano-specific A6 pin.

## Observable behaviour

| time (ms) | D13 | serial output |
|---|---|---|
| 0 | ON | `512` (at 2.5 V) |
| 500 | OFF | — |
| 1000 | ON | `512` |
| 1500 | OFF | — |

- D13 toggles every 500 ms regardless of serial output
- Serial prints once per second, unaffected by blink timing
- Moving the pot changes the printed value on the next read

## What this verifies

1. Two cooperative scripts with different periods coexist on Nano
2. ADC on analog-only pin A6 and digital output D13 work in parallel
3. Serial output does not block the blink script
4. The symbol table has `bw_task0` and `bw_task1` with separate yields
5. `DEVICE ARDUINO-NANO` with A6 exercises the Nano-specific pin validation

## Debugger test

A yield breakpoint on `(bw_task0, 2)` (first wait in blink script)
should pause both tasks. The position should show:
- task0 at state 2 (wait, until = bw_ms + 500)
- task1 at its own wait state (until = bw_ms + 1000)
