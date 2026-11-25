# Ticking double blinker

A turn signal ticks while it blinks, so the driver hears that it is on. Here the LM386 blinker drives a speaker as well as its two LEDs: through a capacitor, so each change of the output is a short tick, and in between the speaker is silent.

**Teaches:** relaxation oscillator, coupling capacitor passes changes only, a click per edge

## What to do

Click **Sim**, watch the LEDs and listen to the speaker.

## What you should see

- Red and green take turns, about 1.6 times a second.
- A tick from the speaker at every change, one for each LED.

## Why it works

The amplifier's output jumps between about 0.9 V and 8.1 V. The capacitor in front of the speaker passes the jump, which pushes the speaker cone once, and then charges up, so the current through the speaker dies away within a few milliseconds. A steady voltage cannot pass a capacitor: between the jumps the speaker is quiet.
