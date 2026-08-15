---
level: beginner
age: 10+
prereqs: [avr01-blink]
teaches: [serial-output, adc, potentiometer, debugging]
---
## What you see
A potentiometer connected to the Arduino's analogue input. The program reads the ADC value and prints it over the serial port — you see the number change as you turn the knob.

## Try this
1. Click **Sim** and open the serial monitor to see the ADC readings.
2. Turn the pot and watch the number change from 0 to 1023.
3. Note how the readings update every 0.5 seconds — that is the sampling rate.

## What is going on
The Arduino's ADC converts the pot's wiper voltage (0–5 V) into a 10-bit number (0–1023). The program reads this number and sends it as text over the UART serial port. Serial output is the simplest way to get data out of a microcontroller for debugging or logging — no display needed, just a terminal.

## Why it matters
Serial print is the embedded developer's `console.log`. When something is not working, the first thing you do is print a variable to see what the chip actually sees. This pattern — read sensor, print value, repeat — is how you validate every sensor in a project.

## Go further
- [avr02-dimmer](../avr02-dimmer) — use the pot to control an LED instead of printing.
- [avr06-blink-and-print](../avr06-blink-and-print) — serial printing while another task runs.
- Experiment: print the voltage instead of the raw ADC count (multiply by 5.0/1023).
