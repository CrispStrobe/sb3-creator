---
level: intermediate
age: 10+
prereqs: [random-lucky-light, 05-counter]
teaches: [input, random, loops, comparison]
---
## What you see
Open the serial monitor. The chip asks for your name, greets you and says it is thinking of a number from 1 to 100. Type a guess and press Enter: it tells you "Higher!" or "Lower!" until you hit the number. Then it tells you how many tries you needed and lights a lamp.

## Try this
1. Play a round. What is the smallest number of tries that always works if you are clever?
2. Change the range to 1 to 1000. How many more tries do you need?
3. Make the chip say "Too many tries!" after the tenth wrong guess.

## What is going on
`ask "Your guess?" and wait` sends the question over the serial line and then waits until you have typed a line and pressed Enter. What you typed is `answer`. Used as a name (`join "Hello " answer`) it is text; used as a number (`set guess to answer`) it is the number you typed — text that is not a number counts as 0, as everywhere in Scratch.

`pick random 1 to 100` chooses the secret. Chips cannot really roll dice, so the generator stirs its numbers while it waits for you to type: how long you take is chance it can use. That is also why the name question comes first.

`REPEAT UNTIL guess = secret` keeps asking. Every wrong guess cuts the possible range: the best strategy, always guessing the middle, needs at most 7 tries for 100 numbers.

## Why it matters
Halving the range at every step is called binary search. Computers use it all the time to find things fast: a name in a phone book, a word in a dictionary, a record in a database with millions of rows.

## Go further
- [random-lucky-light](../random-lucky-light) — chance from a button press instead.
- [05-counter](../05-counter) — counting events, like the tries here.
- Experiment: let the chip guess YOUR number, and answer it with "higher" or "lower".
