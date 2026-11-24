# Regenerative receiver: feedback until it whistles

One transistor, a ferrite-rod coil with a small second winding, and a knob called "regeneration". The transistor detects the station in its base junction like the one-transistor radio, but its collector current also flows through the small winding, which feeds a little of the amplified RF back into the tuned circuit. Turn the knob up and the feedback grows until it cancels the tank's losses: from there on the circuit oscillates by itself.

**Teaches:** positive feedback, the oscillation threshold (loop gain one), heterodyne whistles

## What to do

Click **Sim**. Start with the regeneration knob at 0.9 (little current, little feedback) and listen. Turn it slowly towards 0.8, then on to 0.7. Probe the top of the tuned circuit.

## What you should see

- At 0.9 the weak station is barely there: the earphone carries no tone.
- Just past 0.8 the tank's RF jumps up and a whistle starts, about 1 kHz.
- Turning further, the whistle climbs (about 2 kHz at 0.75, near 4 kHz at 0.7).
- The whistle's pitch is the distance between the station's carrier and the circuit's own oscillation.

## Why it works

The tank loses a little energy every cycle in the coil's resistance, the antenna and the transistor's base. The coupling winding returns some of the amplified signal in step with the tank, which makes up part of that loss: the tank becomes sharper and its signal larger. Once more comes back than is lost, any tiny signal — the station, or even the coil's own thermal noise — grows until the transistor runs out of gain. That is an oscillator near the station's frequency. Two signals close in frequency beat: the transistor's junction hears their difference as a tone. As the transistor's current rises, its capacitance pulls the oscillation a little away from the station and the whistle rises.
