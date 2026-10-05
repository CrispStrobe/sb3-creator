---
level: beginner
age: 9+
prereqs: [01-blink, 11-toggle-button]
teaches: [random, events, procedures]
---
## What you see
Four lamps and a button. Press the button: the lamps flicker for half a second and then exactly one of them stays lit. Which one? That is up to chance.

## Try this
1. Press the button ten times and write down which lamp wins. Does every lamp win sometimes?
2. Change `pick random 1 to 4` in the last line to `pick random 1 to 2`. Which lamps can win now?
3. Make the flicker longer by changing the `8` in `REPEAT 8`.

## What is going on
`pick random 1 to 4` gives a whole number from 1 to 4 that the program cannot predict. Inside the chip a small formula stirs a big number every time it is asked, and it also stirs in the exact millisecond at which you pressed the button — which nobody can control. So the result looks like the roll of a four-sided die.

`show lamp` switches all four lamps off and then lights the one whose number is in `lamp`.

The script has no "when flag clicked" at all. It starts by itself whenever the button goes down: a WHEN hat on a pin. Holding the button down does not restart it; only a new press does.

## Why it matters
Games need chance, and so do many simulations. Waiting for an event instead of checking over and over is how most real devices work: a remote control, a doorbell or a keyboard does nothing until a button is pressed.

## Go further
- [dice-pips](../dice-pips) — a die that makes its own chance from the button press.
- [melody-lists](../melody-lists) — another program started by a button.
- Experiment: count how often each lamp wins and print the four counts.
