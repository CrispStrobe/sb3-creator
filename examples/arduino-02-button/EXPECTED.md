# arduino-02-button — expected behaviour

## Circuit

Arduino Uno D2 <- pushbutton -> VCC (5 V). 10 kohm pull-down from D2 to GND. D13 → 220 ohm resistor → red LED → GND.

## Program

Reads D2 and mirrors its state to the LED on D13: button pressed -> LED on, button released -> LED off.

## Observable behaviour

- **Button released:** D2 reads LOW (pull-down holds it at 0 V). LED on D13 is **OFF**.
- **Button pressed:** D2 reads HIGH (connected to VCC). LED on D13 is **ON**.
- Response is immediate — the LED follows the button with no delay.

## What this verifies

1. Digital input on D2 reads button state through pull-down resistor
2. Conditional `if read btn then: turn on led` maps input to output
3. Active-high button wiring (VCC through button, pull-down to GND)

```assert
# Arduino 5V rail
net board.5v V 5.00 +-0.01
```
