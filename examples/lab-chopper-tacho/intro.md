# Optical tachometer: a slotted disc chops a light guide

A small solar panel turns a motor. On the motor's shaft sits a disc with four slots, and it turns between the ends of a light guide: an LED shines in at one end, a phototransistor looks out of the other. Every slot that passes lets one flash of light through. An amplifier chip makes each flash a click in the speaker, and a diode pump turns the clicks into a meter reading.

**Teaches:** optical speed sensing, pulses per revolution, frequency-to-voltage conversion with a diode pump

## What to do

Click **Sim**. Change the light on the solar panel and watch the motor's speed, listen to the clicks and read the meter.

## What you should see

- Full light: the motor runs at about 225 rad/s (36 turns per second) and the speaker buzzes at about 145 Hz: four clicks per turn.
- Less light: the motor slows, the buzz drops and the meter reads lower.

## Why it works

Each slot uncovers the light guide for a moment, so the phototransistor gives one pulse per slot. A coupling capacitor passes only the pulses into the LM386, which amplifies them into a speaker. From the same output a 100 nF capacitor and two diodes move one fixed charge per pulse into a resistor and a capacitor: the more pulses per second, the higher the voltage the meter shows. Bicycle speedometers, printer encoders and old mouse wheels count slots in the same way.
