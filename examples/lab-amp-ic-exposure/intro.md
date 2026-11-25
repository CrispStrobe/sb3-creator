# Exposure timer: light sets the time

A camera or an enlarger needs a shorter exposure in bright light and a longer one in dim light. This timer does that on its own: a phototransistor drains the timing capacitor of an LM386 one-shot, and the brighter the light, the faster it drains.

**Teaches:** a one-shot (monostable), a phototransistor as a light-controlled current, an exposure timer

## What to do

Click **Sim**. Set the phototransistor's light slider, press the button and time the green LED. Try dim and bright light.

## What you should see

- Red while ready, green during the exposure.
- Light at 0.2: green for about 1 second. Light at 0.6: about 0.4 seconds. Full light: about a quarter of a second.
- In the dark it takes several seconds.

## Why it works

The button lifts the amplifier's plus input, its output jumps high, and the capacitor from the output holds the plus input up. The phototransistor then pulls charge out of the capacitor; when the plus input has fallen below the fixed voltage on the minus input, the output drops back to red. A phototransistor passes more current the more light it gets, so bright light ends the exposure sooner.
