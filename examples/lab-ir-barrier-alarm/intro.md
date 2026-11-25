# Infrared light barrier

An invisible beam across a doorway. Walk through it and an alarm sounds — or, flipped round, a tone tells you the beam is still there.

**Teaches:** IR light barrier, phototransistor, gating an oscillator, inverting

## What to do

Click **Sim**. Turn the light path's **knob** to 1 (hand in the beam) and back to 0. Then move the **slide switch** to the right and repeat.

## What you should see

- Left: silence until the beam is blocked, then the alarm.
- Right: a tone while the beam is clear, silence when it is blocked.

## Why it works

The phototransistor passes current only while IR light reaches it. That current keeps a transistor switched on, which holds the tone generator off. Block the light and the generator is free. The inverter transistor on the right turns the logic round.
