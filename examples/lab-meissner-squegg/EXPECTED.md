# lab-meissner-squegg — expected behaviour

## Circuit

The 9 V transmitter is a Meissner oscillator with a 250 µH ferrite rod and NPN
transistor. Both slide switches reverse the base feedback winding. A separate
ferrite rod, 0.5 m away, feeds the receiver diode, detector capacitor and
crystal earphone.

A 7 pF capacitor at the transmitter samples the carrier. A diode rectifies it
into a 10 nF capacitor and 68 kΩ discharge resistor. The LM393 compares this
envelope to the potentiometer setting. Its open-collector output clamps the
transistor bias through a diode. A 2.2 MΩ feedback resistor gives two distinct
cutoff and release thresholds.

## Observable behaviour

- Pot at 0.30: the tank settles near 8.78 V peak. The receiver detector is
  near 1.12 V DC and the earphone is silent.
- Turn the pot down to 0.05: the transmitter’s own RF charges its detector
  capacitor. The LM393 removes bias, the carrier collapses, then the capacitor
  discharges and bias returns. This repeats at about 1 kHz. The receiver
  converts that envelope into an audible tone.
- Return to 0.30: the continuous carrier and quiet earphone return.
- Reverse both switches: the feedback phase prevents oscillation and the
  earphone is silent.

The CLI tests the live knob and switches. It measures RF at the transmitter
and detector voltage at the receiver, and checks that repeated LM393 cutoff
intervals coincide with the loss of bias and RF.

## Comparison with the original circuit

The earlier circuit relied on rectification at the transistor alone. It
produced weak-bias bursts in an older engine, but the current RF solve gives a
steady carrier at both settings. The revised circuit generates the cutoff
explicitly from its own envelope.

The [ngspice comparison deck](../../../../test/fixtures/meissner/rf-transient.cir)
models the original circuit with a nominal NPN and coil loss near resonance.
Run `ngspice -b` with the deck path from a scratch directory. Over the final
5 ms, 25 µs windows show a carrier near 17.8 V peak-to-peak at both forward
settings, with under 1 mV of variation in the detector window averages.
The reversed run is silent.

```assert
# supply
net vsource_2.pos V 9.00 +-0.01
```
