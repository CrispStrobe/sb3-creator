# Reflex radio: one transistor, used twice

The reflex trick was a way to get two transistors' worth of work from one. The transistor first amplifies the weak carrier from the antenna; a diode then recovers the sound; and the sound is sent back into the same transistor, which amplifies it a second time for the earphone.

**Teaches:** RF and audio amplification in one stage, chokes and bypass capacitors, frequency separation

## What to do

Click **Sim** and listen. Then turn the tuning knob to about 0.26 for the second station.

## What you should see

- A loud 400 Hz tone from the local station, even though this bench uses a short antenna wire.
- At about 0.26: 600 Hz and 900 Hz taking turns.
- Near the bottom of the knob the far station does not come in cleanly: a stronger station bleeds through. One tuned circuit is not enough when the gain is this high.

## Why it works

The same transistor sees two very different frequencies at once, and the circuit around it treats them differently. For the carrier, hundreds of kilohertz, the choke in the collector is a large impedance, so the carrier is amplified, and a small 1 nF capacitor hands it to the diode. For the sound, a few hundred hertz, the choke is almost a wire, the large emitter capacitor removes the emitter resistor's braking effect, and the earphone is the load. The diode's output goes back to the base through 100 nF, so the transistor amplifies the sound as well. Two passes, one transistor.
