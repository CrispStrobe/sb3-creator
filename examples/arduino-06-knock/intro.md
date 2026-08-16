---
level: intermediate
age: 12+
prereqs: [arduino-01-analog-read-serial]
teaches: [piezo-sensor, analog-threshold, knock-detection]
---
## What you see
A piezo sensor on A0 detects knocks. When the analog reading exceeds the threshold, the serial monitor prints the knock value and an LED blinks. Light taps are ignored; firm knocks register.

## Try this
1. Set the piezo stimulus above 100 (the default threshold) to trigger a knock event.
2. Lower the threshold to 50 to detect lighter taps.
3. Raise it to 200 to require harder knocks — useful in noisy environments.

## What is going on
The piezo element generates a voltage spike when struck or vibrated. The ADC reads this as a momentary high value (0-1023). The program compares each reading to a threshold: above it counts as a knock, below is noise. A short delay after each detection prevents double-counting from the piezo's ring.

## Go further
- [arduino-sk-p12-knock-lock](../arduino-sk-p12-knock-lock) — use three knocks to unlock a servo.
- [arduino-06-ping](../arduino-06-ping) — distance measurement with an ultrasonic sensor.
