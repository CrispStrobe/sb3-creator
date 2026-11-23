# lab-liquid-level — expected behaviour

## Circuit
- 9 V battery. A narrow-beam red LED (half angle 8°) with 470 Ω shines through a round glass at a phototransistor 15 cm away (`light_path` medium liquid, beam at half the glass height).
- The phototransistor runs from the base of an NPN to ground; 100 kΩ from +9 V feeds that base. The NPN switches a blue "full" LED with 1 kΩ.
- The knob is the liquid level, 0 (empty) to 1 (full).

## Observable behaviour
- Empty glass: the beam passes straight through, the lit phototransistor holds the base near 0.43 V and the "full" LED is off.
- Level 0.3, still below the beam: still off.
- Level 0.7, above the beam: the liquid refracts the beam away from the phototransistor, the base rises until the NPN conducts and the "full" LED lights.

## What this verifies
1. Refraction at a curved liquid surface bends and spreads a beam (a full round glass is a lens).
2. A contact-free level sensor: nothing touches the liquid.

```assert
# Empty glass: the lit phototransistor holds the NPN's base low.
net npn_7.base V 0.43 +-0.05
```
