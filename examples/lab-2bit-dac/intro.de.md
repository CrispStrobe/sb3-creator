---
level: advanced
age: 14+
prereqs: [pc54-opamp-follower]
teaches: [dac, binary-weighting, summing-amplifier]
---
## Was du siehst
Zwei Schalter stehen für eine zweistellige Binärzahl. Ein Operationsverstärker macht daraus eine Spannung, die du am Messgerät abliest: 0, 0,5, 1,0 oder 1,5 V.

## Probier das
1. Klick auf **Sim**. Die Schalter stehen auf 1 und 0 — das Messgerät zeigt 1,0 V.
2. Probier alle vier Kombinationen und schreib jeweils die Spannung auf.
3. Welcher Schalter ist „mehr wert"? Um wie viel?

## Was passiert hier
Jeder Schalter schickt einen Strom von der 1,5-V-Referenz in den Eingang des Operationsverstärkers. Bit 1 geht über 15 kΩ, Bit 0 über 30 kΩ, also liefert Bit 1 doppelt so viel Strom. Der Operationsverstärker addiert die Ströme und macht aus der Summe eine Spannung an seinem 10-kΩ-Rückkopplungswiderstand (verkehrt herum, deshalb dreht ein zweiter Operationsverstärker sie wieder um). Doppelter Widerstand, halbes Gewicht — so werden in jedem DAC Binärzahlen zu Spannungen.

## Weiter geht's
- [lab-2bit-adc](../lab-2bit-adc) — der Rückweg: von der Spannung zu Bits.
