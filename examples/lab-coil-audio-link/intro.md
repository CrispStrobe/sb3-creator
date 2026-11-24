# Sound through two windings, and the turns ratio

Music can cross from one winding of a transformer to the other without any wire between them. Which way round you connect the windings matters: in through the winding with fewer turns and out of the one with more, the signal is stepped up; the other way round, stepped down.

**Teaches:** transformer coupling of audio, turns ratio, galvanic isolation

## What to do

Click **Sim** and listen. The generator stands for a radio's loudspeaker output. Two identical transformers are driven the two ways round; the slide switch picks which one feeds the amplifier. Move it from left to right and back, and put the scope on the transistor's base.

## What you should see

- Left (fed into the small winding): loud; about 25 mV peak to peak at the preamp's input, 3 V at the amplifier output.
- Right (fed into the large winding): about a quarter as much.

## Why it works

Both windings share one magnetic field, so each turn of wire gets the same voltage. The winding with twice the turns therefore has twice the voltage of the other. Going in small and out large doubles the signal; going in large and out small halves it: a factor of four between the two positions. The transistor and the amp chip then amplify both the same way.
