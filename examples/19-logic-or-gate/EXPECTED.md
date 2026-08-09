# 19-logic-or-gate -- expected behaviour

## Circuit

Button A on P3.2 with 10 kOhm pull-up (active-low, press = GND).
Button B on P3.3 with 10 kOhm pull-up (active-low, press = GND).
Output: VCC -> 1 kOhm -> yellow LED (Vf = 2.0 V) -> MCU P1.0 (active-low).

## Program

Implements a logical OR: LED on when either (or both) buttons are pressed.

## Observable behaviour (truth table)

| Button A | Button B | P3.2 | P3.3 | LED   |
|----------|----------|------|------|-------|
| released | released | high | high | OFF   |
| pressed  | released | low  | high | ON    |
| released | pressed  | high | low  | ON    |
| pressed  | pressed  | low  | low  | ON    |

- **LED current (when on):** (5.0 - 2.0) / 1000 = 3.0 mA
- **Pull-up current per button (when pressed):** 5.0 / 10000 = 0.5 mA
- **Polling rate:** 20 Hz (every 50 ms)
- **Response latency:** max 50 ms from button press to LED change

## What this verifies

1. OR logic via cascaded IF/ELSE (if A then on, else if B then on, else off)
2. Contrast with AND gate (example 18) using same circuit topology
3. Three of four input combinations produce LED ON
