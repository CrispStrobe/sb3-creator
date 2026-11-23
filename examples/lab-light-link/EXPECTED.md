# lab-light-link — expected behaviour

## Circuit
A light link between a transmitter and a receiver, on one 9 V supply.

- **Transmitter:** a 555 astable (R1 = 1 kΩ, R2 = 6.8 kΩ, C = 100 nF, CONTROL decoupled with 10 nF) switches the light emitter of an optocoupler on and off through R_tx = 330 Ω. The STEADY LIGHT button feeds the emitter from +9 V through R_steady = 330 Ω instead, so it stays lit.
- **The beam:** the optocoupler's emitter and receiver stand for an infrared LED and a phototransistor facing each other. The HAND IN BEAM button shorts the emitter, which is what a hand in the beam does: no light arrives.
- **Receiver:** the phototransistor pulls down a green LED with R_rx = 1 kΩ from +9 V, so the green LED shows how much light arrives. From the same point, C_couple = 100 nF passes the signal on to a piezo with R_spk = 10 kΩ to ground.

## Observable behaviour
- **Tone link (start):** the transmitter flashes at about 960 Hz (1.44 / ((1 kΩ + 2 × 6.8 kΩ) × 100 nF) = 986 Hz by formula). The receiver's collector follows, swinging between about 0.08 V (light on) and 6.9 V (light off). The coupling capacitor passes that swing to the speaker as a tone of about ±4 V. The green LED flickers too fast to see and looks half bright.
- **STEADY LIGHT:** the emitter stays lit, the collector stays low (about 0.05 V) and the green LED glows steadily. The speaker falls silent (less than ±0.03 V): a capacitor passes changes, not a steady level.
- **HAND IN BEAM:** no light reaches the receiver. The collector sits high (about 7.2 V), the green LED is dark and the speaker is silent.

## What this verifies
1. Light can carry a signal across a gap with no wire (and with no electrical connection: an optocoupler isolates the two sides).
2. Switching the light on and off (modulating it) turns it into a carrier; a coupling capacitor at the receiver keeps the tone and throws away any steady light. That is how remote controls ignore room light.

```assert
net timer.reset V 9.00 +-0.01
```
