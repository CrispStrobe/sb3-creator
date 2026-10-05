---
level: beginner
age: 10+
prereqs: [01-blink, 11-toggle-button]
teaches: [pseudo-random, serial-output, choices]
---
## What you see
Bored? Press the key and the MCU suggests a project on the serial monitor, built from three random words — "paint a secret robot", "program a blinking game". Three lists of four words give 64 different ideas.

## Try this
1. Run the program, open the serial monitor and press the key a few times.
2. Replace the words with your own: things to do, places, food — anything.
3. Add a fifth word to one list. What else in the program has to change so the new word can be chosen?

## What is going on
While you wait, a number called `seed` counts up a thousand times a second. The moment you press the key freezes it at a value you could never hit on purpose. A short formula — multiply by 11, keep the remainder after dividing by 251 — then stirs the number before each word, and asking which quarter of 1..250 it landed in turns it into a choice from 1 to 4. The same formula is used three times in a row, once for each list.

Each word is printed on its own line, so a full idea is three lines on the serial monitor.

## Why it matters
Random choice from lists is behind word games, quiz apps, shuffle buttons and procedurally generated game levels. It is also a nice way to see that "random" on a computer is a recipe, not magic.

## Go further
- [dice-pips](../dice-pips) — the same random formula shown on LEDs.
- [reaction-duel](../reaction-duel) — the same formula decides when a race starts.
- Experiment: light the lamp only when the idea contains "robot".
