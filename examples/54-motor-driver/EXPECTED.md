# 54-motor-driver — expected behaviour

## Circuit

MCU → L293D H-bridge → DC motor. Power from the supply rail, not the chip.

| MCU pin | L293D pin | function |
|---|---|---|
| P1.4 (PCA CCP1) | 1,2EN (pin 1) | PWM speed (8-bit, 0–255) |
| P3.4 | 1A (pin 2) | direction input 1 |
| P3.5 | 2A (pin 7) | direction input 2 |

Motor connects to L293D outputs 1Y (pin 3) and 2Y (pin 6).
L293D VCC (logic, pin 16) and VS (motor, pin 8) both from the 5 V rail.
L293D GND (pins 4, 5, 12, 13) to ground rail.

Indicator: VCC → 1 kΩ → green LED → MCU P1.0 (active-low).

**Power path:** the motor draws its current through the L293D from the
supply rail. The MCU pins carry only control signals (~µA into CMOS
inputs). The 120 mA chip-budget warning must NOT fire.

## Program

Forward at speed 200 for 2 s, reverse for 2 s, then coast and stop.

## Direction truth table (L293D)

| direction | IN1 (P3.4) | IN2 (P3.5) | motor |
|---|---|---|---|
| forward | 1 | 0 | CW |
| reverse | 0 | 1 | CCW |
| brake | 1 | 1 | short-circuit braking |
| coast | 0 | 0 | freewheeling |

## Observable behaviour

| time | speed | direction | motor state |
|---|---|---|---|
| 0 s | 200/255 (~78%) | forward | spinning CW |
| 2 s | 200/255 | reverse | spinning CCW |
| 4 s | 0 | coast | stopped |

- **Motor stall current:** (5.0 − 2×1.4) / 10 ≈ 220 mA (L293D Vce_sat ≈ 1.4 V per side)
- **Motor running current:** lower (back-EMF reduces it)
- **LED current:** (5.0 − 2.0) / 1000 = 3.0 mA
- **Chip I/O current:** ~3 mA (LED) + ~0 (control signals) ≈ 3 mA total

## What this verifies

1. Motor speed via `set mymotor speed to N` (PCA 8-bit PWM)
2. Motor direction via `set mymotor direction forward/reverse/coast`
3. L293D H-bridge as the driver between chip and motor
4. Power from the supply rail, not through the chip
5. Chip-budget warning must NOT fire (control signals only)
6. `bw_motor_speed` and `bw_motor_dir` round-trip through cToPseudocode
