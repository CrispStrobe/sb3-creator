# lab-fibre-fm — expected behaviour

## Circuit
- 5 V supply. Transmitter: a 555 astable (1 kΩ, 6.8 kΩ, 1 nF) near 100 kHz drives a red LED through 150 Ω. A potentiometer pulls the 555's control voltage through 4.7 kΩ: the control voltage sets the flash frequency. Wiggling the knob fast is what a music signal would do.
- A 1 m light guide. Receiver: the phototransistor switches its 1 kΩ load fully on and off with every flash. A 100 pF capacitor and two diodes (a diode pump) move one small, fixed charge per flash into 47 kΩ ∥ 2.2 nF; the voltmeter reads the average.
- The light path's knob is the receiver-end gap, 0 to 20 mm; authored 1 mm.

## Observable behaviour
- As authored (pot 0.50) the control pin sits near 3.07 V.
- Pot at 0.2 (lower control voltage, higher frequency): the meter settles near 1.5 V.
- Pot at 0.8 (higher control voltage, lower frequency): near 1.25 V.
- The meter follows the frequency, not the brightness: as long as the phototransistor still switches fully, a few millimetres of gap change nothing. That is why FM shrugs off losses in the fibre that would make an amplitude link quieter.
- 100 kHz is fast for the simulator: each simulated millisecond takes several seconds.

## What this verifies
1. Frequency modulation: the information is in how often the light flashes.
2. A diode pump converts frequency to voltage.

```assert
# The potentiometer and 4.7 k pull the 555's control pin below its 3.33 V rest.
net timer_555_3.control V 3.07 +-0.05
```
