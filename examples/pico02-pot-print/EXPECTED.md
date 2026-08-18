# pico02-pot-print — expected behaviour

## Circuit

10 kΩ potentiometer: CW → VCC (3.3 V), CCW → GND, wiper → GP26.

GP26 is ADC channel 0 on the RP2040. The Pico has a 12-bit ADC (0–4095),
but the pseudocode `read` returns a 10-bit value (0–1023) for compatibility
across devices.

## Program

Reads GP26 and prints the ADC value over serial (UART0 on GP0) once per second.

## Observable behaviour

| time (ms) | serial output (pot at midpoint) |
|---|---|
| 0 | `2048` (12-bit midpoint at 1.65 V) |
| 1000 | `2048` |
| 2000 | `2048` |

- Moving the pot changes the printed value: 0 (GND) to 4095 (3.3 V)
- At 1.65 V midpoint, the ADC reads ~2048

## What this verifies

1. `PIN pot1 = GP26 ANALOG` accepted (GP26–GP28 are the Pico's ADC pins)
2. ADC channel 0 mapped correctly in generated C
3. Serial output via UART0 (GP0, funcsel 2)
4. Single-task cooperative scheduler with 1-second wait
5. The symbol table has yield points for the wait

## Why GP26 and not GP27/GP28

GP26 is ADC0, the first and most common ADC pin on Pico tutorials.
GP27 (ADC1) and GP28 (ADC2) work identically.

```assert
# Supply rail: 3.3V (Pico regulates to 3.3V)
net vcc1.vcc V 3.30 +-0.05
# Pot at 50%: wiper = 3.3 × 0.5 = 1.650V
net pot1.wiper V 1.65 +-0.05
```
