# Direct conversion: how steady is an oscillator?

A small transmitter on a ferrite rod sends an unmodulated carrier. The receiver is a mixer chip with its own oscillator tuned close to it: the difference between the two comes straight out as a whistle. Every tiny change of either oscillator is heard as a change of pitch — a good way to find out how steady an oscillator really is.

**Teaches:** direct-conversion reception, zero beat, oscillator stability (supply, tuning)

## What to do

Click **Sim** and listen. Turn the transmitter's tuning knob a tiny bit (0.302). Then move the **SUPPLY** switch from 9 V to 6 V.

## What you should see

- A whistle of almost 4 kHz.
- At 0.302 a much lower whistle, about 1.2 kHz: the transmitter has moved towards the receiver.
- On 6 V the whistle jumps up by more than 1 kHz: the transmitter's frequency depends on its supply.

## Why it works

The mixer multiplies the transmitter's carrier by its own oscillator; the difference frequency, a few kilohertz, goes to the amplifier. A change of 1 kHz is only one part in 800 of the carrier, but it is the whole pitch of the whistle. A transistor's internal capacitances change with its current, so a sagging battery, a warm transistor or a hand near the tuning capacitor all pull an oscillator — which is why good transmitters use regulated supplies and buffer stages.
