# Exposure timer: brighter light, shorter time

A darkroom timer should not run for a fixed time; it should deliver a fixed amount of light. Here a phototransistor charges the timing capacitor of a 555 monostable. In bright light it charges fast and the lamp switches off early; in dim light it takes longer. Light times time stays roughly the same.

**Teaches:** sensor-controlled timing, inverse proportion, the idea of a dose

## What to do

Click **Sim**, press the Start button and time how long the white lamp LED stays on. Move the phototransistor's light slider to full and press again, then to one tenth and press again.

## What you should see

- Full light: about a quarter of a second.
- Half light: about half a second.
- One tenth: about 2.4 seconds.
- Multiply light by time: always about 0.25.

## Why it works

A phototransistor passes a current proportional to the light. A constant current charges a capacitor at a constant rate, so the time to reach the 555's threshold is inversely proportional to the light. The 1 MΩ resistor ends the exposure after about 24 seconds even in total darkness.
