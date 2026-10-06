---
level: beginner
age: 10+
prereqs: [01-blink]
teaches: [temperature, on-chip-sensor, serial-output]
---
## What you see
Every reading goes to the serial monitor, for example `Chip: 25 C`, and the LED on D13 flashes with it: a short blink while the chip is cool, a long one when it is warmer than 30 degrees.

## Try this
1. Run the program and open the serial monitor: a new line with every short blink.
2. In the simulator the chip sits on a bench at 25 degrees, so the blinks stay short. If your bench lets you change its temperature, raise it above 30 and watch them grow long.
3. On a real board, hold a warm finger on the chip for a while — the reading creeps up.

## What is going on
A silicon junction's voltage changes by about a millivolt per degree. The chip measures one of its own junctions with its analog-to-digital converter, against a fixed internal reference, and `chip temperature` turns that reading into degrees with the curve from the chip's datasheet.

The figure is uncalibrated: a real chip can be a few degrees off, and it measures the silicon, which is a little warmer than the room when the chip is busy. Good enough to notice "too hot", not to replace a thermometer.

## Why it matters
Phones, laptops and cars watch their own chips this way and slow down before anything overheats. A sensor you already have costs nothing to read.

## Go further
- [sense-thermometer-1wire](../sense-thermometer-1wire) — a separate DS18B20 sensor measures the room, not the chip.
- Not every chip has a sensor: on the 8051 boards, the Arduino Mega and the ATtiny88 the program is refused with that reason.
- Experiment: print the highest temperature seen so far.
