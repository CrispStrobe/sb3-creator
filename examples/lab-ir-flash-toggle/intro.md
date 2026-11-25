# Infrared remote switch

Press the button on the handset and the lamp across the room goes on; press again and it goes off. The receiver turns each flash of infrared into exactly one switching step.

**Teaches:** IR link, monoflop, toggle flip-flop

## What to do

Click **Sim**. Press the button (send) briefly, wait a moment, press it again. Try it from further away with the light path's **knob**.

## What you should see

- Each press toggles the red LED (the lamp).
- The receiver's amplifier output stays high for a short moment after each press.

## Why it works

The phototransistor lifts the amplifier's + input above its − input, the output jumps high and a capacitor feeds the jump back, so it stays high for a fixed time even after the light is gone. When it falls back, the falling edge flips the flip-flop, so each press counts once.
