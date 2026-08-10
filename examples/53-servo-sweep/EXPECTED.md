# 53-servo-sweep — expected behaviour

## Circuit

MCU P1.0 → servo signal. Servo VCC/GND from power rails. An indicator
LED (VCC → 1 kΩ → LED → P1.0, active-low) shows the signal pin is active.

## Program

Sweeps a servo from 0° to 180° in 10° steps (100 ms per step), then back.
Each position holds for 100 ms. Full cycle: 3.6 seconds.

## Servo PWM signal

A standard hobby servo expects a 50 Hz PWM signal (20 ms period):
- **0°:** 1.0 ms pulse (5% duty)
- **90°:** 1.5 ms pulse (7.5% duty)
- **180°:** 2.0 ms pulse (10% duty)

The generated C calls `bw_servo_set(name, angle)`. This helper must
produce the correct pulse width for the given angle.

## Observable behaviour

| step | pos | pulse width | servo position |
|---|---|---|---|
| 0 | 10° | ~1.056 ms | near 0° |
| 9 | 90° | 1.5 ms | centre |
| 18 | 180° | 2.0 ms | full travel |
| 27 | 90° | 1.5 ms | centre (returning) |
| 36 | 0° | 1.0 ms | start (new cycle) |

## Build status

**Does not compile yet** (as of 2026-08-10). `bw_servo_set()` is emitted
by `generateC()` but the helper function is not defined in the C runtime.
This example exists to catch that gap: when the helper lands, this example
should compile and the pulse width should be assertable.

## What this verifies

1. `set <name> angle to <n>` parses and round-trips
2. `bw_servo_set()` is emitted in the generated C
3. When the helper is defined: compilation succeeds via the oracle
4. When bw-board's servo model ships: pulse width matches the angle
