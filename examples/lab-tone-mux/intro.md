---
level: intermediate
age: 12+
prereqs: [lab-nand-pips]
teaches: [multiplexer, nand-logic, schmitt-oscillator, time-division]
---
## What you see
Three tone generators built from NAND gates, a selector made from more NAND gates, and one piezo. A slide switch and a KEY button pick what gets through.

## What to do
1. Click **Sim** and slide the switch to the right. You hear the low tone; the yellow LED is on.
2. Hold **KEY**. The high tone takes over the line and the yellow LED goes out.
3. Slide the switch to the left. Now a slow third oscillator does the switching and the tones take turns by themselves.

## What is going on
Each NAND gate in the selector only lets its tone through while its other input is high. One gate gets the select line, the other gets the select line inverted, so exactly one tone passes at a time, and a third gate joins the two onto the line. When a clock does the selecting, two signals share one wire in turns: time-division multiplexing, the way telephone lines carry many calls.

## Go further
- [lab-nand-pips](../lab-nand-pips) — a gate oscillator switching another one on and off.
- [lab-siren-blinker](../lab-siren-blinker) — two oscillators working together.
