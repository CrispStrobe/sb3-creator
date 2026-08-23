# 10-motor-speed — expected behaviour

## Circuit

MCU P1.0 → 1 kΩ base resistor → TIP120 base. TIP120 collector → DC motor
(R = 10 Ω, kV = 0.01 V/rad/s) → VCC. TIP120 emitter → GND. Flyback diode
across motor (cathode → VCC, anode → collector).

Speed control: VCC → 10 kΩ pot → GND. Wiper → MCU P1.3 (ADC channel 3).

**Why the TIP120:** same as the relay — a DC motor draws far more current than
a quasi-bidirectional pin can source. The TIP120 lets the MCU switch the motor
current with a few mA of base drive.

## Program

Reads the pot (0–1023) and converts it to a duty cycle 0–100. Each PWM cycle is
`speed` iterations with the pin high (1 ms each) and `100 - speed` with it low,
a 100 ms period; the motor integrates that into a proportional speed. Same
software-PWM shape as [24-pwm-fade](../24-pwm-fade).

`(read pot * 100) / 1023` multiplies BEFORE dividing on purpose: the C target's
arithmetic is integer, so `read pot / 1023 * 100` would be 0 for every reading
below full scale.

## Observable behaviour

| pot position | ADC | duty | motor |
|---|---|---|---|
| 0% | ~0 | 0 | stopped — P1.0 low for the whole cycle |
| 25% | ~256 | 25 | slow |
| 50% | ~512 | 50 | half speed |
| 100% | ~1023 | 100 | full speed — P1.0 high for the whole cycle |

Within one cycle: P1.0 HIGH turns the TIP120 on and current flows; LOW turns it
off and the motor coasts on its own inertia.

- **Base current:** (5.0 − 1.4) / 1000 ≈ 3.6 mA
- **Motor stall current:** (5.0 − 2.0) / 10 = 300 mA (Vce_sat ≈ 2 V)
- **Motor running:** back-EMF reduces current as speed increases

## What this verifies

1. TIP120 driver for a motor (same pattern as the relay)
2. Pot → ADC → PWM duty → motor speed control loop, with speed proportional
   to pot position rather than to one bit of the reading
3. Flyback diode across an inductive load
4. **Negative property:** driving the motor straight from the pin does NOT spin it

```assert
# Speed pot at 50%: wiper = VCC × 0.5 = 2.500V
net POT_pot.wiper V 2.50 +-0.05
```
