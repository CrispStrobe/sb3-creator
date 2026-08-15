---
level: beginner
age: 12+
prereqs: [pico01-blink]
teaches: [adc, serial-output, potentiometer]
---
## What you see
A potentiometer connected to an analog input of the Raspberry Pi Pico. The program reads the pot position and prints the value over serial, updating as you turn the knob.

## Try this
1. Run the program and open the serial monitor — turn the potentiometer and watch the values change.
2. Note the range: the Pico's ADC is 12-bit, so values go from 0 to 4095 instead of the Arduino's 0-1023.
3. Hold the pot steady and observe whether the readings are stable or jitter slightly — ADC noise is normal.

## What is going on
The RP2040 has a 12-bit ADC with four channels (GPIO 26-29). The potentiometer outputs a voltage between 0 and 3.3 V, which the ADC converts to a number from 0 to 4095. Higher resolution (12 bits vs. 10 bits) means finer measurement steps — each count represents about 0.8 mV instead of 4.9 mV. The program reads this value in a loop and sends it as text over USB serial. The Pico's ADC is known to be somewhat noisy, so readings may fluctuate by a few counts even with a steady input.

## Why it matters
The Pico's 12-bit ADC gives more precision than the Arduino's 10-bit ADC, which matters for sensors that produce small voltage changes. Understanding ADC resolution and noise helps you choose the right board for your measurement needs and know when external ADCs are worth adding.

## Go further
- [pico01-blink](../pico01-blink) — the basics of Pico programming.
- [nano02-pot-print](../nano02-pot-print) — compare with the Nano's 10-bit ADC.
- Experiment: average 16 readings before printing and observe how the noise decreases — this is a simple digital filter.
