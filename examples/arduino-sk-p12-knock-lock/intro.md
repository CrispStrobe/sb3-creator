---
level: intermediate
age: 12+
prereqs: [arduino-06-knock]
teaches: [piezo-sensor, servo, state-machine, lock, threshold]
---
## What you see
Knock the piezo sensor 3 times above the threshold to unlock a servo (green LED lights). Press the button to re-lock (red LED). Yellow LED shows knock detection.

## Try this
1. Set the piezo stimulus above the threshold 3 times to trigger the unlock sequence.
2. Press the button to re-lock and watch the red LED come on.
3. Change the knock threshold to make the lock easier or harder to open.

## What is going on
The program is a state machine: LOCKED (red LED) waits for 3 valid knocks. Each knock above the analog threshold increments a counter and blinks the yellow LED. After 3 knocks, the servo moves to the unlock position and the green LED lights. The button press resets the state to LOCKED.

## Go further
- [arduino-06-knock](../arduino-06-knock) — simpler knock detection without the lock.
- [53-servo-sweep](../53-servo-sweep) — servo position control without a sensor.
