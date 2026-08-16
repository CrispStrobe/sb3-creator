# arduino-sk-p13-touch-lamp — expected behaviour

## Circuit

Arduino Uno D2 <- touch sensor (TTP223 module). D3 → LED → GND.

## Program

Each touch toggles the LED: touch once to turn on, touch again to turn off. Uses edge detection (only triggers on rising edge of touch signal).

## Observable behaviour

- **No touch:** LED holds its current state.
- **First touch:** LED turns **ON**.
- **Second touch:** LED turns **OFF**.
- **Subsequent touches:** LED toggles each time.
- Only responds to the transition from not-touched to touched (edge, not level).

## What this verifies

1. Edge detection: `touchVal = 1 and lastTouch = 0` catches only rising edges
2. Toggle logic: each touch flips `ledState` between 0 and 1
3. Touch sensor input via digital pin
