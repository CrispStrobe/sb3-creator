# IR receiver: phototransistor alone or photo-Darlington

**Teaches:** infrared link, phototransistor, Darlington, sensitivity

## What to do

Click **Sim**: the red LED glows. Change the distance of the light path (light_path_12) from 1 to 30 cm. Slide RECEIVER (slide_switch_6) right and repeat. At 30 cm, raise the phototransistor's light slider (phototransistor_5) a little: room light.

## What you should see

- Alone: red only at a few centimetres.
- Photo-Darlington: green up to 20–30 cm.
- With the Darlington even a little room light lights the green LED.

## Why it works

The phototransistor lets through a current proportional to the light on it, and the light from the IR LED spreads out quickly with distance. Alone, its current is enough for an LED only up close. A second transistor amplifies that current about a hundred times: the receiver reaches much further, but now weak room light is amplified just as much.
