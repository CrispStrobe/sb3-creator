# Slow pedestrian light with an amplifier

A pedestrian light shows red until someone presses the button, then green for a while, then red again. Here an LM386 amplifier does the timing: once its output jumps up, a capacitor feeds that jump back to its own input and holds it there until the capacitor has drained. The pot sets how long green lasts.

**Teaches:** a one-shot (monostable), RC timing, two LEDs on one output

## What to do

Click **Sim**. Press the button once and count how long green stays on. Turn the pot and press again.

## What you should see

- At rest: red.
- After a press: green for about 1.4 seconds with the pot at its short end, longer as you turn it up (up to about 6 seconds).
- Then red again, until the next press.

## Why it works

The amplifier compares its plus input with a fixed voltage on its minus input. The button lifts the plus input, the output jumps high, and the capacitor between output and plus input keeps the plus input up even after you let go. The capacitor then discharges through the pot; when the plus input falls below the minus input the output drops back. More resistance means a slower discharge and a longer green.
