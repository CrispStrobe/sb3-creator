---
level: intermediate
age: 12+
prereqs: [pc67-555-tongenerator, pc25-relay-isolator]
teaches: [optical-link, modulation, AC-coupling, optocoupler, light-barrier]
---
## What you see
A transmitter that flashes an invisible light about a thousand times a second, and a receiver that turns the flashes back into a tone. In between is the beam (here sealed inside an optocoupler). You can block the beam with your hand, or switch the transmitter to a steady light.

## Try this
1. Start the simulation: the speaker plays the transmitter's tone, and the green receiver LED looks half bright.
2. Press HAND IN BEAM. The tone stops and the LED goes dark: a light barrier.
3. Release it, then hold STEADY LIGHT. The LED is now fully lit, more light than before, yet the speaker is silent.
4. Explain step 3 with the coupling capacitor.

## What is going on
The phototransistor conducts when light falls on it, pulling its collector down. With a flashing light the collector jumps up and down at the tone's frequency. The coupling capacitor passes those jumps on to the speaker but blocks any steady voltage, so a lamp that just shines (the STEADY case, or daylight in a real room) produces no sound at all. Only light that is switched on and off in the right rhythm gets through. Remote controls, light barriers and fibre links all modulate their light for exactly this reason. Because the two sides are connected only by light, an optocoupler also keeps dangerous voltages on one side away from the other.

## Go further
- [pc67-555-tongenerator](../pc67-555-tongenerator): the 555 tone generator on its own.
- [pc25-relay-isolator](../pc25-relay-isolator): another way to keep two circuits apart.
