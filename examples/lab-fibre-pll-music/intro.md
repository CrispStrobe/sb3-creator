# Music down a light guide, frequency-coded, back out of a PLL

Instead of making an LED brighter and darker with the music, this link changes how often the LED flashes: about 80,000 times a second, a little faster or slower with the music. At the far end a phase-locked loop (PLL) follows the flash rate, and the voltage it needs to follow it is the music again, for an amplifier chip and an earphone.

**Teaches:** frequency modulation, a voltage-controlled transistor astable, PLL demodulation

## What to do

Click **Sim**. Turn the music generator's amplitude down to 0 and back up, and move the pot that sets the centre frequency.

## What you should see

- The PLL's oscillator runs near the transmitter's rate, 70–90 kHz.
- With music, the PLL's demodulator output (pin 10) swings with the music; without music it stays still.

## Why it works

The op-amp adds the music to a steady voltage from the pot, and that voltage feeds the base resistors of a two-transistor astable: a higher voltage charges its capacitors faster, so it flashes faster. The phototransistor at the end of the fibre turns the flashes back into pulses. The 4046's phase comparator compares them with its own oscillator and nudges the control voltage until both run in step. To follow the music's changes of rate, the control voltage has to move with the music, and the chip copies it to its demodulator output. Because only the RATE carries the music, a dimmer light (a longer fibre, a dusty joint) does not make it quieter.
