---
level: intermediate
age: 12+
prereqs: [pc88-lichtorgel, pc50-two-stage-rc]
teaches: [high-pass, low-pass, cutoff-frequency, filters]
---
## What you see
One signal, two LEDs: red for the bass, blue for the treble. Which one lights depends on how fast the signal swings.

## Try this
1. Click **Sim**. At 50 Hz the red LED glows.
2. Raise the frequency of the function generator step by step: 100 Hz, 300 Hz, 1000 Hz, 3000 Hz.
3. Where does red fade? Where does blue come up?
4. Put scope probes on the two filter outputs and compare their sizes.

## What is going on
A capacitor lets fast changes through and blocks slow ones. In the treble path the signal has to pass through a capacitor, so only high notes get to the transistor. In the bass path a capacitor shorts the signal to ground — high notes are swallowed, low ones remain. Each filtered signal drives its own transistor and LED. With music instead of a sine, drums flash red and cymbals flash blue.

## Go further
- [pc88-lichtorgel](../pc88-lichtorgel) — a light organ that reacts to loudness only.
- [pc50-two-stage-rc](../pc50-two-stage-rc) — RC filters measured.
