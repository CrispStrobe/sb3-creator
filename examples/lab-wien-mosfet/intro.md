# Wien-bridge sine with a MOSFET

An op-amp with a gain of three and a Wien network makes a sine wave of about 1 kHz. A MOSFET acting as a voltage-controlled resistor, steered by a germanium-diode rectifier, holds its amplitude steady and clean.

**Teaches:** oscillation condition, automatic gain control, MOSFET as a resistor

## What to do

Click **Sim** and watch the output on voltmeter_17 or on the scope at the op-amp's output. After a few hundred milliseconds close AGC OFF (switch_16).

## What you should see

- A sine of about 1 kHz that settles at about 1.2 V peak.
- With AGC OFF the oscillation grows until its tops are cut off by the op-amp's limits.

## Why it works

The Wien network passes one third of the output back at its own frequency, so the amplifier must have a gain of exactly three. The MOSFET's channel is part of the resistor that sets that gain. The diode charges the gates more negative the larger the swing, the channel narrows and the gain drops, until gain and losses balance.
