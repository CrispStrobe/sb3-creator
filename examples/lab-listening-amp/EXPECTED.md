# lab-listening-amp — expected behaviour

## Circuit
- 9 V supply. A loudspeaker used as a microphone gives only millivolts; here a 1 kHz source of 10 mV amplitude stands in for it (the simulator has no speaker that works backwards).
- C1 = 1 µF couples it onto a 10 kΩ pot used as a volume divider; C2 = 1 µF couples the wiper into the amplifier.
- R1 = 10 kΩ and R2 = 10 kΩ make a half-supply reference; R3 = 100 kΩ biases the amplifier's input to it, so the output can swing both ways around half the supply.
- Half of an LM358 (the other half parked as a grounded follower) is a non-inverting stage with R4 = 100 kΩ and R5 = 1 kΩ: gain 1 + 100000 / 1000 = 101 for speech-band signals. C3 = 2.2 µF in series with R5 keeps the DC gain at 1, so the bias stays put.
- C4 = 10 µF couples the output to the piezo earpiece. C3 and C4 are electrolytics, their + sides towards the amplifier.

## Observable behaviour
- After switch-on the coupling capacitors take about half a second to charge; the output then settles at half the supply, 4.5 V.
- Sensitivity knob at half way (authored): about 1 V peak-to-peak of 1 kHz at the output, a gain of about 101 from the wiper.
- Knob full: about 2 V peak-to-peak. Knob near zero: a faint signal, a few tenths of a volt at most.
- A real speaker as a microphone delivers far less than 10 mV for normal speech, which is why the gain must be high. With speaker and earpiece close together, a real amplifier like this one howls: the sound from the output reaches the input again. The simulator does not model that acoustic path.

```assert
# a driven bench: the audio itself is checked by hand, only the rail here
net vcc1.vcc V 9.00 +-0.01
```
