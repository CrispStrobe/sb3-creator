---
level: intermediate
age: 12+
prereqs: [lab-charge-pump, lab-nand-pips]
teaches: [charge-pump, voltage-doubler, schmitt-oscillator, diode]
---
## Was du siehst
Einen Logikbaustein an 5 V, zwei Kondensatoren, zwei Dioden, eine rote LED und ein Voltmeter, das am Ende fast die doppelte Versorgungsspannung zeigt.

## Was du tun kannst
1. Klick auf **Sim** und sieh zu, wie das Voltmeter von etwa 3,8 V auf etwa 8,65 V steigt.
2. Die rote LED am Ausgang zeigt, dass die verdoppelte Spannung eine Last treiben kann.

## Was passiert hier
Ein NAND-Gatter mit Widerstand und Kondensator ist ein Oszillator, ein zweites puffert ihn. Solange der Puffer low ist, füllt sich der Pumpkondensator über die erste Diode aus der Batterie. Springt der Puffer auf high, hebt er den ganzen Kondensator um etwa 5 V an, und die zweite Diode reicht diese höhere Spannung an den Speicherkondensator weiter. Tausende Male pro Sekunde, bis der Speicher bei fast 5 V + 5 V liegt, abzüglich dessen, was die Dioden verlieren.

## Weiter geht's
- [lab-charge-pump](../lab-charge-pump) — dieselbe Pumpe, angetrieben von einem 555.
- [lab-nand-pips](../lab-nand-pips) — weitere Gatter-Oszillatoren.
