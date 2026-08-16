---
level: beginner
age: 10+
prereqs: [arduino-02-tone-melody]
teaches: [buttons, tone, digital-input, musical-keyboard]
---
## What you see
Four buttons on pins D2-D5 each play a different musical note through a speaker on D8. Press a button to hear its note; release and the speaker goes silent.

## Try this
1. Press each button and hear the four different notes.
2. Change the frequencies to play a different scale (e.g. C-D-E-F instead of C-E-G-A).
3. Try pressing two buttons at once — which note wins?

## What is going on
Each button is read as a digital input. When pressed, the program sets the speaker tone to that button's frequency. When no button is pressed, the tone is set to 0 (silent). Only one tone can play at a time on a single speaker, so the last button pressed wins.

## Go further
- [arduino-02-tone-melody](../arduino-02-tone-melody) — play a fixed melody automatically.
- [arduino-sk-p06-light-theremin](../arduino-sk-p06-light-theremin) — continuous pitch from a light sensor.
