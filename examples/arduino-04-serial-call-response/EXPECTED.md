# arduino-04-serial-call-response — expected behaviour

## Circuit

Arduino Uno A0, A1 <- wipers of two 10 kohm pots (VCC to GND). D2 <- pushbutton with 10 kohm pull-down.

## Program

Continuously reads two analog sensors and one digital button, printing all three values to serial every 100 ms.

## Observable behaviour

Serial monitor prints three values per cycle:
- **Line 1:** pot 1 value (0-1023)
- **Line 2:** pot 2 value (0-1023)
- **Line 3:** button state (0 or 1)

Turning pots changes the first two values; pressing the button changes the third.

## What this verifies

1. Simultaneous analog and digital reads
2. Multi-sensor serial output pattern
3. Adapted from call-response protocol — simplified to continuous print

```assert
# Supply rail: VCC = 5.0V
net vcc1.vcc V 5.00 +-0.01
# Pot at 50%: wiper = 5.0 × 0.5 = 2.500V
net pot1.wiper V 2.50 +-0.05
# Pot at 50%: wiper = 5.0 × 0.5 = 2.500V
net pot2.wiper V 2.50 +-0.05
```
