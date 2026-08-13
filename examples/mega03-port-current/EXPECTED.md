# mega03-port-current — expected behaviour

## Circuit

8 LEDs on D22–D29 (ATmega2560 port A), each with a 220 Ω series resistor
to GND. Active-high: pin high drives the LED on.

D22–D29 map to port A bits 0–7 on the ATmega2560. This is the Mega's
defining advantage: 8 contiguous digital outputs on a single port, where
Uno/Nano can only offer 6 in the conventional pool.

## Program

Walks a single lit LED across the 8 outputs at 5 Hz (200 ms per step),
repeating forever. One LED is on at any time.

## Observable behaviour

| time (ms) | active pin | port A | LED current |
|---|---|---|---|
| 0 | D22 (PA0) | 0x01 | (5.0 − 2.0) / 220 = 13.6 mA |
| 200 | D23 (PA1) | 0x02 | 13.6 mA |
| 400 | D24 (PA2) | 0x04 | 13.6 mA |
| 600 | D25 (PA3) | 0x08 | 13.6 mA |
| 800 | D26 (PA4) | 0x10 | 13.2 mA (green) |
| 1000 | D27 (PA5) | 0x20 | 13.2 mA (green) |
| 1200 | D28 (PA6) | 0x40 | 13.2 mA (green) |
| 1400 | D29 (PA7) | 0x80 | 13.2 mA (green) |

Each LED sees at most 13.6 mA; only one is on at a time, so total port
current stays well under the 200 mA per-port limit.

## What this verifies

1. `DEVICE ARDUINO-MEGA` with 8 digital output pins — more than Uno's pool
2. D22–D29 port A mapping on the ATmega2560
3. Sequential pin control in a single FOREVER loop
4. Single-task cooperative scheduler with 8 yield points

## Why 8 LEDs

The Mega's digital pool has room for 8 (D13, D22–D28 in the RETARGET_POOLS
convention). This example fills the pool to demonstrate the Mega's wider
I/O compared to the 6-pin Uno/Nano convention.
