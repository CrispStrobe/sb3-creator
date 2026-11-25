# An oscillator that switches itself on and off

A Meissner oscillator on a ferrite rod makes a medium-wave carrier, and a crystal set half a metre away listens. The base of the transistor is fed by the coupling winding from a small reservoir capacitor that the bias pot charges. Two slide switches can turn the coupling winding round.

**Teaches:** phase condition of an oscillator, self-bias, squegging (self-interrupted oscillation)

## What to do

Click **Sim** and wait a few tens of milliseconds. Then turn the **bias pot** down to about 0.05 and listen to the earphone. Turn it back up to 0.3. Finally flip **both slide switches** over.

## What you should see

- At 0.3 the transmitter runs steadily (its tank swings about 9 V); the receiver gets a steady carrier and, after the click of the start, the earphone stays quiet.
- Turned low, the oscillation keeps starting and stopping — about nine hundred times a second. The earphone buzzes with a tone near 0.9 kHz: the carrier has been keyed by a tone.
- With the winding reversed nothing oscillates at all.

## Why it works

While it oscillates, the base–emitter junction rectifies the swing and charges the reservoir capacitor negative, which turns the transistor down. With plenty of bias current the capacitor is topped up as fast as it is drained and the oscillation settles at one size. With little bias current it is drained faster than it refills: the oscillation dies, the capacitor slowly recovers, and it starts again. Reversed, the coupling winding feeds back the opposite of what the tank is doing, so every start is cancelled.
