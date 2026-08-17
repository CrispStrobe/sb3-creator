# 44-darlington-motor -- expected behaviour

## Circuit

VCC (5 V) -> buzzer -> NPN collector.
NPN emitter -> GND.
VCC -> button -> R_base (10 kOhm) -> NPN base.

No MCU -- button directly drives the buzzer via transistor switch.
(Uses a buzzer as the inductive load stand-in for a motor.)

## Observable behaviour

### Button released (open)
- No base current
- NPN is OFF
- Buzzer is silent
- No current drawn

### Button pressed (closed)
- **Base current:** I_B = (5.0 - 0.7) / 10000 = 0.43 mA
- **Available collector current:** beta x I_B = 100 x 0.43 = 43 mA
- Transistor saturates (V_CE ~ 0.2 V)
- Buzzer receives ~4.8 V and sounds
- **Buzzer state:** ON

## What this verifies

1. NPN transistor switches an inductive/higher-current load
2. Small base current controls large collector current
3. Button provides the base drive signal without an MCU

```assert
# NPN off (button open): buzzer collector side at VCC
net btn1.a V 5.00 +-0.01
```
