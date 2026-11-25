# Wake-up radio with a MOSFET detector

A one-station radio whose detector is a MOSFET: the pot biases its gate just above the point where it starts to conduct, so only one half of the radio wave gets through, and the programme comes out at its drain. Its source does not go to ground directly but through a phototransistor — in the dark the MOSFET cannot conduct at all.

**Teaches:** square-law detection in a field-effect transistor, a light switch in the current path

## What to do

Click **Sim** with the phototransistor's **light** slider at dark: silence. Then move the slider to full light.

## What you should see

- Dark: the speaker is silent and the MOSFET's drain sits at 9 V.
- Light: the drain drops to about 7.7 V and the station's 400 Hz tone plays.

## Why it works

A MOSFET's drain current grows with the square of how far its gate is above the threshold. Biased right at that point, the half of each radio-frequency cycle that lifts the gate makes current flow and the other half does not; averaged over the cycles, the current follows the station's loudness — the programme. The phototransistor is the only way for that current to reach ground: only when light falls on it can the radio play.
