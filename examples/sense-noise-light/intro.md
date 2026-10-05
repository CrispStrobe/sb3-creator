---
level: intermediate
age: 10+
prereqs: [03-night-light, 14-traffic-light]
teaches: [sound-level, peak-detection, thresholds]
---
## What you see
A traffic light for noise. The sound module's analog output tells the MCU how loud the room is: green for calm, yellow for lively and red for too loud. Useful in a classroom or a workshop where people should notice when the noise creeps up.

## Try this
1. Run the program and move the sound level slider slowly from 0 upwards. Watch green change to yellow and then red.
2. Find the slider positions where the colour changes and compare them with 400 and 700 in the program (the reading goes from 0 to 1023).
3. Press Clap while the slider is low. Does a single short clap reach red? It should, because the program keeps the loudest of its 20 readings.

## What is going on
The module's analog output is a voltage proportional to the sound level, so the ADC reads it directly — no voltage divider is needed, unlike an LDR. Real sound is a fast wave that swings up and down hundreds of times a second, so one reading can land anywhere on the wave. Taking 20 readings and keeping only the largest (the peak) gives a steady answer.

Two thresholds split the range into three bands, and the nested IF/ELSE makes sure exactly one LED is on.

## Why it matters
Peak detection is how a sound level meter, a guitar tuner's input display or a VU meter behaves. Turning a measurement into a few clear bands is a classic way to make data easy to read at a glance.

## Go further
- [sense-noise-counter](../sense-noise-counter) — count noises with the digital output instead.
- [16-ldr-bargraph](../16-ldr-bargraph) — show a measurement on more steps.
- Experiment: let red stay on for two seconds after the last loud peak, so short bursts are easier to notice.
