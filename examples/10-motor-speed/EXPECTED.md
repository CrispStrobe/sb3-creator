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

Reads the pot (0–1023), uses LSB to toggle the motor pin at ~1 kHz. The motor
integrates the PWM duty cycle into a proportional speed.

## Observable behaviour

| P1.0 | TIP120 | motor |
|---|---|---|
| HIGH (1) | on | current flows, motor spins |
| LOW (0) | off | no current, motor coasts |

- **Base current:** (5.0 − 1.4) / 1000 ≈ 3.6 mA
- **Motor stall current:** (5.0 − 2.0) / 10 = 300 mA (Vce_sat ≈ 2 V)
- **Motor running:** back-EMF reduces current as speed increases

## What this verifies

1. TIP120 driver for a motor (same pattern as the relay)
2. Pot → ADC → computed pin write → motor speed control loop
3. Flyback diode across an inductive load
4. **Negative property:** driving the motor straight from the pin does NOT spin it

```assert
# Speed pot at 50%: wiper = VCC × 0.5 = 2.500V
net POT_pot.wiper V 2.50 +-0.05
```
