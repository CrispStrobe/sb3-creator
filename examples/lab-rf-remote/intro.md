# Radio remote switch

On the left a small transmitter: a transistor oscillator on a ferrite rod, which only runs while you hold its button. On the right, half a metre away, a receiver: a second ferrite rod, a MOSFET that amplifies the radio frequency, a diode that turns the carrier into a DC voltage, and the amplifier chip, which raises that voltage until an LED lights.

**Teaches:** carrier detection, RF amplification, a DC-coupled amplifier as a switch

## What to do

Click **Sim** and wait a moment. Hold the transmitter's **button** and watch the LED; then let go.

## What you should see

- Without the button the LED is dark; the amplifier's output rests at half the supply, about 4.5 V.
- Holding the button, the LED lights within a few milliseconds: the output rises to about 7 V.
- Let go and it goes dark again.

## Why it works

There is no programme on this carrier — its presence alone is the message. The receiver's MOSFET amplifies the RF about twelve times, the diode charges its capacitor to the carrier's peaks, and the amplifier chip, with its input coupled directly, multiplies that DC by 20 on top of its resting half-supply. The LED sits behind a zener diode, so the resting 4.5 V is not enough to light it; the raised output is.
