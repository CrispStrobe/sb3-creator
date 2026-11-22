---
level: advanced
age: 14+
prereqs: [lab-ce-vs-follower]
teaches: [push-pull, crossover-distortion, class-ab, bias]
---
## What you see
A sine wave and two push-pull output stages, each with an NPN pushing up and a PNP pulling down. One stage has two little diodes between the bases, the other does not.

## Try this
1. Click **Sim** and put scope probes on the input and on both loads.
2. Compare the two outputs near the zero crossings of the sine.
3. On the stage without diodes, find the flat part. How wide is it, in volts?

## What is going on
An NPN emitter follower only works while its base is about 0.7 V above the output; the PNP only while its base is 0.7 V below. Wire both bases to the same signal and around zero neither conducts — the output sticks at 0 V and the sine gets a step at every crossing (crossover distortion; you would hear it as a harsh buzz). The two diodes hold the bases about 1.4 V apart, so each transistor is already just on when the other hands over. That is class AB: a little idle current buys a clean signal.

## Go further
- [lab-ce-vs-follower](../lab-ce-vs-follower) — one emitter follower.
