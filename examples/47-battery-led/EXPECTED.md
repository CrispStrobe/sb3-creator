# 47-battery-led -- expected behaviour

## Circuit

9 V battery (internal resistance 0.5 Ohm) -> 1 kOhm resistor -> red LED (Vf = 2.0 V) -> battery negative.
No MCU -- pure passive circuit powered by a real battery, not VCC.

## Observable behaviour

- **Circuit current:** (9.0 - 2.0) / (1000 + 0.5) = 7.0 mA (approximately)
- **Voltage across resistor:** 7.0 mA x 1000 = 7.0 V
- **Voltage across LED:** 2.0 V (forward voltage)
- **Voltage drop across battery internal resistance:** 7.0 mA x 0.5 = 3.5 mV (negligible)
- **LED state:** always ON, moderate brightness

## What this verifies

1. A battery part works as a voltage source with internal resistance
2. Ohm's law: I = (V_bat - V_f) / R_total
3. Battery replaces VCC/GND as power source in a self-contained circuit
4. Current-limiting resistor protects the LED

```assert
# Battery: 9.0V (default for battery part)
net bat1.pos V 9.00 +-0.01
```
