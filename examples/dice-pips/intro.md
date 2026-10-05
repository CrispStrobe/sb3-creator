---
level: intermediate
age: 10+
prereqs: [27-led-dice, binary-counter-buttons]
teaches: [pseudo-random, procedures, patterns]
---
## What you see
Seven LEDs are arranged like the pips on a die. Press and release the button: the die rolls, slows down and stops on a face from 1 to 6, just like a real one tumbling to rest.

## Try this
1. Run the program and roll a few times. Note the faces on paper — do all six come up?
2. Look at `show face`. Only four IF blocks draw all six faces. Work out which LEDs each IF is responsible for.
3. Replace the 6 in `seed * 6` with 3. What does the die do now?

## What is going on
A computer cannot really toss a coin. This program uses two tricks. First, while you hold the button, a number counts up very fast; nobody can hold a button for exactly the same number of milliseconds twice, so where it stops is unpredictable. Second, each roll feeds that number into a simple formula — multiply by 11, keep the remainder after dividing by 251 — that jumps around in a pattern too tangled to guess. That is called a pseudo-random generator. The face is taken from which sixth of the range 1..250 the number lands in; the obvious shortcut, the remainder after dividing by 6, repeats in a short cycle for neighbouring numbers and would favour some faces.

The face pattern uses the symmetry of a die: the middle pip is on for odd numbers, the diagonal pair for 2 and more, the other diagonal for 4 and more, and the middle pair only for 6.

## Why it matters
Games, simulations and even encryption depend on numbers that are hard to predict. Real systems use better formulas and better sources of chance, but the idea — a seed from the outside world plus a mixing formula — is the same.

## Go further
- [27-led-dice](../27-led-dice) — the simplest die: count while the button is held.
- [reaction-duel](../reaction-duel) — the same random formula decides when a race starts.
- Experiment: roll two dice at once and print their sum.
