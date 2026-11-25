# Clap on, clap off

Clap once and the lamp goes on, clap again and it goes off. A loudspeaker listens, the amplifier chip lifts the clap, and a flip-flop remembers whether the lamp should be on.

**Teaches:** microphone amplifier, pulse shaping, toggle flip-flop, relay

## What to do

Click **Sim**. In the instruments column push the **Sound** slider up to 120 for a moment and back to 0 (a clap). Wait a moment and clap again. Try 70 (talking) as well.

## What you should see

- First clap: the relay clicks in and the lamp lights.
- Second clap: off again.
- Talking: nothing.

## Why it works

A clap is a short burst of many vibrations. The diodes and capacitor turn the whole burst into one voltage pulse, so the transistor pulls the trigger line down only once per clap. Each such pulse flips the flip-flop, and its state drives the relay.
