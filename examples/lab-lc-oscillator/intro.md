# Coil and capacitor that keep swinging: an LC oscillator

Left alone, a coil and a capacitor ring for a while and then fall silent, because every swing loses a little energy. Add a transistor that pushes at the right moment of each swing, and the ringing never stops. That is an oscillator.

**Teaches:** resonance, positive feedback, how an oscillator replaces its losses

## What to do

Click **Sim** and open the scope. Watch the collector (channel 1) and the emitter (channel 2). Then change one of the two capacitors and listen to the pitch.

## What you should see

- A sine of about 1.67 kHz that keeps its size.
- The emitter swings in step with the collector, but much less.
- Bigger capacitors give a lower tone.

## Why it works

The coil and the two capacitors form a resonant circuit. The capacitors also act as a divider: a small part of the collector swing reaches the emitter. With the base held still, the transistor amplifies that and feeds it straight back into the coil, in step with the swing. Each cycle gets back what it lost, so the amplitude holds. See lab-lc-ringing for the same coil and capacitor without the transistor.
