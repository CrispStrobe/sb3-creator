# arduino-01-blink — expected behaviour

## Circuit

Arduino Uno D13 → 220 ohm resistor → red LED → GND. VCC = 5 V.

## Program

Toggles D13 high/low at 1 Hz: 1 second on, 1 second off, forever.

## Observable behaviour

| time (s) | D13 level | LED state | LED current |
|---|---|---|---|
| 0 | HIGH (5 V) | ON | (5.0 - 2.0) / 220 = 13.6 mA |
| 1 | LOW (0 V) | OFF | 0 mA |
| 2 | HIGH | ON | 13.6 mA |

- **Frequency:** 1 Hz (period = 2 s)
- **Duty cycle:** 50 %
- **LED brightness:** full during on phase, dark during off phase

## What this verifies

1. Digital output on D13 toggles correctly
2. `wait 1 seconds` produces a 1-second delay
3. LED lights when pin is HIGH through resistor to GND (active-high wiring)

```assert
# Arduino 5V rail
net board.5v V 5.00 +-0.01
```
