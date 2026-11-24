# Light guide sets the pitch

The far end of a light guide shines on a phototransistor that helps charge a 555's timing capacitor. The more light gets through, the higher the tone.

**Teaches:** light leaving a fibre spreads out, fibre losses heard as pitch, a phototransistor in a timing network

## What to do

Click **Sim** and listen. Turn the light guide's knob to move the fibre end away from the phototransistor and back. Try a tight bend (`bendRadiusCm` 0.5) or rough ends (`cutQuality` 0) in the inspector.

## What you should see

- 2 mm gap: a tone near 2 kHz.
- Fibre end touching the receiver: much higher, above 3.5 kHz.
- 10 mm away: down to about 725 Hz.

## Why it works

Light leaves the fibre end in a cone, so the further away the receiver, the less of it lands there. The phototransistor passes a current that grows with the light, and that current charges the 555's capacitor faster: it reaches its switching level sooner and the tone goes up.
