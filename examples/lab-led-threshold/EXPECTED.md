# lab-led-threshold — expected behaviour

## Circuit
- 9 V supply. A 10 kΩ resistor and a 10 kΩ pot give an adjustable voltage from zero up to half the supply.
- An LM358 wired as a voltage follower copies that voltage with a low source resistance, so the four LED branches do not drag each other down.
- Four branches in parallel, each a 470 Ω resistor and one LED: red, yellow, green, blue. The LEDs use the exponential (Shockley) junction model. The red branch carries an ammeter in series and a voltmeter across the LED.

## Observable behaviour

Knob at half way (the authored state): the follower output is 2.25 V.

| LED | voltage across it | current |
|---|---|---|
| red | 1.498 V | 1.60 mA |
| yellow | 1.682 V | 1.21 mA |
| green | 1.860 V | 0.83 mA |
| blue | 2.250 V | about zero, dark |

- The red current follows from the resistor: (2.25 - 1.498) / 470 = 0.0016 A.
- Turning up from zero, the LEDs come on one after another: red first, then yellow, green, and blue last, once the knob is past about 60 %. Each colour needs a larger voltage before current starts to flow.
- Near its knee a junction's current grows by a factor of ten for every small step in voltage, so the LED voltage hardly moves once it conducts: from half to full knob the red LED's voltage rises only from 1.50 V to 1.61 V while its current nearly quadruples.
- At full knob (4.5 V) all four glow; blue carries the least current because it drops the most voltage.

```assert
# knob at half way: 2.25 V buffered, blue still below its knee
net u1.1_out V 2.25 +-0.01
net led_red.anode V 1.498 +-0.01
net led_grn.anode V 1.860 +-0.01
net led_blu.anode V 2.250 +-0.01
```
