---
level: intermediate
age: 10+
prereqs: [07-buzzer-siren, 11-toggle-button]
teaches: [lists, sound, procedures, events]
---
## What you see
When the program starts, the speaker plays a short tune of six notes. Press the button and it plays again.

## Try this
1. Listen to the tune and follow along in the two lists. Which number is the long last note?
2. Change one number in `notes` — try 440 — and play the tune again.
3. Add a seventh note: put a number at the end of `notes` AND one at the end of `lengths`. What happens if you forget the second list?

## What is going on
A list is a row of numbers kept in order. This tune is stored in two lists side by side: `notes` holds the pitch of each note as a frequency in hertz (262 is the note C, 392 is G), and `lengths` holds how long each note lasts in milliseconds. `play tune` walks along both lists with a counter `i`: item 1 of each list, then item 2, and so on, `length of notes` times.

A note is a square wave: the program sets the speaker pin to a frequency, and a timer inside the chip flips the pin that many times per second, on its own, while the program waits. Setting 0 Hz switches the sound off. The short pause between notes keeps two equal notes from blurring into one.

The second script starts by itself whenever the button is pressed — a WHEN hat on a pin.

## Why it matters
Storing data apart from the code that uses it is one of the most useful ideas in programming: the same `play tune` plays any melody you put in the lists. Music boxes, phone ringtones and video game soundtracks all work from lists of notes like these.

## Go further
- [07-buzzer-siren](../07-buzzer-siren) — two tones and no lists.
- [random-lucky-light](../random-lucky-light) — another program started by a button press.
- Experiment: make a third list for the volume, or play the tune backwards by counting `i` down.
