# Noise from a broken-down junction

A transistor used backwards: its base-emitter junction is fed the wrong way round through a resistor until it breaks down. The current that then flows is not smooth, and two amplifier stages turn its tiny jitter into a hiss in the earphone.

**Teaches:** reverse breakdown, avalanche noise, amplifying a small signal

## What to do

Click **Sim** and listen to the earphone. Look at the voltage on the noise transistor's emitter.

## What you should see

- The emitter sits at about 7.5 V: the junction's breakdown voltage. About 30 µA flow through the 47 kΩ resistor.
- The earphone hisses: no tone, just noise (the earphone's readout says *noise*).

## Why it works

Above its breakdown voltage a junction conducts by avalanche: one carrier knocks loose others, which knock loose more. Each avalanche starts at a random moment and is a little burst of charge, so the current is a fast, random stream of bursts. Across the junction that is a jitter of about a millivolt. The first stage amplifies it about a hundred times, the second again, and the earphone turns the random voltage into a hiss.
