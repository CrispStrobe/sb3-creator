# Amplifier chip as a blinker

An audio power amplifier does not have to amplify music. Give it feedback to both inputs and it becomes a blinker that flips its output between nearly 0 V and nearly 9 V by itself.

**Teaches:** relaxation oscillator, positive feedback, alternating LEDs

## What to do

Click **Sim** and watch the red and green LEDs. Then close the **switch** to connect the loudspeaker and listen.

## What you should see

- Red and green take turns, about six times a second.
- With the switch closed, the speaker clicks at every change.

## Why it works

The + input gets a threshold that depends on the output: high output, high threshold; low output, low threshold. The capacitor on the − input slowly follows the output. When it crosses the threshold the amplifier flips, the threshold jumps the other way, and the capacitor has to travel back. The capacitor towards the speaker only lets the jumps through: clicks.
