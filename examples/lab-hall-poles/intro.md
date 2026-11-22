# Hall sensor: north, south and field strength

A Hall sensor gives out half its supply voltage when no magnet is near. One magnetic pole pushes the output up, the other pulls it down, and a stronger field moves it further. Two comparators either side of the resting level tell north from south, and a centre-zero meter shows how strong the field is.

**Teaches:** the Hall effect, comparing against two references (a window), offset and sign

## What to do

Click **Sim**. The field slider of the Hall sensor is at +0.5: the red NORTH LED is on and the meter points right. Move the slider through zero to −0.5 and watch the LEDs swap and the needle swing to the other side.

## What you should see

- North pole: red LED, needle right.
- South pole: green LED, needle left.
- Weak field: no LED, needle near the middle.

## Why it works

The sensor's output rests at 2.5 V. The references at 3.0 V and 2.0 V form a window around that rest level, so only a clear field in either direction switches an LED. The meter measures the difference from 2.5 V, which is why it can show both directions.
