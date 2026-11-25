# Clap switch with a transistor Schmitt trigger

A loudspeaker is the microphone and an LM386 amplifies the clap. Two transistors sharing one emitter resistor form a Schmitt trigger, a switch with a memory: one clap lights the red LED and it stays on until you press RESET. A knob sets how loud the clap must be.

**Teaches:** loudspeaker as microphone, emitter-coupled Schmitt trigger, hysteresis as memory, threshold and sensitivity

## What to do

Click **Sim** and wait a moment. In the instruments column push the **Sound** slider at the loudspeaker to 120 for a moment and back to 0 (a loud clap). Press RESET. Try 80 (talking). Then try a quieter clap (about 110) with the THRESHOLD pot at the middle and turned further up.

## What you should see

- Talking: nothing. A loud clap: the LED lights and stays on.
- RESET puts it out.
- Turned up, the THRESHOLD pot lets a quieter clap switch it.

## Why it works

Whichever transistor conducts carries the shared emitter current, and that current lifts the emitters: Q1 has to get its base above about 3.9 V to take the current over, but once it has it, it only lets go below about 3.0 V. The knob holds Q1's base between those two voltages, so the circuit stays in whatever state it is in. The amplified clap kicks the base above the upper point; a diode lets only the upward kicks through. RESET pulls the base below the lower point.
