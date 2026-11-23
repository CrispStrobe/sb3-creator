---
level: advanced
age: 13+
prereqs: [lab-opamp-gain, pc02-voltage-divider]
teaches: [attenuator, voltage-divider, gain, clipping, headroom, audio]
---
## What you see
A tone generator that is far too loud for its amplifier, a divider that turns it down a thousand times, and an amplifier whose gain you choose. The speaker either plays a clean tone or a harsh, clipped buzz, depending on how you set things up.

## Try this
1. Start the simulation and look at the output on the scope: a small, clean sine, about 0.4 V peak.
2. Slide GAIN to the 100 Ω side. Ten times the gain on paper: about 3.6 V peak (the op-amp runs short of bandwidth at this gain), still clean, much louder.
3. Slide GAIN back and close BYPASS. Now the full signal, a few volts, hits an amplifier with gain 101. The output slams into its limits and the sine becomes a flat-topped block.
4. Work out the divider ratio and both gains from the resistor values before you look.

## What is going on
The divider passes 220 Ω / 220.2 kΩ, about one thousandth of the signal. The amplifier then multiplies by 1 + R_f / R_g. If the product stays inside what the supply can deliver, the output is a faithful, bigger copy. If it does not, the op-amp simply stops at its limit, and the missing tops and bottoms are heard as distortion. Every audio chain, from a microphone preamp to a guitar amp, is a game of attenuating and amplifying so that the signal never runs out of headroom.

## Go further
- [lab-opamp-gain](../lab-opamp-gain): the non-inverting amplifier with a steady input.
- [pc02-voltage-divider](../pc02-voltage-divider): the divider on its own.
