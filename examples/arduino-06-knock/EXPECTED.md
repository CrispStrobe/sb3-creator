# arduino-06-knock — expected behaviour

## Circuit

Arduino Uno A0 <- piezo sensor with 1 Mohm parallel resistor. D13 → 220 ohm → red LED → GND.

## Program

Reads piezo on A0. When the reading exceeds threshold (100), toggles the LED state and prints "Knock!" to serial.

## Observable behaviour

- **No knock:** LED holds its current state (starts OFF). Serial is quiet.
- **Knock detected (sensor > 100):** LED **toggles** (OFF -> ON or ON -> OFF). Serial prints **"Knock!"**.
- Each knock flips the LED. Two knocks return it to its original state.
- The 1 Mohm resistor damps the piezo signal for clean readings.

## What this verifies

1. Analog threshold detection on a piezo sensor
2. Toggle logic: each event flips `ledState` between 0 and 1
3. Event-driven serial output: prints only on knock, not continuously
