# The PLL chip as a voltage-controlled oscillator

A phase-locked loop chip contains an oscillator whose pitch you set with a voltage. Here it is used alone: a potentiometer gives the voltage and a transistor drives the speaker.

**Teaches:** the voltage-controlled oscillator, the 4046 PLL chip

## What to do

Click **Sim** and listen. Turn the potentiometer slowly from one end to the other. Hover over the PLL chip to see its frequency.

## What you should see

- At the bottom end a low hum of about 110 Hz.
- At the top end about 1.2 kHz.
- In between the pitch rises evenly with the voltage, about 118 Hz per volt.

## Why it works

Inside the chip a current charges the capacitor C1 until it reaches half the supply, then the capacitor is turned round and charged the other way, and the output flips each time. The control voltage on VCO_IN sets that current through R1: more voltage, more current, faster charging, higher pitch. The resistor R2 adds a fixed current, so even at 0 V the oscillator still runs at its lowest note.
