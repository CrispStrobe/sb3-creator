# Microphone amplifier: a transistor preamp in front of the amp chip

A loudspeaker also works backwards, as a microphone, but it makes only a fraction of a millivolt. One transistor raises that about a hundredfold; a volume knob then sets how much of it the amplifier chip passes on to the earphone.

**Teaches:** a preamplifier stage, collector-feedback bias, a volume control between stages

## What to do

Click **Sim**. In the instruments column, the **Voice** slider sets how loudly you speak into the loudspeaker. Turn the volume pot down and up. Put the scope on the transistor's collector and on the amplifier's output.

## What you should see

- The transistor's collector rests near 4.8 V and wobbles by tens of millivolts while you speak.
- The amplifier output swings about 1.6 V from peak to peak at full volume, less as you turn the pot down.
- Voice slider at 0: almost nothing.

## Why it works

The transistor amplifies small changes at its base into larger changes of collector current; the 4.7 kΩ load turns them into voltage. Its base gets its bias through 470 kΩ from its own collector, so the stage finds its working point by itself, whatever the transistor's gain. The pot is a voltage divider: it passes on a share of the preamp's signal, and the amp chip multiplies that by twenty and drives the earphone.
