# A thyristor fired by a flash of light

A thyristor stays on once it has been switched on. Here two transistors make one, and the switch-on signal comes from light: shine a torch on the phototransistor for a moment and the LED stays lit.

**Teaches:** latching circuits, the thyristor, triggering by light

## What to do

Click **Sim**. Push the light slider of the phototransistor up to about 0.3 and back down to 0. Then slide the main switch off and on again.

## What you should see

- Dark at first, and a little light (0.05) does nothing.
- One flash: the LED comes on and stays on, even in the dark.
- Main switch off and on: the LED is dark again until the next flash.

## Why it works

The NPN transistor, once on, pulls current out of the PNP's base and switches it on; the PNP, once on, feeds the NPN's base and keeps it on. Each holds the other. The phototransistor only has to give the NPN a start. To switch the pair off, the current through it has to stop for a moment. Light-triggered thyristors switch large loads from a light signal without any electrical connection to the controller.
