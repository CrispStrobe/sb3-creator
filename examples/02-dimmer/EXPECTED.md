# 02-dimmer — expected behaviour

## Circuit

- VCC (5 V) → 10 kΩ pot → GND. Wiper → MCU P1.3 (ADC channel 3).
- VCC → 1 kΩ resistor → red LED (Vf = 2.0 V) → MCU P1.0 (active-low).

## Program

Reads the pot via ADC (10-bit, 0-1023) and converts it to a duty cycle
0-100. Each PWM cycle is `duty` iterations with the LED on (1 ms each)
and `100 - duty` with it off, so the period is 100 ms and the fraction
of time the LED is on equals the pot position. Same software-PWM shape
as [24-pwm-fade](../24-pwm-fade), with the pot supplying the duty
instead of a sweep.

`(read pot * 100) / 1023` multiplies BEFORE dividing on purpose. The C
target's arithmetic is integer, so `read pot / 1023 * 100` evaluates to
0 for every reading below 1023 and 100 at full scale — a dimmer with two
settings. The Scratch VM would divide in floating point and hide it.

## Observable behaviour

| pot position | ADC reading | P1.3 voltage | duty | LED |
|---|---|---|---|---|
| 0% (fully CCW) | ~0 | ~0 V | 0 | off |
| 10% | ~102 | ~0.5 V | 9 | dim |
| 50% | ~512 | ~2.5 V | 50 | half brightness |
| 75% | ~767 | ~3.75 V | 74 | bright |
| 100% (fully CW) | ~1023 | ~5.0 V | 100 | fully on |

- **PWM period:** 100 ms (10 Hz), the same as 24-pwm-fade
- **LED current when on:** (5.0 - 2.0) / 1000 = 3.0 mA
- **Mean LED current:** 3.0 mA x duty / 100

## What this verifies

1. ADC reads the pot voltage on P1.3 (channel 3) as a 10-bit value
2. The duty cycle tracks the reading, so brightness is proportional to
   pot position rather than to one bit of it
3. Integer-safe scaling: multiply before divide, so the C target and the
   VM compute the same duty
4. The analog -> digital -> PWM -> brightness path works end to end

```assert
# Pot at 50%: wiper = VCC × position = 5.0 × 0.5 = 2.500V
net POT_pot.wiper V 2.50 +-0.05
```
