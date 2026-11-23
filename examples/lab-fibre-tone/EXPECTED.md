# lab-fibre-tone — expected behaviour

## Circuit
- 9 V battery. A red LED with 470 Ω lights a 0.5 m light guide; its far end points at a phototransistor (iMax 0.5 mA at full light).
- A 555 astable: 47 kΩ from +9 V to DISCHARGE, 1 kΩ on to THRESHOLD/TRIGGER, 47 nF timing capacitor, 10 nF on CONTROL. The phototransistor sits across the 47 kΩ, so light adds charging current. A piezo on the output plays the tone.
- The light path's knob is the gap between the fibre end and the phototransistor, 0 to 10 mm; authored 2 mm.

## Observable behaviour
- 2 mm gap: about 1960 Hz.
- Fibre end touching the phototransistor: above 3.5 kHz.
- 10 mm gap: about 725 Hz, close to the dark pitch set by the 47 kΩ alone.
- Every loss in the light guide (bend, rough cut, offset, length) lowers the pitch: you hear the loss.

## What this verifies
1. The light leaving a fibre spreads out in a cone, so a small gap already costs light.
2. A phototransistor as a light-controlled current changes a 555's charging time.

```assert
# The 555's control pin sits at two thirds of the supply.
net timer_555_9.control V 6.00 +-0.05
```
