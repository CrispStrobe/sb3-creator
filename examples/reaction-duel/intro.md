---
level: intermediate
age: 10+
prereqs: [25-reaction-timer, dice-pips]
teaches: [reaction-time, pseudo-random, game-logic]
---
## What you see
A two-player reaction game. Both players rest a finger on their key. After a random wait the go LED lights, and whoever presses first wins — their LED flashes and their reaction time in milliseconds appears on the serial monitor. Press too early and the round goes to your opponent.

## Try this
1. Play a few rounds with a friend, or press A and B yourself to test both sides.
2. Press A before go lights. The round is lost for A, and the monitor says so.
3. Find the line that decides the random wait and change it so the wait is 1 to 3 seconds instead.

## What is going on
The wait is random so nobody can learn the rhythm and press early on purpose. It comes from the same small formula as the die in the dice example: multiply by 11 and keep the remainder after dividing by 251. The reaction time of each round is mixed back into that number, so the next wait depends on how fast the players actually were.

While waiting, the program checks both keys every 10 ms. Its loop stops as soon as EITHER the time is up OR someone has pressed — two conditions joined with OR. After go, a second loop counts milliseconds until either key goes down.

## Why it matters
Fair games need unpredictable timing and clear rules for cheating. The same pattern — wait, watch for a too-early input, then measure the response — is used in real reaction-time tests for sport and road safety.

## Go further
- [25-reaction-timer](../25-reaction-timer) — the single-player version.
- [two-toggle-keys](../two-toggle-keys) — reading two keys without either one blocking the other.
- Experiment: play best of five — keep a score for each player and flash the overall winner at the end.
