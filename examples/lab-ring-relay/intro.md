# The telephone rings, the lamp switches on

A loudspeaker lying next to a telephone can hear it ring. Amplify what it hears, turn the bursts of sound into a steady voltage, and let that switch a relay: now a ringing phone switches on a lamp, which is how a "visual ringer" for a noisy workshop works.

**Teaches:** speaker as microphone, rectifying and smoothing, switching with a relay

## What to do

Click **Sim**. The phone is ringing: watch the relay and the lamp. In the instruments column, pull the **Sound** slider down to 0 (the bell stops), then try 80 (someone talking nearby), then back to 110.

## What you should see

- Ringing: the relay clicks in and the lamp lights, and stays lit while it rings.
- Silence: the lamp goes out within a fraction of a second.
- Talking: nothing happens. It takes a loud bell.

## Why it works

The speaker turns the bell into a few millivolts, the LM386 makes a volt or so of it. Two diodes and a capacitor turn each burst into a DC voltage that pushes current into the transistor's base. The transistor energises the relay, and the relay's contact, which has no electrical connection to the rest, switches the lamp.
