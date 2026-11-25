# lab-opamp-beats — expected behaviour

## Circuit
- 9 V supply. LM324 sections 1 and 2: two relaxation oscillators (Schmitt triggers on three 10 kΩ each, 10 nF each), one charged through 68 kΩ, the other through 56 kΩ plus the DETUNE rheostat (potentiometer_15, 22 kΩ; as built at half).
- Section 3: inverting adder around a 4.5 V midpoint, 100 kΩ from each oscillator's capacitor, 47 kΩ back. Loudspeaker through 10 µF and 1 kΩ.

## Observable behaviour
- The first generator runs at about 930 Hz. With DETUNE at half the second is about 13 Hz higher: the sum swells and fades thirteen times a second, a floating tone.
- Turn DETUNE: the beat speeds up the further the two pitches are apart (about 50 Hz at 0.6) and slows to nothing where they meet.
- Where the two triangles are in step the sum reaches about 2.3 V pp; where they are opposite it shrinks to a few tenths of a volt.

## Measured on the engine
bw-board 2965782a, `test/lab-circuits-r10c.test.mjs` (DETUNE 0.6): 930 Hz and 980 Hz, envelope between 0.36 V pp and 2.3 V pp, repeating every 20 ms.

## What this verifies
1. Two oscillations of slightly different frequency add to one whose loudness rises and falls at the difference frequency.
2. Free-running relaxation oscillators keep their own pitch: nothing locks them together here.

## Simulation notes
The adder takes the capacitor voltages (triangle-like) rather than the square outputs: two squares of equal duty add to a constant average, triangles show the beat in their amplitude.

```assert
# 1 ms after switch-on (the solve assert-physics runs)
net resistor_4.b V 4.5 +-0.01
net lm324_3.1_pos V 3.008 +-0.03
```
