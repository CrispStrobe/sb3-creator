# Music through a transistor: setting the bias

A single transistor amplifies an audio signal (the generator stands in for a music player) into an earphone. The bias pot decides where the transistor rests when no signal is there — and with it how much room the signal has to swing up and down. An LED beside the collector resistor flickers with the music.

**Teaches:** bias point, clipping at cut-off and saturation, overdrive

## What to do

Click **Sim** and listen. Turn the **bias pot** slowly to either end and back to the middle. Then select the generator and raise its `amplitude` from 0.1 to 2.5 V.

## What you should see

- In the middle (around 0.8) the collector sits near 6 V and the sound is clean.
- Turned low, the collector climbs towards 9 V: the transistor is nearly off and one half of every wave is cut flat — the sound turns harsh.
- Turned high, the collector drops to about 2 V: the transistor is nearly saturated and the other half is cut.
- With a much bigger input both halves are cut, however well the bias is set: overdrive.

## Why it works

The transistor's collector current follows its base current. With no signal, the bias sets a resting current and so a resting collector voltage. The signal adds to and subtracts from that. If the resting point is near 9 V, the collector cannot rise any further when the signal asks it to (the transistor is off); if it is near the bottom, it cannot fall any further (saturation). Set in the middle, both halves fit.
