# arduino-sk-p10-zoetrope — expected behaviour

## Circuit

Arduino Uno A0 <- wiper of 10 kohm pot. D2 <- forward button. D3 <- reverse button. D9 (PWM) → motor enable. D4, D5 → motor direction control.

## Program

Pot sets motor speed (0-100 percent PWM duty). Forward button spins motor one direction, reverse button spins the other direction. When neither is pressed, motor stops.

## Observable behaviour

- **No buttons pressed:** motor is **stopped** (enable PWM = 0).
- **Forward button held:** motor spins **forward** at speed set by pot.
  - Pot low -> slow. Pot high -> fast.
- **Reverse button held:** motor spins **reverse** at speed set by pot.
- **Pot at zero:** motor does not spin even with button pressed.
- Direction pins (D4, D5) set the H-bridge direction; D9 PWM sets the speed.

## What this verifies

1. H-bridge motor control: direction via D4/D5, speed via PWM on D9
2. Potentiometer-based speed control
3. Two-button forward/reverse selection

```assert
# Supply rail: VCC = 5.0V
net vcc1.vcc V 5.00 +-0.01
```
