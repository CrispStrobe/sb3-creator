# Hall changeover with hysteresis, and a magnet that tunes a PLL

A linear Hall sensor gives a voltage that follows the magnet's field. Two transistors turn it into a changeover switch that remembers which pole came last, and the oscillator of a PLL chip turns the same voltage into a pitch.

**Teaches:** hysteresis, the emitter-coupled trigger, magnetic poles, a voltage-controlled oscillator

## What to do

Click **Sim**. Set the Hall sensor's field to −0.6, then step it up through 0, 0.2, 0.3, 0.6. Then step it back down through 0, −0.3, −0.4. Listen to the piezo while you do it.

## What you should see

- Field −0.6: the green LED is lit.
- Rising: the yellow LED takes over at about +0.3.
- Falling: yellow stays on through 0 and only gives way to green at about −0.4.
- The pitch rises with the field: about 160 Hz at −1, 580 Hz at 0, 1010 Hz at +1.

## Why it works

The two transistors share one emitter resistor. Whichever one conducts sets the voltage on that resistor, and the other one's base has to overcome it. Because the two currents differ, the field that switches to yellow is higher than the field that switches back: the circuit has hysteresis, so it does not flicker when the field hovers near one threshold. The PLL chip's oscillator charges its capacitor faster the higher its input voltage, so the pitch tracks the field.
