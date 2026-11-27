# An oscillator that switches itself on and off

A Meissner oscillator on a ferrite rod makes a medium-wave carrier, and a crystal set half a metre away listens. A small detector at the transmitter feeds an LM393 comparator. The potentiometer sets its cutoff threshold. Two slide switches reverse the feedback winding.

**Teaches:** oscillator feedback, envelope detection, hysteresis, self-quenching

## What to do

Click **Sim** and wait a few tens of milliseconds. Then turn the **cutoff threshold** down to about 0.05 and listen to the earphone. Turn it back up to 0.3. Finally flip **both slide switches** over.

## What you should see

- At 0.3 the transmitter runs steadily (its tank swings about 9 V); the receiver gets a steady carrier and, after the click of the start, the earphone stays quiet.
- Turned low, the oscillation keeps starting and stopping — about a thousand times a second. The earphone buzzes with a tone near 1 kHz: the carrier has been keyed by a tone.
- With the winding reversed nothing oscillates at all.

## Why it works

At the lower threshold, the transmitter’s own RF charges the detector capacitor until the LM393 pulls the transistor bias low. With the carrier gone, the capacitor discharges and the comparator releases the bias. That starts the next burst. At the higher threshold, the comparator stays open and the oscillator runs steadily. Reversing the winding removes positive feedback, so the carrier cannot start.
