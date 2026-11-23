# lab-lens-focus — expected behaviour

## Circuit
- 9 V battery. A red LED with 470 Ω, a convex lens of focal length f = 10 cm (aperture radius 1.5 cm) 15 cm in front of it, and a small photodiode further along the bench (`light_path` air with a lens).
- The photodiode is reverse-biased into 47 kΩ; the voltmeter reads the light on it.
- The knob slides the photodiode from 20 to 70 cm from the LED; authored 45 cm.

## Observable behaviour
- 45 cm: about 5.61 V, the largest reading anywhere on the bench.
- 35 cm and 55 cm: about 1.49 V each; further away from 45 cm in either direction it keeps falling.
- 1/f = 1/u + 1/v with u = 15 cm and f = 10 cm gives v = 30 cm behind the lens: 45 cm from the LED. That is where the lens draws the LED's image, and all the light it caught is squeezed into the smallest spot.

## What this verifies
1. The lens equation 1/f = 1/u + 1/v.
2. At the image the light is most concentrated.

```assert
# The photodiode in the image plane, 45 cm from the LED.
net voltmeter_7.a V 5.61 +-0.1
```
