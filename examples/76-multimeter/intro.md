# Build your own multimeter

The multimeter kits you can buy (the HU-050 board in many German
"Bausatz" sets) are all the same machine inside: a small
microcontroller, an ADC, a couple of clever analog front-ends, and a
multiplexed LED display. This example builds that machine from parts,
so you can see every trick a real meter uses.

## Three measurements, three front-ends

**Volts** — the ADC only accepts 0–5 V, so a **voltage divider**
(30 kΩ/10 kΩ = ÷4) scales the input down first. The firmware multiplies
back up. Every range switch on a real meter is just a different divider.

**Amps** — current is measured by letting it flow through a tiny
**shunt resistor** (0.02 Ω, same value as on the real kit) and reading
the voltage drop. 100 mA through 0.02 Ω is only 2 mV — far too small
for the ADC — so an **LM358 op-amp** amplifies it ×46.5 first
(non-inverting, gain set by the 100 kΩ/2.2 kΩ feedback pair). Ohm's
law does the rest: I = V / R.

**Temperature** — an **NTC thermistor** in a divider. Its resistance
falls as it warms; the divider voltage follows. This stage shows the
raw millivolts — turning that into °C needs the thermistor equation,
which is stage two.

## The display

One 3-digit seven-segment block, eight segment lines shared by all
digits, one common per digit. The firmware lights one digit at a time,
2 ms each — your eye integrates the scan into a steady reading, exactly
like the matrix examples. The decimal point marks the volts mode.

Press the MODE button to cycle V → A → T (the buzzer chirps). In SIM,
drag the two pots to change the "measured" voltage and current, and
edit the NTC to warm it up.
