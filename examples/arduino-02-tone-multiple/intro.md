---
level: intermediate
age: 10+
prereqs: [arduino-02-tone-melody]
teaches: [tone, multiple-outputs, sequencing]
---
## What you see
Three speakers on pins D6, D7, D8 play tones in sequence — A4 (440 Hz), C5 (523 Hz), then E5 (659 Hz). Each sounds briefly, then silences before the next begins.

## Try this
1. Run the program and listen to the three-note sequence repeat.
2. Change the frequencies to play a chord arpeggio (e.g. C-E-G: 523, 659, 784).
3. Remove the turn-off between notes so they overlap.

## What is going on
Each speaker gets its own pin and its own set-tone block. The program plays one at a time in sequence: set the tone, wait, turn it off, then move to the next.

## Go further
- [arduino-02-tone-melody](../arduino-02-tone-melody) — a longer melody on a single speaker.
- [07-buzzer-siren](../07-buzzer-siren) — alternating frequencies for an alarm sound.
