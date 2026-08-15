---
level: beginner
age: 12+
prereqs: [mega01-blink]
teaches: [multi-channel-adc, serial-output, analog-scanning]
---
## What you see
The Arduino Mega reads all 16 analog input channels in sequence and prints each value to the serial monitor. You see a table of readings updating continuously, one row per scan.

## Try this
1. Run the program and open the serial monitor to see all 16 channels printing.
2. Connect a potentiometer to one channel and watch that channel's value change while the others stay stable.
3. Touch an unconnected analog pin with your finger and observe the floating readings jump — this shows why unused inputs should be tied to ground.

## What is going on
The Mega's ATmega2560 has a 10-bit ADC with a 16-channel multiplexer. The program selects each channel in turn, reads the voltage (0-1023), and prints it. One ADC does all the work — it just switches which input it is looking at. Each conversion takes microseconds, so scanning all 16 channels is fast enough to appear simultaneous. This is the same principle used in data loggers and multi-sensor systems.

## Why it matters
Many projects need more than one analog sensor: temperature and humidity, multiple light sensors for direction, several potentiometers for a mixing console. The Mega's 16 channels handle these without external multiplexers, making it the go-to board for sensor-rich projects.

## Go further
- [mega01-blink](../mega01-blink) — start with the basics on the Mega.
- [nano02-pot-print](../nano02-pot-print) — single-channel ADC on the Nano for comparison.
- Experiment: connect a thermistor to one channel and an LDR to another, and print both readings on one line — you now have a two-sensor data logger.
