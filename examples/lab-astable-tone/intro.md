---
level: beginner
age: 10+
prereqs: [lab-astable-blinker]
teaches: [astable, frequency, sound, morse]
---
## What you see
Two transistors, a key, a yellow LED and a small piezo earpiece. Two slide switches pick small or large coupling capacitors.

## Try this
1. Click **Sim**. Silence: the key is not pressed.
2. Hold the key. You hear a high tone, and the LED seems to be on all the time.
3. Tap the key in short and long bursts: Morse code.
4. Flip both slide switches to the big electrolytics and hold the key. Now the LED blinks and the earpiece clicks about three times a second.

## What is going on
An earpiece only makes a sound when the current through it changes; a steady current is silent. The two transistors switch each other on and off over and over. With small 10 nF capacitors this happens about 1500 times a second, and the clicks merge into a tone. With 4.7 µF capacitors it is almost 500 times slower, so you hear separate clicks, like a metronome. The pitch depends on resistance times capacitance: bigger values, lower tone.

## Go further
- [lab-astable-blinker](../lab-astable-blinker) — the same circuit, slow enough to watch.
- [pc67-555-tongenerator](../pc67-555-tongenerator) — a tone from a timer chip.
