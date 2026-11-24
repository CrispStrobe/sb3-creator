# Hum finder: where is the cable in the wall?

A loudspeaker amplifier with very high gain and nothing on its input but a short bare wire. Move the wire towards a mains cable and the speaker hums. Electricians' cable finders work the same way.

**Teaches:** capacitive coupling, high-impedance inputs, gain setting

## What to do

Click **Sim**. Turn the probe's knob: it is the distance between the wire and a hidden mains cable (0 far away, 1 right on it). Then flip the slide switch.

## What you should see

- Knob at 0: silence. Turning it up: a 50 Hz hum that grows the closer the wire gets.
- Switch to the right (a resistor in the gain path): the same hum, about half as loud.

## Why it works

The cable and the wire form a tiny capacitor, a few picofarads. For 50 Hz that is a resistance of hundreds of megohms, but the 230 V on the cable still pushes a fraction of a microamp through it into the amplifier's input, a few millivolts. The amplifier multiplies that by up to 200. The capacitor between its gain pins sets that gain; a resistor in series with it sets a smaller one, and the hum shrinks with it.
