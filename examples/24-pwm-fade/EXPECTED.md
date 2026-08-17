# 24-pwm-fade -- expected behaviour

## Circuit

VCC (5 V) -> 1 kOhm resistor -> red LED (Vf = 2.0 V) -> MCU P1.0 (active-low).

## Program

Software PWM fade: a `duty` variable sweeps 0 to 100 then back to 0. Each PWM
cycle has `duty` iterations with the LED on (1 ms each) and `100 - duty` iterations
with the LED off (1 ms each), giving a 100 ms period (10 Hz PWM).

## Observable behaviour

| duty | on time (ms) | off time (ms) | perceived brightness |
|------|-------------|---------------|---------------------|
| 0    | 0           | 100           | 0%                  |
| 25   | 25          | 75            | 25%                 |
| 50   | 50          | 50            | 50%                 |
| 75   | 75          | 25            | 75%                 |
| 100  | 100         | 0             | 100%                |

- **PWM period:** 100 ms (10 Hz) per duty step
- **Full fade-in time:** 100 steps x 100 ms = 10 s
- **Full fade-out time:** 100 steps x 100 ms = 10 s
- **Total cycle:** ~20 s fade-in + fade-out
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
