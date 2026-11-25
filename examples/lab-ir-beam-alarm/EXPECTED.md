# lab-ir-beam-alarm — expected behaviour

## Circuit
9 V battery.

- An IR LED (220 Ω) shines steadily on a phototransistor 20 cm away (`light_path`, medium air; knob `blocked`, 0 = clear beam, 1 = fully blocked).
- The phototransistor, collector to plus, feeds 10 kΩ on -IN of an LM386 audio power amplifier (gain 20, pins 1, 8 and 7 open).
- The LM386 is wired as an oscillator: its output kicks +IN through 47 nF and the kick decays through 22 kΩ (and the chip's own input resistance) until the amplifier flips back. The output drives an 8 Ω loudspeaker through 100 µF.

## Observable behaviour
- Beam clear: the photocurrent puts about 0.5 V on -IN. The kicks on +IN cannot climb past it for long, so the output is held at its low limit (0.9 V): silence.
- Beam blocked: -IN drops to 0 V, the amplifier oscillates between its limits (0.9 V and 8.1 V) at about 176 Hz, and the loudspeaker blares.
- Beam back: silent again.

## What this verifies
1. An amplifier with positive feedback oscillates; a DC offset on its other input stops it.
2. A light barrier that sounds when it is broken.

```assert
# t = 1 ms: the beam's photocurrent x 10 kOhm on -IN.
net lm386_7.inn V 0.507 +-0.02
net phototransistor_5.emitter V 0.507 +-0.02
```
