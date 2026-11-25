---
level: advanced
age: 14+
prereqs: [lab-ce-vs-follower]
teaches: [common-emitter, common-collector, common-base, gain, phase]
---
## What you see
One signal and three transistor amplifiers that differ only in which lead the input and the output share: emitter, collector or base.

## What to do
1. Click **Sim** and wait a moment while the capacitors charge.
2. On the first scope compare the input with the emitter follower: the same size, the same way up.
3. On the second scope compare the two collectors: both about 4.6 times bigger, but one is upside down.

## What is going on
In the common-emitter stage a rising base voltage pulls more current through the collector resistor, so the collector falls: gain and inversion. The emitter follower's emitter simply follows its base, one junction drop lower. In the common-base stage the base is held still and the signal pushes the emitter instead: lowering the emitter raises the current, the collector falls with it, but the input fell too, so the output comes out the right way up. Its input is the emitter, which takes a lot of current: a low input resistance, useful at radio frequencies.

## Go further
- [lab-ce-vs-follower](../lab-ce-vs-follower) — the first two side by side with a pot.
- [lab-amp-classes](../lab-amp-classes) — class A and class C stages.
