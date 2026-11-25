---
level: intermediate
age: 14+
prereqs: [lab-ce-vs-follower]
teaches: [common-emitter, inversion, cascade, analog-dimmer]
---
## What you see
A knob and two transistor stages in a row. Each stage has an LED hanging from its collector to ground: yellow after the first stage, green after the second. An LED like this lights more the higher its stage's output voltage is.

## Try this
1. Click **Sim**. With the knob in the middle both LEDs glow at medium brightness.
2. Turn the knob slowly up. Which LED gets dimmer, which one brighter?
3. Turn it all the way down and all the way up. Is there a position where both are bright?
4. Put a voltmeter on the first collector and turn the knob. Does the voltage go up or down?

## What is going on
When the first transistor gets more base current, it pulls more current through its 1 kΩ collector resistor, so its collector voltage drops and the yellow LED gets less. That is the inverting stage: input up, output down. The second stage takes that falling voltage as its input and turns it upside down once more, so the green LED does the same as the knob. Inverting twice is not inverting at all. Because the base resistors are large, the transistors never jump: the lamps fade smoothly, like a dimmer.

## Go further
- [lab-two-followers](../lab-two-followers) — two stages in a row that do not invert.
- [lab-ce-vs-follower](../lab-ce-vs-follower) — one inverting stage measured with voltmeters.
