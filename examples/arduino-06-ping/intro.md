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
2. Compare the reading at 40 cm and 120 cm.
3. Set the distance to 600 cm to see the timeout reading, 999.

## What is going on
The microcontroller sends a 10 µs pulse on TRIG. The sensor raises ECHO for about 58 µs per centimetre of round-trip sound travel. The program measures how long ECHO stays high and reports the distance in centimetres.

## Go further
- [arduino-06-knock](../arduino-06-knock) — analog threshold detection (a different kind of sensor).
- [arduino-sk-p12-knock-lock](../arduino-sk-p12-knock-lock) — combine sensor detection with a lock mechanism.
