---
level: intermediate
age: 12+
prereqs: [arduino-03-calibration]
teaches: [theremin, ldr, tone, auto-calibration, sensor-mapping]
---
## What you see
Light Theremin: during the first few seconds the program auto-calibrates the LDR range. Then it maps the light level to pitch on a buzzer — wave your hand over the sensor to play music.

## Try this
1. During calibration, expose the LDR to the full range of light you want to use.
2. After calibration, change the light stimulus and hear the pitch track it.
3. Narrow the calibration range (dark only) and hear how the same light change produces a wider pitch sweep.

## What is going on
The first phase records sensorMin and sensorMax — the LDR's range in your environment. The second phase maps each reading from that range to 200-5000 Hz. A narrow calibration range means small light changes produce big pitch changes; a wide range means the pitch responds gently. This is the same calibration concept as arduino-03-calibration, applied to sound.

## Go further
- [arduino-02-tone-pitch-follower](../arduino-02-tone-pitch-follower) — fixed-range pitch follower (no calibration).
- [arduino-03-calibration](../arduino-03-calibration) — the calibration pattern with LEDs instead of sound.
