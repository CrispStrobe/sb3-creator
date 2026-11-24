# A bare wire picks up a radio station

The same high-gain amplifier as the hum finder — an LM386 with a gain of 200 and a loudspeaker — with 30 cm of bare wire on its input. Close to a strong medium-wave transmitter, the loudspeaker plays the station. There is no tuned circuit and no diode: the amplifier's own input transistor does the detecting.

**Teaches:** RF interference, every junction is a detector, why audio amplifiers need RF filtering

## What to do

Click **Sim** and listen. Then select the wire (the antenna part) and lower the station's field in its `stations` parameter from 0.1 to 0.01 V/m.

## What you should see

- At 0.1 V/m: the station's 400 Hz tone, loud.
- At 0.01 V/m: almost nothing. A tenth of the field gives far less than a tenth of the sound.

## Why it works

The wire picks up a few tens of millivolts of the transmitter's 1 MHz signal. Far above what the amplifier is meant to amplify — but its input is the base of a transistor, a junction, and a junction rectifies: the average current through it moves with the size of the RF swing, and with an AM station that size is the programme. The amplifier then amplifies the programme like any other sound. For small signals a junction rectifies with the square of the swing, which is why a weak station vanishes. Real amplifiers near transmitters get a small capacitor across the input to stop exactly this.
