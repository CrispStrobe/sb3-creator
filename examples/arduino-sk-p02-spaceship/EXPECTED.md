# arduino-sk-p02-spaceship — expected behaviour

## Circuit

Arduino Uno D3 → 220 ohm → green LED → GND. D4, D5 → 220 ohm each → two red LEDs → GND. D2 <- pushbutton with pull-down.

## Program

Green LED is on by default (idle state). When button is pressed, green turns off and the two red LEDs alternate at 250 ms — a flashing alert pattern.

## Observable behaviour

- **Button released:** green LED on D3 is **ON**. Both red LEDs are **OFF**.
- **Button pressed:** green LED turns **OFF**. Red LEDs alternate:
  - Red 1 (D4) ON for 250 ms, Red 2 (D5) OFF.
  - Red 1 OFF, Red 2 ON for 250 ms.
  - Repeats as long as button is held.
- Releasing the button returns to green-on state.

## What this verifies

1. Button-driven state change: idle (green) vs alert (red alternating)
2. Timed alternation with `wait 0.25 seconds`
3. Multiple LED coordination across three pins
