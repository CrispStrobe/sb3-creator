---
level: intermediate
age: 13+
prereqs: [pc77-klemmenspannung, pc78-belastete-quelle]
teaches: [internal-resistance, short-circuit-current, maximum-power-transfer, thevenin-source]
---
## What you see
Every battery hides a resistor inside it. Here that resistor is drawn out in the open: an ideal 6 V source with 10 Ω in series. A knob (LOAD) sets the load from 0 to 40 Ω, an ammeter reads the current and a voltmeter reads the voltage at the load.

## Try this
1. Turn LOAD from high to low and write down voltage and current at several positions. The voltage falls as the current rises.
2. Press SHORT. The current does not shoot to infinity: it stops near 0.6 A.
3. Work out P = U · I for each position. Where is it largest? Compare that load with the 10 Ω inside the source.

## What is going on
The internal resistance and the load form a voltage divider. A small load gets a big current, but most of the voltage is lost inside the source; a big load keeps the voltage but takes little current. In between, at R_load = R_i, the product U · I is largest: about 0.89 W here. Radio aerials, loudspeakers and solar panels are all matched to their source for exactly this reason. The price is efficiency: at matching, the source heats itself as much as it heats the load.

## Go further
- [pc78-belastete-quelle](../pc78-belastete-quelle): a battery with internal resistance feeding LED loads.
- [pc80-quellen-vergleich](../pc80-quellen-vergleich): a fresh and a worn battery compared.
