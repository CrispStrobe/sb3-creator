# A mains lamp hums at 100 Hz, a torch is silent

Hold a light guide near a lamp that runs on mains electricity and listen to the light: it hums. A battery torch, just as bright, stays silent. The difference is flicker you cannot see.

**Teaches:** mains frequency, flicker, coupling capacitors

## What to do

Click **Sim** and listen. Then move the slide switch from mains to torch.

## What you should see

- Mains: a deep hum at 100 Hz.
- Torch: silence, although the lamp is lit.

## Why it works

Mains electricity reverses 50 times a second, so the current through a lamp drops to zero 100 times a second and its light dips each time. The phototransistor turns these dips into a current that rises and falls 100 times a second, and the transistor and the LM386 make that audible. The torch's light is steady, and the capacitors between the stages only pass changes, so nothing reaches the speaker.
