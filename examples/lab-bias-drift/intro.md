# Heat moves the operating point

A transistor amplifier stage is biased with a divider and a pot. Warm the transistor (as with a hair dryer) and watch its collector voltage: with a plain divider it runs away, with an emitter resistor or with feedback from the collector it hardly moves.

**Teaches:** temperature drift of a transistor, stabilising the operating point with negative feedback

## What to do

Click **Sim**. The collector sits near 6.6 V. Select the transistor and move its **Temperature** slider to hot (70 °C), then back to room.

- Flip the **second slide switch** to put the emitter resistor in, set the **bias pot** to 0.90 (collector near 5.8 V) and heat it again.
- Flip it back and flip the **first slide switch** instead (the divider now hangs from the collector), set the pot to 0.70 and heat it again.

## What you should see

- Plain divider: the collector falls from about 6.6 V to about 2.3 V when hot — nearly saturated.
- With the emitter resistor: from about 5.8 V to 5.7 V.
- With collector feedback: from about 6.1 V to 5.5 V.

## Why it works

A warm junction conducts at a lower voltage (about 2 mV less per degree). If the base voltage is held fixed, the transistor sees that as more drive, and its current grows exponentially. An emitter resistor turns more current into a higher emitter voltage, which takes the drive back; a resistor from the collector to the base does the same from the other side: more current, lower collector, less base current. The capacitor across the emitter resistor keeps the signal gain.
