# 14-traffic-light -- expected behaviour

## Circuit

VCC (5 V) -> 1 kOhm -> red LED (Vf = 2.0 V) -> MCU P1.0 (active-low).
VCC (5 V) -> 1 kOhm -> yellow LED (Vf = 2.0 V) -> MCU P1.1 (active-low).
VCC (5 V) -> 1 kOhm -> green LED (Vf = 2.0 V) -> MCU P1.2 (active-low).

## Program

Cycles through traffic light phases: red (3 s) -> green (3 s) -> yellow (1 s) -> repeat.

## Observable behaviour

| time (s)  | red | yellow | green | phase        |
|-----------|-----|--------|-------|--------------|
| 0.0-3.0   | ON  | OFF    | OFF   | stop         |
| 3.0-6.0   | OFF | OFF    | ON    | go           |
| 6.0-7.0   | OFF | ON     | OFF   | caution      |
| 7.0-10.0  | ON  | OFF    | OFF   | stop (again) |

- **Cycle period:** 7.0 seconds (3 + 3 + 1)
- **LED current (each, when on):** (5.0 - 2.0) / 1000 = 3.0 mA
- **Only one LED is on at any time**
- **Red duty cycle:** 3/7 = 42.9%
- **Green duty cycle:** 3/7 = 42.9%
- **Yellow duty cycle:** 1/7 = 14.3%

## What this verifies

1. Three independent active-low outputs with sequenced timing
2. Mutual exclusion: only one LED on at each phase
3. Asymmetric timing (yellow is shorter than red/green)
