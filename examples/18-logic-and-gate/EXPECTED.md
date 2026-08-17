# 18-logic-and-gate -- expected behaviour

## Circuit

Button A on P3.2 with 10 kOhm pull-up (active-low, press = GND).
Button B on P3.3 with 10 kOhm pull-up (active-low, press = GND).
Output: VCC -> 1 kOhm -> green LED (Vf = 2.0 V) -> MCU P1.0 (active-low).

## Program

Implements a logical AND: LED on only when both buttons are pressed simultaneously.

## Observable behaviour (truth table)

| Button A | Button B | P3.2 | P3.3 | LED   |
|----------|----------|------|------|-------|
| released | released | high | high | OFF   |
| pressed  | released | low  | high | OFF   |
| released | pressed  | high | low  | OFF   |
| pressed  | pressed  | low  | low  | ON    |

- **LED current (when on):** (5.0 - 2.0) / 1000 = 3.0 mA
- **Pull-up current per button (when pressed):** 5.0 / 10000 = 0.5 mA
- **Polling rate:** 20 Hz (every 50 ms)
- **Response latency:** max 50 ms from button press to LED change

## What this verifies

1. Two digital inputs read with active-low pull-ups
2. Nested IF implements AND logic
3. Software logic gate matches hardware AND gate truth table

```assert
# Both buttons open: pull-ups hold at VCC = 5.000V
net BTN_btnA.a V 5.00 +-0.01
net BTN_btnB.a V 5.00 +-0.01
```
