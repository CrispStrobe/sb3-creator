# arduino-02-debounce — expected behaviour

## Circuit

Arduino Uno D2 <- pushbutton -> VCC (5 V). 10 kohm pull-down from D2 to GND. D13 → 220 ohm resistor → red LED → GND.

## Program

Each stable button press toggles the LED state. A 50 ms debounce delay filters out contact bounce — the reading must be stable for 50 ms before being accepted.

## Observable behaviour

- **LED starts ON** (initial ledState = 1).
- **Press and release the button once:** LED toggles OFF.
- **Press again:** LED toggles back ON.
- Rapid bouncy presses within 50 ms are ignored.

## What this verifies

1. Debounce logic: `(timer * 1000) - lastDebounceTime > debounceDelay` filters noise
2. Toggle pattern: each accepted press flips `ledState` between 0 and 1
3. State change detection: only triggers on `reading != buttonState`
