---
level: beginner
age: 10+
prereqs: [pc47-555-monostable]
teaches: [monostable, 555-timer, pulse-stretching, game]
---
## What you see
The classic nerve test: guide a metal loop along a bent wire without touching it. Here the wire and loop are the WIRE button. Every touch sounds the buzzer and lights the red LED for about one second. While nothing touches, the green LED says "ready".

## Try this
1. Start the simulation. Green is on.
2. Tap the WIRE button as briefly as you can. The buzzer still sounds for a full second.
3. Tap it again while the alarm is still sounding, and watch when it stops. Explain what you see with the capacitor.
4. Count your touches for one run. Fewer is better.

## What is going on
A brush of the loop against the wire lasts only a few milliseconds, far too short to hear. The 555 in monostable mode catches that short dip on its TRIGGER pin and holds its output high while the capacitor charges through the 100 kΩ resistor. When the capacitor reaches two thirds of the supply, the chip ends the pulse and empties the capacitor. So the alarm always lasts 1.1 × R × C, about 1.1 s, no matter how short the touch was.

## Go further
- [pc47-555-monostable](../pc47-555-monostable): the same one-shot with an LED.
- [lab-555-inside](../lab-555-inside): the thresholds inside the 555.
