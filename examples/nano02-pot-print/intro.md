---
level: beginner
age: 12+
prereqs: [nano01-blink]
teaches: [adc, serial-output, potentiometer]
---
## What you see
A potentiometer connected to an analog input of the Arduino Nano. The program reads the pot position and prints the value to the serial monitor, updating continuously as you turn the knob.

## Try this
1. Run the program, open the serial monitor, and turn the potentiometer — watch the numbers change from 0 to 1023.
2. Turn the pot to the middle position and confirm the reading is near 512.
3. Change the print interval and observe faster or slower updates.

## What is going on
The potentiometer is a variable resistor that outputs a voltage between 0 V and 5 V depending on its position. The Nano's ADC (Analog-to-Digital Converter) samples this voltage and converts it to a number from 0 (0 V) to 1023 (5 V) with 10-bit resolution. The program reads this value in a loop and sends it as text over the serial connection, which you can view in a terminal. This is the simplest way to get analog sensor data out of a microcontroller.

## Why it matters
Reading analog values and printing them is the foundation of data acquisition. Temperature sensors, light sensors, pressure sensors, and joysticks all produce analog voltages. Once you can read and display them, you can start making decisions based on sensor input.

## Go further
- [nano01-blink](../nano01-blink) — the basics of running code on the Nano.
- [nano03-two-tasks](../nano03-two-tasks) — read a sensor while doing something else.
- Experiment: replace the potentiometer with an LDR voltage divider and watch the values change with ambient light.
