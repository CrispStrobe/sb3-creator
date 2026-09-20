---
level: beginner
age: 8+
prereqs: [05-counter-7seg]
teaches: [debounce, switch-bounce, software-filter]
---

## What you see

A button toggles an LED: press once, the LED changes state once. That sounds
too simple to need a program, and it is exactly the thing a bare
`wait until pressed` gets wrong. A real switch does not close cleanly — its
contacts bounce for a few milliseconds, and the MCU is fast enough to read
every bounce as a separate press, so the LED flickers or ends up in the wrong
state. The 50 ms wait in this program is what makes one press mean one toggle. This example works on all supported microcontrollers — pick a different device in the toolbar to see the adapted circuit.

## Try this

1. Click **Sim** and press the button once. The LED changes state exactly
   once, however quickly you release.
2. Press it rapidly several times. Each press is still one toggle -- the
   program waits for the contacts to settle before it believes either edge.
3. Delete the two `wait 0.05 seconds` lines and press again. On hardware the
   LED now lands on the wrong state about as often as the right one, which is
   the bug this pattern exists to remove.
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
