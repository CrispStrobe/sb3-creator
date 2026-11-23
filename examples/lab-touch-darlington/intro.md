---
level: intermediate
age: 12+
prereqs: [38-npn-switch, 44-darlington-motor]
teaches: [darlington, current-gain, touch-switch, high-resistance-sensing]
---
## What you see
One button stands for two metal plates you bridge with a fingertip. Your skin is a resistance of a few megohms, so only a few microamps can get through. Two channels receive exactly that current: on the left a single transistor with a red LED, on the right two transistors in Darlington connection with a green LED.

## Try this
1. Click **Sim**: both LEDs are dark.
2. Press the touch button. The green LED switches fully on, the red one only glimmers.
3. Raise both finger resistors to 10 MΩ (a dry finger). Which channel still reacts?
4. Lower them to 220 kΩ (a wet finger): now the single transistor manages too.

## What is going on
A transistor passes a collector current about a hundred times its base current. In the Darlington pair the first transistor's emitter current becomes the second one's base current, so the gains multiply: a hundred times a hundred. Microamps become milliamps. The price is a higher voltage across the switched pair, because the second base-emitter junction sits on top of the first transistor's own drop.

## Go further
- [lab-touch-off](../lab-touch-off) — the same pair used the other way round: touching switches a lamp off.
- [44-darlington-motor](../44-darlington-motor) — a Darlington driving a heavier load.
