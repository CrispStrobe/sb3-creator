# Electronic points: a mixer that steers a current

A mixer chip has two inputs and two outputs. Its current goes to one output or the other depending on the *product* of the two input signals: plus times plus and minus times minus send it one way, plus times minus the other. Here a blinking amplifier drives one input and a button the other, and a lamp on each output shows where the current goes.

**Teaches:** double-balanced mixer, multiplying signs, switching

## What to do

Click **Sim** and watch the red and green lamps for a few blinks. Then hold the **STEER** button down and watch again.

## What you should see

- The two lamps blink alternately: when one is lit the other is dark.
- With the button held, they keep blinking, but each one now lights in the other half of the blink.

## Why it works

Inside the chip, one transistor pair splits its current according to input A; a cross-connected quad of transistors, switched by the other input, decides which output each half goes to. So the output depends on A *times* B. Flip either input and the output flips. Exactly this switching action, done a million times a second, is what mixes two radio signals.
