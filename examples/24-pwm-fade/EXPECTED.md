# 24-pwm-fade -- expected behaviour

## Circuit

VCC (5 V) -> 1 kOhm resistor -> red LED (Vf = 2.0 V) -> MCU P1.0 (active-low).

## Program

Software PWM fade: a `duty` variable sweeps 0 to 100 then back to 0. Each PWM
cycle has `duty` iterations with the LED on (0.1 ms each) and `100 - duty`
iterations with the LED off (0.1 ms each), giving a 10 ms period (100 Hz PWM).

The tick is what makes this a dimmer rather than a blinker. At the 1 ms tick
this example used to carry, the period was 100 ms -- 10 Hz, squarely visible
flicker, while intro.md promised "no flicker ... like a dimmer switch". 100 Hz
is above the flicker fusion threshold, so the brightness now reads as steady.

## Observable behaviour

| duty | on time (ms) | off time (ms) | perceived brightness |
|------|-------------|---------------|---------------------|
| 0    | 0           | 10            | 0%                  |
| 25   | 2.5         | 7.5           | 25%                 |
| 50   | 5           | 5             | 50%                 |
| 75   | 7.5         | 2.5           | 75%                 |
| 100  | 10          | 0             | 100%                |

- **PWM period:** 10 ms (100 Hz) per duty step
- **Full fade-in time:** 100 steps x 10 ms = 1 s
- **Full fade-out time:** 100 steps x 10 ms = 1 s
- **Total cycle:** ~2 s fade-in + fade-out
- **LED current (when on):** (5.0 - 2.0) / 1000 = 3.0 mA

## What this verifies

1. Software PWM using nested REPEAT loops with a variable
2. Variable arithmetic (duty cycle incrementing/decrementing)
3. Fine-grained timing with 1 ms waits
4. Smooth brightness transitions via duty cycle modulation

```assert
# MCU supply: VCC = 5.000V
net MCU.VCC V 5.00 +-0.01
```
