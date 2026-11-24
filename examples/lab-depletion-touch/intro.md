# A transistor that is on until a charge comes near

Most transistors are off until you switch them on. This one, a depletion-mode MOSFET, conducts with nothing on its gate: the LED is lit from the start. Bring an electric charge near its gate and it goes out, without any contact.

**Teaches:** depletion-mode MOSFETs, an insulated gate moved by induced charge

## What to do

Click **Sim**: the LED is lit. Turn the knob on the field probe (a charged fingertip) up to bring it close to the gate, then back down. Now bring it close again, press the push button (your finger bridging gate and source) and release it, then take the charge away.

## What you should see

- Charge far away: the LED is lit (about 3.7 mA).
- Charge close: the LED goes out. Taken away: it lights again.
- Touched while the charge was close, then the charge taken away: the LED is brighter than before and stays so.

## Why it works

In a depletion MOSFET the channel between drain and source is built in, so current flows with the gate at the source's potential. A negative gate pushes the electrons out of the channel; past about −1.2 V it is pinched off. The gate is insulated: a negative charge nearby pulls it negative without any current flowing. Touching the gate while the charge is near lets the gate fill up to 0 V; when the charge then leaves, the gate is left positive, which opens the channel further.
