# 41-pot-as-dimmer -- expected behaviour

## Circuit

VCC (5 V) -> pot (10 kOhm, terminal a).
Pot terminal b -> GND.
Pot wiper -> R1 (220 Ohm) -> red LED (Vf = 2.0 V) -> GND.

No MCU -- pot position directly controls LED brightness.

## Observable behaviour (position = 0.5, wiper at midpoint)

- **Wiper voltage:** 5.0 x 0.5 = 2.5 V (unloaded divider approximation)
- **LED current:** (2.5 - 2.0) / 220 = 2.3 mA (dim)

### At different pot positions

| Position | V_wiper (approx) | I_LED (mA) | LED state      |
|----------|-------------------|------------|----------------|
| 0.0      | 0.0 V             | 0          | OFF (below Vf) |
| 0.3      | 1.5 V             | 0          | OFF (below Vf) |
| 0.5      | 2.5 V             | 2.3        | dim            |
| 0.7      | 3.5 V             | 6.8        | medium         |
| 1.0      | 5.0 V             | 13.6       | bright         |

Note: wiper voltage is approximate since load current affects the divider.
The 220 Ohm series resistor protects the LED at full rotation.

## What this verifies

1. Potentiometer as a variable voltage divider
2. LED has a threshold (Vf) below which it does not conduct
3. Series resistor limits maximum current at full rotation

```assert
# Pot at 50%: wiper = 2.50V; LED Shockley Vf ≈ 2.02V
net pot1.wiper V 2.50 +-0.05
net led1.anode V 2.02 +-0.15
```
