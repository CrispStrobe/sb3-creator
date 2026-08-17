# pc85-led-lampe-puls — expected behaviour

## Circuit
LM358 triangle oscillator (same topology as pc84). Single white LED through 470 Ω.

## Observable behaviour
- **LED breathes** smoothly: on → off → on, continuously.
- **Current at peak:** (3.5 − 2) / 470 ≈ 3.2 mA.
- **Breathing period:** similar to pc84, determined by integrator R×C.

## What this verifies
1. Simplified version of the breathing circuit (one LED)
2. Triangle wave produces smooth analog dimming

```assert
# LM358 triangle oscillator: VCC = 5V, single LED breathing
# TODO: needs engine model for dual opamp integrator/comparator interaction
net vcc_1.pos V 5.00 +-0.01
```
