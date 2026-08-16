---
level: intermediate
age: 10+
prereqs: [arduino-02-tone-melody]
teaches: [tone, analog-input, sensor-to-sound, conditional]
---
## What you see
Two analog sensors on A0 and A1 act as a keyboard: press one for 440 Hz (A4), the other for 494 Hz (B4). Release both and the speaker goes silent.

## Try this
1. Set the A0 stimulus above 10 to hear a 440 Hz tone.
2. Set A1 instead — a different note plays.
3. Change 440 to 523 (C5) and 494 to 587 (D5) to build a different scale.

## What is going on
The program reads two analog pins in a loop. If either reading is above a threshold (10), it drives the speaker at the corresponding frequency. Otherwise the speaker is silent. Each sensor selects one note.

## Go further
- [arduino-02-tone-melody](../arduino-02-tone-melody) — play a fixed melody instead of live notes.
- [arduino-02-tone-pitch-follower](../arduino-02-tone-pitch-follower) — continuous pitch from one sensor.
