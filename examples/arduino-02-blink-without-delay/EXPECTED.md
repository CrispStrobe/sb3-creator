# arduino-02-blink-without-delay — expected behaviour

## Circuit

Arduino Uno D13 → 220 ohm resistor → red LED → GND. Pushbutton on D2 with 10 kohm pull-down (present but unused in base example). VCC = 5 V.

## Program

Blinks the LED at 1 Hz using a millis()-style timer check instead of `wait`. The LED state toggles every 1000 ms without blocking.

## Observable behaviour

- **LED on D13** blinks at 1 Hz — identical appearance to the basic blink example.
- The non-blocking structure means other code could run between checks.

| time (s) | LED state |
|---|---|
| 0 | ON |
| 1 | OFF |
| 2 | ON |

## What this verifies

1. Timer-based state machine: `(timer * 1000) - previousMillis >= interval` replaces blocking `wait`
2. Variable-driven LED toggle via `ledState` and conditional `turn on/off`
3. Non-blocking timing pattern works correctly in the simulation

```assert
# Supply rail: VCC = 5.0V
net vcc1.vcc V 5.00 +-0.01
```
