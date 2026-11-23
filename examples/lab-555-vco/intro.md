---
level: advanced
age: 13+
prereqs: [lab-555-inside, pc68-555-sirene]
teaches: [voltage-controlled-oscillator, FSK, 555-timer, control-pin, modem]
---
## What you see
A 555 tone generator whose pitch is not set by a resistor but by a voltage. The TUNE knob sets that voltage on the CONTROL pin; the BIT button nudges it down, which makes the tone jump up.

## Try this
1. Turn TUNE slowly from one end to the other and listen: the pitch glides from about 2.3 kHz down to about 740 Hz.
2. Watch the voltmeter on CONTROL at the same time. Higher voltage, lower note.
3. Leave TUNE at 60 % and tap BIT in a rhythm. The tone flips between two pitches: that is a 0 and a 1.
4. Look at the timing capacitor on the scope. Where does it turn around? Compare with the CONTROL voltage.

## What is going on
Inside the 555 the CONTROL pin is the upper threshold; the lower threshold is always half of it. The timing capacitor runs back and forth between the two. Raise the CONTROL voltage and the capacitor has to charge higher, closer to the supply, where charging gets slow: the pitch drops. A circuit whose frequency follows a voltage is a VCO. Two fixed voltages give two tones, which is how frequency-shift keying sends bits over a phone line or a radio link. Feed a VCO's control from a comparison of its own output with another signal and you get a phase-locked loop, the heart of radio tuners.

## Go further
- [lab-555-inside](../lab-555-inside): what the CONTROL pin does to the thresholds.
- [lab-siren-glide](../lab-siren-glide): another way to steer a 555's pitch with a voltage.
