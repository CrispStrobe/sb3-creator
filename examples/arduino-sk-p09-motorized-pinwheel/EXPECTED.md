# arduino-sk-p09-motorized-pinwheel — expected behaviour

## Circuit

Arduino Uno D2 <- pushbutton with pull-down. D9 → motor (or motor driver) → GND.

## Program

When button on D2 is pressed, motor on D9 turns on. When released, motor turns off.

## Observable behaviour

- **Button released:** motor is **OFF** (D9 LOW).
- **Button pressed:** motor is **ON** (D9 HIGH).
- Response is immediate — motor follows the button state directly.
- No speed control — the motor is either fully on or fully off.

## What this verifies

1. Digital input on D2 reads button state
2. `if read btn then: turn on motor` drives the motor pin
3. Simple on/off motor control without PWM

```assert
# Supply rail: VCC = 5.0V
net vcc1.vcc V 5.00 +-0.01
```
