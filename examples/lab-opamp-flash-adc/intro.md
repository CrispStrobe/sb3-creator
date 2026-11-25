# Two-bit analogue-to-digital converter with op-amps and one transistor

A computer needs numbers, not voltages. This converter compares the input with three voltages at once and shows the result as a two-bit binary number on two LEDs: 00, 01, 10 or 11.

**Teaches:** comparators, flash ADC, binary numbers, decoding with diodes and a transistor

## What to do

Click **Sim**. Turn the **INPUT** knob slowly from 0 to the top and watch the meter and the two LEDs.

## What you should see

- Below 1.5 V: both off (00).
- 1.5 to 3 V: only bit 0 (01).
- 3 to 4.5 V: only bit 1 (10).
- Above 4.5 V: both (11).

## Why it works

Three op-amps each compare the input with one rung of a resistor ladder, 1.5, 3 and 4.5 V. They switch on one after another as the input rises. The middle one is directly the high bit. The low bit must be on above 1.5 V but off again above 3 V, and on again above 4.5 V: a transistor switched by the middle comparator shorts the lowest comparator's signal, and the top comparator reaches the LED along its own diode.
