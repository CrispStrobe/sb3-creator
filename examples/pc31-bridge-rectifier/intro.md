---
level: intermediate
age: 12+
prereqs: [pc08-diode-polarity, pc34-polarity-protector]
teaches: [rectifier, bridge, diode-conduction-path, forward-voltage-drop, polarity]
---

## What you see

Four diodes in a diamond, a resistor, and an LED. Trace the diamond with your
finger: the two on the left point *away* from the source's left terminal, the
two on the right point *towards* it. Nothing here is symmetric by accident.

## Try this

1. Click **Sim**. The LED lights, at **5.44 mA**.
2. Reverse the source — set `src`'s volts from `9` to `-9`.
3. The LED lights, at **5.44 mA**. Exactly the same. That is the whole trick.
4. Now measure the source terminals in both cases. They swap completely:
   +8.25 V and −0.75 V one way round, −0.75 V and +8.25 V the other.
5. Measure the bridge output (`r1.a`) in both cases: **7.49 V**, unmoved.

## What is going on

A single diode gets you halfway: it blocks the wrong polarity, so a backwards
supply gives you nothing at all. A bridge does better — it *rearranges* the wrong
polarity into the right one, so nothing is wasted.

Follow the current when the left terminal is positive. It can only leave through
the diode that points away from it, up to the top of the diamond — that is the
output's positive side. It runs through the resistor and the LED, arrives at
ground, and now has to get back to the source's other terminal. There is exactly
one diode pointing that way. Two of the four diodes carry it; the other two are
backwards to this current and stay shut.

Now flip the source. The current starts from the other side, and by the same
argument it takes the *other* pair of diodes — but look where it enters the load:
the top of the diamond again, then down through the LED to ground again. The load
cannot tell which pair delivered it. That is why a bridge is drawn as a diamond:
both diagonals feed the same corner.

The cost is in step 5. Every trip through the bridge crosses two diodes, and each
one keeps about 0.75 V for itself, so the load gets 9 − 1.5 = 7.5 V. On a 9 V
supply that is annoying; on a 5 V one it hurts; on 230 V mains nobody notices.

Give the source an alternating polarity instead of a switchable one and this
circuit is a **rectifier**: the input swings up and down, the output only ever
goes one way. Add a capacitor across the load and the bumps smooth out into a DC
supply — which is what is inside nearly every power adapter you own.

## Why it matters

Mains electricity alternates; almost every circuit needs it not to. The bridge
rectifier is the piece that makes the swap, and it has been doing the job
essentially unchanged since the 1920s. The same four diodes also appear on DC
inputs simply so it does not matter which way you plug the barrel jack in.

## Go further

- **First, if you have not:** [pc08-diode-polarity](../pc08-diode-polarity) — one
  diode, one direction.
- **Compare:** [pc34-polarity-protector](../pc34-polarity-protector) — the
  one-diode answer: blocks the wrong way round instead of using it.
- **Compare:** [42-diode-rectifier](../42-diode-rectifier) — a simpler side-by-side
  view of forward- and reverse-biased diode paths.
- **Experiment:** delete `d3` and its two wires, then reverse the source again.
  One polarity still works, the other has lost its path — and now you know which
  pair was doing the work.
