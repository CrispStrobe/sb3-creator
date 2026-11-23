# Optical bench: the inverse-square law

An LED and a light sensor face each other on a bench. Slide the sensor further away and watch the reading fall, not in a straight line, but with the square of the distance.

**Teaches:** inverse-square law, LED beam angle, the photodiode as a linear light meter

## What to do

Click **Sim** and note the meter at 10 cm. Turn the light path's knob to 5 cm, then to 20 cm. In the inspector, set the path's `angleDeg` to 15 and then 30.

## What you should see

- 10 cm: about 0.124 V.
- 5 cm: four times as much. 20 cm: a quarter.
- 15° off the axis: half the reading.

## Why it works

The light leaving the LED spreads out in a cone. At twice the distance it covers four times the area, so each square centimetre gets a quarter of the light. The photodiode's current is proportional to the light on it, and so is the voltage across its resistor.
