---
level: intermediate
age: 10+
prereqs: [arduino-02-tone-melody]
teaches: [tone, ldr, sensor-mapping, analog-to-frequency]
---
## What you see
A light sensor (LDR) on A0 controls the pitch of a buzzer on D9 — more light means a higher tone. The serial monitor prints the raw sensor value.

## Try this
1. Change the LDR stimulus and hear the pitch rise and fall.
2. Change the output range from 120-1500 Hz to 200-800 Hz for a narrower musical range.
3. Set the LDR below 400 and hear the pitch floor at 120 Hz.

## What is going on
The program reads the LDR (0-1023), maps the 400-1000 range linearly to 120-1500 Hz, and sets the speaker tone. Values outside the input range clip. The loop runs every 50 ms, so the pitch tracks the light level in near real-time — a light theremin.

## Go further
- [arduino-02-tone-keyboard](../arduino-02-tone-keyboard) — discrete notes from separate sensors.
- [arduino-sk-p06-light-theremin](../arduino-sk-p06-light-theremin) — the Starter Kit version with calibration.
