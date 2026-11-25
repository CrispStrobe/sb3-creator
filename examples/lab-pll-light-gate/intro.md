# Light barrier with a pulsed beam: the PLL oscillator raises the alarm

A light barrier that cannot be fooled by a torch: the beam flashes 2000 times a second and the receiver listens only to the flashes. Step into the beam and the oscillator of a PLL chip sounds the alarm.

**Teaches:** pulsed light links, diode pumps, the oscillator's inhibit input

## What to do

Click **Sim**. Move the knob of the light path (how much of the beam is blocked) to 1, wait a moment, then back to 0.

## What you should see

- Beam clear: silence.
- Beam blocked: an alarm tone of 500 Hz starts after a few milliseconds.
- Beam clear again: silence.

## Why it works

Each flash reaching the phototransistor passes the small capacitor, is amplified by the transistor, and pushes a little charge through the diode pump into a capacitor. The pulses keep that capacitor charged and its voltage holds the 4046's INHIBIT input high, which stops the oscillator. Block the beam and the capacitor runs down through its resistor; below half the supply the oscillator starts. Steady light, from a lamp or the sun, gives no pulses at all, so it cannot hold the alarm off.
