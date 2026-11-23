# Level crossing: latch plus flasher

A model-railway level crossing from two familiar blocks. A contact before the crossing sets a memory, a contact after it clears the memory, and while the memory is set it lets a flasher run that alternates two red lamps. Nothing here is programmed.

**Teaches:** combining a latch with an oscillator, event-driven circuits, power-on reset

## What to do

Click **Sim**. Both lamps are dark. Give contact A a magnet (switch it on and off again): the lamps start to alternate. Do it again: nothing changes. Now give contact B a magnet: the lamps stop.

## What you should see

- Contact A: alternating red lamps, about 1.4 flashes per second.
- Contact A again: no change.
- Contact B: both lamps off.

## Why it works

Two cross-coupled NAND gates remember which contact was closed last. Their output holds the 555's reset pin: high lets it run, low stops it. The capacitor on the reset input makes sure the crossing starts quiet when the power comes on.
