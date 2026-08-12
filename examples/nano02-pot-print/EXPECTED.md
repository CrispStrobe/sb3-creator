# nano02-pot-print — expected behaviour

## Circuit

10 kΩ potentiometer: CW → VCC, CCW → GND, wiper → A6.

A6 is an analog-only pin on the Arduino Nano — it has no digital function
and no internal pull-up. This is the key difference from UNO: the UNO has
only A0–A5, all of which double as digital pins. The Nano adds A6 and A7
as dedicated ADC inputs.

## Program

Reads A6 and prints the 10-bit ADC value over serial once per second.

## Observable behaviour

| time (ms) | serial output (pot at midpoint) |
|---|---|
| 0 | `512` |
| 1000 | `512` |
| 2000 | `512` |

- Moving the pot changes the printed value: 0 (GND) to 1023 (VCC)
- At 2.5 V midpoint, the ADC reads ~512

## What this verifies

1. `PIN pot1 = A6 ANALOG` accepted on Nano (rejected on UNO — A6 out of range)
2. ADC channel 6 mapped correctly in generated C (`analogRead(A6)`)
3. Serial output via USART0 (`print` → `bw_serial_print_int`)
4. Single-task cooperative scheduler with 1-second wait
5. The symbol table has `bw_task0` with yield points for the wait

## Why A6 and not A0

A0–A5 work identically on both UNO and Nano. A6 is the pin that
distinguishes the Nano's ADC capability and exercises the parser's
per-device pin validation (A6 is analog-only, no digital direction allowed).
