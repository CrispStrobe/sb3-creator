# arduino-02-digital-input-pullup — expected behaviour

## Circuit

Arduino Uno D2 <- pushbutton -> GND (no external pull-up — uses internal pull-up). D13 → 220 ohm resistor → red LED → GND.

## Program

Reads D2 and prints its value to serial every 100 ms. LED is driven as the inverse of the button: pressed (LOW) -> LED on, released (HIGH) -> LED off.

## Observable behaviour

- **Button released:** D2 reads HIGH (1) via internal pull-up. Serial prints **1**. LED is **OFF**.
- **Button pressed:** D2 is pulled LOW (0) through the button to GND. Serial prints **0**. LED is **ON**.
- The logic is inverted compared to external pull-down examples: LOW = pressed.

## What this verifies

1. Internal pull-up: D2 reads HIGH when floating, LOW when grounded through button
2. Inverted logic: `if sensorVal = 1 then: turn off led` — HIGH means not pressed
3. Serial monitoring of digital input state

```assert
# Supply rail: VCC = 5.0V
net vcc1.vcc V 5.00 +-0.01
```
