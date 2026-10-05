---
level: beginner
age: 10+
prereqs: [13-sos-morse]
teaches: [procedures, morse-code, timing]
---
## What you see
The MCU sends the word HELLO in Morse code — you hear it on the buzzer and see it on the lamp at the same time. Short and long signals make up each letter, and the pauses between them tell letters and words apart.

## Try this
1. Run the program and follow along with the table in the circuit notes: four short for H, one short for E, and so on.
2. Change the word. Look up the Morse code for your name and spell it with `dot`, `dash` and `letter gap`.
3. Make everything faster by changing 0.15 to 0.1 in the procedures — and in the gaps. Which waits must change together to keep the rhythm right?

## What is going on
Morse code is built from one time unit. A dot lasts one unit and a dash three; between the signals of a letter there is one unit of silence, between letters three, and between words seven.

Instead of repeating "on, wait, off, wait" dozens of times, the program defines three small procedures with DEFINE. Each letter is then just a list of procedure calls, which is much easier to read and to change. Every procedure ends with the one-unit silence, so a letter gap only has to add two more units.

## Why it matters
Breaking a task into small named pieces is the most important habit in programming. Here it turns a wall of on/off commands into something that reads almost like the code chart itself.

## Go further
- [13-sos-morse](../13-sos-morse) — SOS on one LED with plain REPEAT loops.
- [binary-counter-buttons](../binary-counter-buttons) — another procedure, this time showing a number.
- Experiment: add a `word gap` procedure and send two words.
