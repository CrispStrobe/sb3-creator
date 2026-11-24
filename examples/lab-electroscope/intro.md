# Electronic electroscope: how much charge, and which sign

A rubbed ruler bends a thin stream of water: it pulls opposite charge into the near side of the stream. This circuit measures that same induced charge with a MOSFET and shows its sign: the LED gets brighter for one kind of charge and dimmer for the other.

**Teaches:** electrostatic induction, positive and negative charge, an electrometer

## What to do

Click **Sim**. Press and release the **set** button: the gate is preset and the LED glows at about half brightness. Then turn the probe's knob up (the ruler approaches) and back down. In the probe's settings, change `rodVolts` to −1000 (a ruler rubbed on a different material) and try again.

## What you should see

- After *set*: a dimly glowing LED.
- Positively charged ruler approaching: the LED gets brighter; it stays that way while the ruler is held still.
- Negatively charged ruler approaching: the LED goes dark.
- Ruler taken away: back to the set brightness.

## Why it works

After *set* the gate floats with a fixed charge. The ruler induces extra charge on the wire and the gate; positive raises the gate voltage and the MOSFET conducts more, negative lowers it and the MOSFET conducts less. A circuit cannot hold a stream of water, but the bending stream and this LED respond to the same induced charge.
