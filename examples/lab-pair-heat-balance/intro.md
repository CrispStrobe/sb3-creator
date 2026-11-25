# Heat one transistor of a pair

**Teaches:** differential pair, temperature drift, compensation

## What to do

Click **Sim**: both LEDs glow equally. Move the first transistor's **Temperature** slider (npn_5) to hot and wait a few seconds. Then move the second one's (npn_6) to hot as well. Then put the first back to room.

## What you should see

- First hot: the red LED brightens, the green one almost goes out.
- Both hot: they are equal again.
- Only the second hot: green bright, red almost out.

## Why it works

The two transistors share one emitter resistor, so the current through it is split between them. The warmer one needs less base-emitter voltage and grabs the bigger share. If both warm up together, neither gains an advantage and the split stays the same: the pair ignores a change that affects both sides alike.
