---
level: advanced
age: 14+
prereqs: [lab-wheatstone-bridge, lab-phase-shift]
teaches: [bridge, null-detector, junction-thermometer, temperature-coefficient, audio-amplifier]
---
## What you see
An audio amplifier chip wired as a tone generator, a bridge made of a trimmer, two resistors and two transistors, and an earphone across the middle of the bridge. Next to each transistor sits a small heating resistor with its own button.

## Try this
1. Click **Sim** and listen to the earphone: silence, although the tone generator is running. Put a scope probe on the amplifier's output to see the tone.
2. Hold the first heating button: it warms the transistor in the top row. After a moment the tone appears in the earphone.
3. Keep holding it and turn the trimmer slowly up, towards about 0.85. Find the spot where the earphone goes quiet again.
4. Now hold the second button as well; it warms the other transistor. The tone comes back. Where is the quiet spot now?

## What is going on
A transistor's base-emitter junction is a little thermometer: at the same current its voltage drops by a couple of millivolts for every degree it warms. The bridge compares two such junctions. As long as both are at the same temperature and get the same current, both ends of the earphone go up and down together with the tone, and the earphone hears nothing: the bridge is balanced. Warm one transistor and its end sags a little during every pulse of the tone, so the earphone gets a small square wave and you hear the tone. Turning the trimmer gives the warm transistor more current, which pushes its voltage back up: at the new quiet spot the current ratio exactly makes up for the temperature difference. Warm both and there is no difference left to hear. Your ear is the measuring instrument, and silence is the reading.

## Go further
- [lab-wheatstone-bridge](../lab-wheatstone-bridge) — the same balance with a meter and a battery.
- [lab-diff-pair](../lab-diff-pair) — another circuit that only cares about the difference between two transistors.
