# lab-amp-horn — expected behaviour

## Circuit
- 9 V supply, one LM386 audio power amplifier seated across the breadboard gutter. Pins 1 and 8 are open (gain 20), pin 7 is open, −IN (pin 2) is grounded.
- Feedback: the output (pin 5) drives +IN (pin 3) through C1 = 47 nF. R1 = 22 kΩ runs from +IN to ground; the chip's own input resistance sits in parallel with it.
- A button puts R2 = 10 kΩ in parallel with R1.
- Output: pin 5 → + of C2 = 100 µF (electrolytic) → speaker → ground. The speaker is a loudspeaker voice coil (`speaker`, the defaults: 8 Ω, 0.2 mH, rated 0.5 W).
- A two-channel scope: channel 1 on the amplifier output, channel 2 on the speaker side of C2.

## Observable behaviour
- Power on: a steady low tone of about 175 Hz.
- Hold the button: the tone jumps to about 440 Hz. Release it: back to about 175 Hz.
- Scope channel 1 (amplifier side of C2): a square-ish wave between about 0.9 V and 8.1 V. Its average is about 4.5 V, half the supply, where the LM386 biases its output.
- Scope channel 2 (speaker side of C2): centred on 0 V. At every flip of the output it jumps to about +4 V or −4 V (with a brief spike to about ±7 V from the coil's inductance) and then decays towards 0 V with the time constant 8 Ω × 100 µF = 0.8 ms. The capacitor passes the changes and blocks the half-supply bias, so no steady current flows through the speaker.
- The speaker sounds the oscillator's note (`buzzerTone`: about 176 Hz, about 437 Hz with the button) at full level: about 0.29 A rms through its coil (0.38 A with the button held), above the 0.25 A that its 0.5 W rating allows for 8 Ω, so `level` is capped at 1.
- At the moment of switch-on the output jumps and charges C2 through the speaker: the familiar click (a "thump") of an audio amplifier.

## Why it oscillates
Each time the output swings, C1 kicks +IN the same way, and the amplifier, with a gain of 20, drives its output hard to that side. The kick then decays through R1 (and the chip's input resistance). Once +IN has fallen back to within a few tenths of a volt of 0 V, the amplifier leaves its limit, the output starts to fall back, and C1 passes that change on to +IN: the amplifier snaps over to the other side. The time for each half-wave is set by C1 and the resistance from +IN to ground, so a smaller resistance (the button) gives a shorter period and a higher note.

## What this verifies
1. An amplifier with positive feedback through a capacitor oscillates.
2. A coupling capacitor separates the AC signal from the DC bias: a speaker must not carry a steady current.
3. The note follows the time constant at the input.

```assert
# t = 1 ms: the first half-wave. The output is high, the speaker side of C2
# falls as C2 charges through the 8-ohm voice coil, -IN sits at ground.
net vsource_2.pos V 9.00 +-0.01
net lm386_3.inn V 0.00 +-0.01
net lm386_3.vout V 7.97 +-0.10
net speaker_9.a V 3.12 +-0.10
```
