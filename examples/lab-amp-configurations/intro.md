# Common emitter, common collector, common base side by side

A transistor has three leads, and the one that is shared by input and output gives the circuit its name. The same small signal goes into all three versions here; the oscilloscope shows what each one makes of it.

**Teaches:** transistor amplifier configurations, voltage gain, phase, input resistance

## What to do

Click **Sim** and open the oscilloscope. Channel 1 is the signal from the generator. With the two slide switches choose what channel 2 shows: the common-emitter output, the common-base output or the common-collector output. Compare size and direction.

## What you should see

- Common emitter: much bigger, and upside down.
- Common collector: as big as the input and in step with it.
- Common base: bigger, and in step with the input.

## Why it works

In the common-emitter stage the input moves the base against the emitter, which the capacitor holds still; the collector current follows, and its drop across 4.7 kΩ is large and opposite. The emitter follower's emitter simply follows the base 0.6 V lower. In the common-base stage the base is held still and the signal pushes the emitter: the same kind of collector current change, but now in step with the input, and the generator has to supply that current itself.
