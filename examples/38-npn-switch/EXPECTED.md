# 38-npn-switch -- expected behaviour

## Circuit

VCC (5 V) -> R_load (470 Ohm) -> LED (Vf = 2.0 V) -> NPN collector.
NPN emitter -> GND.
VCC -> button -> R_base (10 kOhm) -> NPN base.

No MCU -- button directly drives the transistor.

## Observable behaviour

### Button released (open)
- No base current flows
- NPN is OFF (cutoff)
- LED is OFF
- No current drawn from supply

### Button pressed (closed)
- **Base current:** I_B = (5.0 - 0.7) / 10000 = 0.43 mA
- **Max collector current:** I_C = beta x I_B = 100 x 0.43 = 43 mA
- **Actual collector current (limited by load):** (5.0 - 2.0 - 0.2) / 470 = 5.96 mA
- **Transistor is saturated** (V_CE ~ 0.2 V) since 5.96 mA << 43 mA
- **LED voltage:** 2.0 V
- **LED state:** ON, good brightness

## What this verifies

1. NPN transistor as a switch (saturation vs cutoff)
2. Base resistor limits base current
3. Button controls high-current load through low-current base drive

```assert
# NPN off (button open): collector at VCC through R (LED reverse)
net btn1.a V 5.00 +-0.01
net led1.cathode V 4.50 +-0.20
```
