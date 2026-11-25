# Automatic headlight dipping

Drive with high beam and the car switches to dipped beam by itself the moment an oncoming car's headlights hit the sensor.

**Teaches:** flip-flop, set and reset, phototransistor

## What to do

Click **Sim**. Press the button (high beam). Move the phototransistor's **light** slider to 0.1, then to 0.3, then back to 0.

## What you should see

- High beam (blue) stays on after you let go of the button.
- A little light changes nothing; the oncoming car's light switches to dipped (green), and it stays dipped.

## Why it works

Two cross-coupled transistors remember which one is on. The button pulls the dipped side's base down, so the high-beam side takes over. The phototransistor sits on the high-beam side's base: enough light makes it pass more current than that base receives, the high-beam transistor goes off and the dipped side takes over.
