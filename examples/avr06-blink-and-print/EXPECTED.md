# avr06-blink-and-print — expected behaviour

## Circuit

10 kΩ potentiometer: CW → VCC, CCW → GND, wiper → A0.
D13 → green LED (Vf = 2.1 V) → 220 Ω → GND.

## Program

Two cooperative scripts:
- Script 1: blinks D13 at 1 Hz
- Script 2: reads A0 and prints the value over serial every 1 second

This combines the blink (avr01) and serial pot (avr04) patterns into one
program. The two scripts share the same cooperative scheduler.

## Observable behaviour

| time (ms) | D13 | serial output |
|---|---|---|
| 0 | ON | `512` (at 2.5 V) |
| 500 | OFF | — |
| 1000 | ON | `512` |
| 1500 | OFF | — |

- D13 toggles every 500 ms regardless of the serial output
- Serial prints once per second, unaffected by the blink timing
- Moving the pot changes the printed value on the next read

## What this verifies

1. Two cooperative scripts with different periods coexist
2. ADC and digital output work in parallel
3. Serial output (`print`) does not block the blink script
4. The symbol table has `bw_task0` and `bw_task1` with separate yields
5. This is the pattern the coordinator proved end-to-end:
   "D13 blinks at exact 500ms edges; 'print read pot1' streams 512 @ 2.5V"

## Debugger test

A yield breakpoint on `(bw_task0, 2)` (the first wait in the blink script)
should pause both tasks. The position should show:
- task0 at state 2 (wait, until = bw_ms + 500)
- task1 at its own wait state (until = bw_ms + 1000)

```assert
# Supply rail: VCC = 5.0V
net vcc1.vcc V 5.00 +-0.01
# Pot at 50%: wiper = 5.0 × 0.5 = 2.500V
net pot1.wiper V 2.50 +-0.05
```
