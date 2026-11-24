# lab-fibre-lens — expected behaviour

## Circuit
- 9 V battery. A red LED with 470 Ω, a converging lens (focal length 2 cm, 3 cm across) 6 cm in front of it, and the entrance of a 1 m plastic light guide behind the lens. Lens and fibre are one `light_path` (medium fibre with a launch lens).
- The far end of the guide lights a phototransistor wired as an emitter follower into 470 Ω; the voltmeter reads the light that arrives.
- The knob slides the fibre entrance from 7.5 cm to 10.5 cm from the LED; authored 9 cm.

## Observable behaviour
- At 9 cm the meter reads about 4.12 V, the most anywhere on the knob.
- A quarter of a centimetre either way already drops it to about a quarter of that; at 8 cm or 10 cm it is below a tenth of a volt.
- 1/f = 1/u + 1/v with u = 6 cm and f = 2 cm puts the LED's image 3 cm behind the lens, 9 cm from the LED: there the image of the glowing chip is smallest and lands on the 1 mm core.
- Take the lens away (the path's `lensFocalCm` cleared, `inGapMm` 90 for the same 9 cm): under a hundredth of a volt. The bare LED spreads its light over centimetres; the lens gathers it onto the core.
- The lens is slow enough for the fibre: its light arrives at the core within the fibre's acceptance cone (numerical aperture 0.5). A much faster lens would waste the outer part of its cone.

## What this verifies
1. Focusing with a lens couples light into a fibre: the image must sit on the core.
2. The lens equation decides where the fibre end has to be.

`test/lab-circuits-optics.test.mjs` holds these numbers.

```assert
# The fibre entrance at the LED's image, 9 cm from the LED.
net voltmeter_7.a V 4.12 +-0.1
```
