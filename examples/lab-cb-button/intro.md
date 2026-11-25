# Common base: the emitter is the input

The third way to connect a transistor. Its base is held still by a divider and a capacitor, the signal goes into the emitter, and the output is taken from the collector. A button pulls the emitter down; a generator feeds a small tone into it.

**Teaches:** common-base stage, in-phase amplification, low input resistance

## What to do

Click **Sim** and wait a moment for the base capacitor to charge. Hold the **button**, then let go. Watch both scope channels: channel 1 is the emitter, channel 2 the collector.

## What you should see

- Pressing the button pulls the emitter down a little (about 2.04 V to 1.96 V); the collector falls too (about 7.2 V to 6.5 V) and the LED gets brighter: input and output move the same way.
- The generator's tone appears at the collector about nine times bigger, not upside down.

## Why it works

With the base held fixed, lowering the emitter raises the base–emitter voltage, so more current flows through the transistor — and through the collector resistor, whose voltage drop grows. The emitter's small change becomes a large change at the collector, in the same direction. The emitter is a low-resistance input, which is why this stage is used where a source must be loaded little, such as at radio frequencies.
