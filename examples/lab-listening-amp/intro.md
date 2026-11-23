# Listening amplifier: millivolts made audible

A loudspeaker works backwards: speak into it and it produces a few millivolts. That is far too little to hear, so this circuit amplifies it about a hundred times. A knob sets the sensitivity, as on a baby monitor. In the simulator a small 1 kHz source plays the part of the speaker.

**Teaches:** transducers work both ways, voltage gain, a volume control as a divider, biasing an amplifier at half supply

## What to do

Click **Sim** and wait half a second for the amplifier to settle. Listen to the piezo earpiece and look at the output on the scope. Turn the sensitivity knob down and up.

## What you should see

- The quiet input becomes a clearly audible tone.
- Knob at half way: about 1 V peak-to-peak at the output.
- Knob full: about twice that; knob down: almost nothing.

## Why it works

The op-amp multiplies the signal by 1 + 100 kΩ / 1 kΩ = 101. The capacitors let the audio through but block DC, so the amplifier can sit at half the supply and swing up and down from there. The knob divides the input before the amplifier, exactly like a volume control.
