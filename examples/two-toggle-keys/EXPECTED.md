# two-toggle-keys -- expected behaviour

## Circuit

- Keys `keyA` (P3.2) and `keyB` (P3.3), each with a 10 kOhm pull-up to VCC;
  pressing connects the pin to GND (active-low).
- LEDs `ledA` (P1.0) and `ledB` (P1.1), each VCC (5 V) -> 1 kOhm -> LED ->
  MCU pin (active-low).

## Program

Every 20 ms the program reads both keys. For each key it compares the reading
with the one before: only a change from released (0) to pressed (1) toggles
that key's LED. Nothing waits on a single key, so both work independently,
even when they are held at the same time.

## Observable behaviour

| action                         | ledA      | ledB      |
|--------------------------------|-----------|-----------|
| press and release A            | toggles   | unchanged |
| press and release B            | unchanged | toggles   |
| hold A, press B twice          | toggles once | toggles twice |
| hold both                      | toggle once each | |

- **Sampling period:** 20 ms (50 times per second)
- **LED current (each, when on):** (5.0 - 2.0) / 1000 = 3.0 mA

## What this verifies

1. Non-blocking polling of two inputs in one loop
2. Rising-edge detection with a remembered previous state per input
3. The sampling interval doubling as a debounce

```assert
net R_PU_keyA.b V 5.00 +-0.01
net R_PU_keyB.b V 5.00 +-0.01
```
