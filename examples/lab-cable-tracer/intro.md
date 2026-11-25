# Cable tracer: a coil hears magnetic fields

A coil of wire in front of an amplifier hears every alternating magnetic field nearby: the 50 Hz of a cable that carries a current, and the stray field of a telephone's coil. This is how cable finders and telephone pickup coils work.

**Teaches:** induction by alternating currents, current (not voltage) makes the magnetic field, how fast a field falls off with distance

## What to do

Click **Sim**. Each field source has a small dial (its distance to the pickup coil, in cm). Turn the cable's dial towards the coil, then flip the slide switch to turn the lamp off and on. Then bring the telephone coil close. The pot in front of the amplifier is the volume.

## What you should see

- Both sources far away: almost silence.
- The cable close by with the lamp on: a deep 50 Hz hum. Lamp off: the hum is gone, although the cable is still connected.
- The telephone coil close by: its 800 Hz tone. Further away it fades quickly.

## Why it works

A current makes a magnetic field around its wire, and an alternating current makes an alternating one. A coil in a changing field gets a voltage of its own (induction), a few hundred microvolts here, which the transistor and the amplifier IC make audible. Only a current makes this field, so a cable without a load stays silent. In a two-core cable the outgoing and the returning current flow side by side, and their fields almost cancel. That is why you hear the cable only when you are close to it.
