# Warmth stops the blinker

Two transistors form a blinker that is set just on the edge of working. The first transistor is the thermometer: warm it with your fingers or hot water and it conducts a little more, which is enough to tip the circuit over the edge. The blinking stops; let the transistor cool and it starts again.

**Teaches:** a transistor junction as a temperature sensor (−2 mV/K), operating point, an oscillator biased to the edge

## What to do

Click **Sim** and watch the LED blink. Move transistor Q1's temperature slider to "hot", wait a few seconds, then back to "room". Try "ice" too, and the trim pot that sets the edge.

## What you should see

- At room temperature: the LED blinks about 1.2 times a second.
- Hot: within a few seconds the blinking stops and the LED stays dark.
- Back at room temperature: it blinks again.
- Ice-cold: the LED stays lit and does not blink.

## Why it works

The capacitor feeds every change at the second transistor back to the first, which amplifies it again: the pair flips back and forth, but only while both transistors are able to amplify. The first transistor's working point is set by a fixed voltage at its base. Warm silicon needs less base voltage, so the warm transistor conducts more, holds the second one off, and the loop loses its gain. Cold silicon does the opposite.
