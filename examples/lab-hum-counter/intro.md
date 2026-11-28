# Counting the mains hum with a piece of wire

A wire on the clock input of a binary counter, held near mains wiring, picks up the 50 Hz hum. The hum swings the input across the switching threshold fifty times a second, and four LEDs count in binary: the counter is counting the mains.

**Teaches:** capacitive pickup of mains hum, high-impedance inputs, binary counting

## What to do

Click **Sim**. Watch the LEDs count, press **RESET**, then move the wire away from the mains (its knob towards 0).

## What you should see

- Near the mains: the count goes up by 50 every second (it starts again after 15).
- RESET clears it to 0.
- Wire far away: the counting stops.

## Why it works

The wire and the mains wiring form a tiny capacitor, a few picofarads. With 10 MΩ from the input to ground, the hum makes several volts at the input, enough to cross the counter's threshold on every cycle. That is why unused CMOS inputs must never be left open: they count whatever the room offers.
