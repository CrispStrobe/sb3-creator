---
level: advanced
age: 14+
prereqs: [lab-ce-vs-follower, lab-push-pull]
teaches: [class-a, class-c, conduction-angle, bias]
---
## What you see
One sine-wave signal and two transistor stages. The left one is biased so that it always conducts (class A); the right one gets no bias at all (class C) and has a red LED in its collector.

## What to do
1. Click **Sim**. The class C stage's red LED flickers: it only gets current on the tops of the signal.
2. Turn the **LEVEL** pot down. The class C stage conducts for shorter and shorter moments and then stops, and its LED stays dark; the class A stage keeps conducting all the time, with a smaller swing.

## What is going on
A transistor only conducts once its base is about 0.7 V above its emitter. Class A puts the base there permanently with a bias divider, so the signal only wiggles the current around a resting value: faithful, but the transistor always draws current. Class C gives no bias, so only the tops of the signal get past 0.7 V. That wastes little power but distorts heavily: fine for radio transmitters with a tuned circuit, useless for music. Class B and AB, with two transistors taking half the cycle each, are in lab-push-pull.

## Go further
- [lab-push-pull](../lab-push-pull) — class B and class AB pairs.
- [lab-ce-vs-follower](../lab-ce-vs-follower) — gain of a biased stage.
