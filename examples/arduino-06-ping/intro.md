---
level: intermediate
age: 12+
prereqs: [arduino-01-analog-read-serial]
teaches: [ultrasonic-sensor, distance, echo-timing, serial-print]
---
## What you see
An ultrasonic sensor measures distance to the nearest object. The serial monitor prints the distance in centimetres, updating continuously.

## Try this
1. Change the distance stimulus and watch the printed value track it.
2. Set the distance to 0 (object touching the sensor) — the reading should be near zero.
3. Set it beyond 400 cm (the sensor's rated maximum) — the reading clips or becomes unreliable.

## What is going on
The ultrasonic sensor sends a sound pulse and measures how long the echo takes to return. The round-trip time divided by the speed of sound (at ~58 microseconds per centimetre) gives the distance. The simulation models this directly via the distance parameter rather than timing the echo pulse.

## Go further
- [arduino-06-knock](../arduino-06-knock) — analog threshold detection (a different kind of sensor).
- [arduino-sk-p12-knock-lock](../arduino-sk-p12-knock-lock) — combine sensor detection with a lock mechanism.
