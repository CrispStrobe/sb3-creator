---
level: advanced
age: 14+
prereqs: [lab-crystal-set]
teaches: [radio, level-indicator, diode-pump, comparator]
---
## What you see
A crystal set (antenna, coil, tuning capacitor, germanium diode, earphone) whose audio goes on to an op-amp amplifier, a diode pump, a meter and a three-LED ladder: green, yellow, red.

## Try this
1. Click **Sim**. The radio is tuned to the strong local station: within a moment the meter rises, green and yellow light up and red flickers on the loud bits.
2. Turn the tuning knob slowly away from the station. The level drops and the LEDs go out one after another.
3. Look for the other stations on the dial and compare how high the ladder climbs.

## What is going on
The crystal set's detector leaves a small audio voltage. The op-amp multiplies it by about eleven. Two diodes and two capacitors form a pump: every audio cycle pushes a little charge into the level capacitor, while a resistor lets it drain slowly, so the level follows how loud the audio is. The meter shows the level as a needle; the LED ladder shows it in three steps. Each step is an op-amp used as a comparator, watching the level against its own tap of a resistor ladder: the higher the level, the more of them switch on.

## Go further
- [lab-crystal-set](../lab-crystal-set) — the receiver on its own.
- [lab-sound-meter](../lab-sound-meter) — a meter for sound picked up by a microphone.
