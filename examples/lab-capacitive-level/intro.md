---
level: intermediate
age: 12+
prereqs: [51-555-astable, 29-capacitor-charge]
teaches: [capacitance, dielectric, non-contact-sensing, 555-timer]
---
## What you see
A 555 blinker whose timing capacitor is a pair of foil strips stuck on the outside of a jar. Three slide switches stand for the water level: each one adds the extra capacitance that water creates between the strips.

## Try this
1. Click **Sim**: the empty jar gives a fast blink.
2. Fill the jar band by band with the three slide switches. The blinking slows down each time.
3. Count the blinks per second at each level. With four times the capacitance you get a quarter of the rate.

## What is going on
A capacitor is two conductors separated by an insulator. How much charge it stores depends on that insulator: water stores about eighty times more than air. So when water rises between the foil strips the capacitance grows, even though the water never touches the metal. The 555 charges and discharges its timing capacitor between two fixed voltages, so a bigger capacitor simply takes longer, and the blink rate tells you the level. A real sensor would sweep smoothly; the simulator has no variable capacitor, so the level comes in three steps here.

## Go further
- [51-555-astable](../51-555-astable) — the 555 blinker on its own.
- [lab-wet-dry-probe](../lab-wet-dry-probe) — sensing water by touching it instead.
