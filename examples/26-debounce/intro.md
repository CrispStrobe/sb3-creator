---
level: beginner
age: 8+
prereqs: [05-counter-7seg]
teaches: [debounce, switch-bounce, software-filter]
---

## What you see

A button is wired to the MCU and a counter is displayed on a 7-segment display.
Every press should add one to the count, but without debouncing the count jumps
by two, three, or more on a single press. The program shows both the raw
(bouncing) count and the debounced (clean) count side by side.

## Try this

1. Click **Sim** and press the button once. Watch the raw counter -- it likely
   jumps by more than one.
2. Look at the debounced counter next to it. It increments by exactly one per
   press.
3. Try pressing the button rapidly several times and compare both counters.
   The raw count races ahead; the clean count stays accurate.

## What is going on

A mechanical switch does not make a single clean connection when you press it.
The metal contacts literally bounce apart and re-touch several times over a few
milliseconds, producing a burst of on-off-on transitions that the MCU reads as
multiple presses. The software fix is simple: after detecting a press, ignore
further changes for 20--50 ms. By the time that window closes, the contacts
have settled and the next real press will be a genuinely new event.

## Why it matters

Every button, switch, or relay contact in every product you have ever used has
this problem, and every one of them has a debounce solution -- in software, in
hardware, or both. If you skip it, your user presses a button once and the
device acts twice.

## Go further

- **Where bouncing hurts most:** [25-reaction-timer](../25-reaction-timer) --
  a bouncy press adds fake milliseconds to a timing measurement.
- **The counter this builds on:** [05-counter-7seg](../05-counter-7seg) --
  the basic button-driven counter without debounce handling.
- **Experiment:** change the debounce delay from 20 ms to 200 ms. Now press
  the button twice quickly -- the second press gets swallowed. Debounce too
  aggressively and you lose real inputs.
