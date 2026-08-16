# arduino-sk-p05-servo-mood — expected behaviour

## Circuit

Arduino Uno A0 <- wiper of 10 kohm pot (VCC to GND). D9 → servo control signal.

## Program

Reads pot on A0 and maps (0-1023) to angle (0-180). Writes the angle as PWM to D9. Updates every 50 ms.

## Observable behaviour

- **Pot fully CCW:** servo at **0 degrees**.
- **Pot at midpoint:** servo at **90 degrees**.
- **Pot fully CW:** servo at **180 degrees**.
- Turning the pot smoothly sweeps the servo position.
- The servo tracks the pot position in real time.

## What this verifies

1. Analog-to-angle mapping: `(read pot * 180) / 1023`
2. Servo control via PWM on D9
3. Proportional position control from a potentiometer
