---
level: beginner
age: 10+
prereqs: [arduino-01-blink]
teaches: [analog-input, adc, potentiometer, serial-print]
---
## What you see
A potentiometer connected to pin A0. The program reads its position and prints the ADC value (0–1023) to the serial terminal.

## Try this
1. Run the program and turn the potentiometer — the printed values change.
2. Turn fully left (0) and fully right (1023) to see the range.
3. Try reading a different analog pin (A1–A5).

## What is going on
The Arduino's ADC (Analog-to-Digital Converter) measures the voltage on pin A0 and converts it to a number between 0 (0 V) and 1023 (5 V). The potentiometer acts as a voltage divider: turning it changes the voltage at the wiper, which A0 reads. Serial.println() sends the value over the USB serial connection so you can see it.

## Why it matters
Reading analog sensors is how microcontrollers measure the real world — temperature, light, position, force. The potentiometer is the simplest analog sensor to start with.

## Go further
- [arduino-01-read-analog-voltage](../arduino-01-read-analog-voltage) — convert the ADC value to actual voltage.
- [arduino-01-fade](../arduino-01-fade) — use the potentiometer reading to control an LED.
