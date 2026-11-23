# lab-prism-spectrum — expected behaviour

## Circuit
- 9 V battery. A white LED with 220 Ω sends a collimated beam through an acrylic prism (60° apex). A slit at an adjustable angle lets one direction through to a photodiode (reverse-biased into 4.7 kΩ, voltmeter across it).
- The knob turns the slit from 36.0° to 37.6° of deviation; authored 37.2°.

## Observable behaviour
- 37.2° (authored): about 0.45 V, the blue part of the white LED's light.
- Sweeping the slit in 0.1° steps shows two peaks: yellow-green near 36.6° (strong) and blue near 37.2° (weaker; the silicon photodiode is less sensitive to blue). A white LED is a blue LED with a yellow phosphor.
- A red LED: one band near 36.3°. Red is bent least.
- A laser diode (kind laser_diode): one narrow line near 36.3°, narrower than the red LED's band: a laser has one wavelength. On the optical bench a laser's beam also stays narrow over a metre, where an LED's light falls with the square of the distance.

## What this verifies
1. Dispersion: the refractive index, and the bending, grows towards blue.
2. Spectra: an LED shines in a band, a white LED in two, a laser in one line.

```assert
# Slit at 37.2°: the blue band of the white LED.
net voltmeter_7.a V 0.45 +-0.05
```
