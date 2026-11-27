# An oscillator that switches itself on and off

A Meissner oscillator on a ferrite rod makes a medium-wave carrier, and a crystal set 22 cm away listens. The transistor sets its own operating point: the harder it oscillates, the more its base rectifies, and the charge that leaves on the base reservoir turns it down again. A slide switch puts a big capacitor across the emitter resistor; two more switches can turn the coupling winding round.

**Teaches:** phase condition of an oscillator, self-bias, squegging (self-interrupted oscillation)

## What to do

Click **Sim** and wait a few tens of milliseconds. Then switch on the **big bypass** and listen to the earphone. Switch it off again. Finally flip **both coupling switches** over.

## What you should see

- Big bypass off: the transmitter runs steadily (its tank swings about 8.5 V); the receiver gets a steady carrier and the earphone stays quiet.
- Big bypass on: the oscillation keeps starting and stopping, about a thousand times a second. The earphone buzzes with a tone near 1 kHz: the carrier has been keyed by a tone.
- With the winding reversed nothing oscillates at all.

## Why it works

While it oscillates, the transistor rectifies its own drive, and the base current charges the reservoir capacitor at the base negative, which turns the transistor down. The reservoir is fed back up only slowly, through 0.7 MΩ. With the small emitter capacitor the 1 kΩ emitter resistor keeps the stage's gain at the carrier moderate: each start overshoots a little, and the swing and the bias settle together at one size. With the big one the full gain is there. Every start overshoots so hard that the rectified current drives the reservoir far past cut-off, and the oscillation dies. Only when the reservoir has recharged, about a millisecond later, does it start again. Reversed, the coupling winding feeds back the opposite of what the tank is doing, so every start is cancelled.
