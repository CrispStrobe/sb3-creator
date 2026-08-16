---
level: beginner
age: 8+
prereqs: []
teaches: [tone, buzzer, melody, note-frequencies]
---
## What you see
A buzzer on pin D8 plays an 8-note melody: C4 G3 G3 A3 G3 rest B3 C4. Each note sounds for a fraction of a second before the next begins.

## Try this
1. Run the program and listen to the tune.
2. Change a frequency (262 is C4, 330 is E4, 392 is G4) and hear the melody change.
3. Change the wait times to make some notes longer — quarter vs eighth notes.

## What is going on
Each set-tone block drives the speaker pin at a specific frequency (in Hz). Musical notes map to frequencies: C4 is 262 Hz, G3 is 196 Hz, A3 is 220 Hz. A wait between notes sets the duration. Setting the tone to 0 silences the speaker for a rest.

## Go further
- [arduino-02-tone-keyboard](../arduino-02-tone-keyboard) — play notes by pressing sensors.
- [arduino-02-tone-pitch-follower](../arduino-02-tone-pitch-follower) — map a sensor reading to pitch.
