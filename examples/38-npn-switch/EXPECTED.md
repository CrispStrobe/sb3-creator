# 38-npn-switch -- expected behaviour

## Circuit

VCC (5 V) -> R_load (470 Ohm) -> LED (2.0 V at its rated 20 mA) -> NPN collector.
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
- **Base current:** V_be solves to 0.696 V, so I_B = (5.0 - 0.696) / 10000 = 0.430 mA
- **Max collector current:** I_C = beta x I_B = 100 x 0.430 = 43 mA
- **Hand estimate of the collector current, from table figures:**
  (5.0 - 2.0 - 0.2) / 470 = 5.96 mA
- **Actual collector current:** (5.0 - 1.943) / 470 = 6.50 mA. The estimate
  lands about 9 % low because both figures it borrows are quoted for harder
  drive than this bench applies -- see the two below.
- **Transistor is saturated** since 6.50 mA << 43 mA, and V_CE solves to
  0.078 V, not the 0.2 V of the rule of thumb. 0.2 V is not a property of a
  saturated transistor; Vce(sat) rises with how hard the base is driven, and
  the engine derives it from the drive rather than looking it up.
- **LED voltage:** 1.865 V. The 2.0 V on the part's card is a red LED at its
  rated 20 mA; this one passes 6.5 mA and sits lower.
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
