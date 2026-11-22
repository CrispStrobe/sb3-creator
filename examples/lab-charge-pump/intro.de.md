---
level: intermediate
age: 12+
prereqs: [51-555-astable, 42-diode-rectifier]
teaches: [charge-pump, voltage-doubler, capacitor, diode, output-resistance]
---
## Was du siehst
Ein 555-Timer erzeugt eine Rechteckspannung, dazu ein Pumpkondensator, zwei Dioden und ein großer Speicherkondensator. Eine blaue LED ist der Verbraucher. Nirgends gibt es einen Transformator, und trotzdem bekommt die LED mehr als 9 V.

## Probier das
1. Klick auf **Sim** und miss mit einem Voltmeter am Speicherkondensator. Die Spannung steigt über die 9 V der Batterie und pendelt sich bei etwa 14 V ein.
2. Miss mit dem Oszilloskop den Punkt zwischen den beiden Dioden: er springt zwischen etwa 9 V und etwa 18 V.
3. Drück **schwere Last**. Die Ausgangsspannung fällt unter 10 V und schwankt. Lass los, und sie erholt sich.
4. Halte den Oszillator an (Reset des 555 auf Masse). Die Spannung sinkt langsam unter 9 V.

## Was passiert hier
Ist der 555-Ausgang low, lädt sich der Pumpkondensator über die erste Diode aus der Batterie auf etwa 9 V. Springt der Ausgang um 9 V hoch, hebt er den ganzen Kondensator mit – die geladene Platte liegt jetzt bei fast 18 V, und diese Ladung fließt über die zweite Diode in den Speicher. Jeder Takt trägt ein kleines Ladungspaket nach oben, wie eine Eimerkette. Chips erzeugen mit genau diesem Trick höhere oder negative Spannungen ohne Spule. Der Haken: die Pakete sind klein, eine schwere Last leert den Speicher schneller, als die Pumpe ihn füllt.

## Weiter geht's
- [51-555-astable](../51-555-astable) — der Oszillator für sich allein.
- [pc31-bridge-rectifier](../pc31-bridge-rectifier) — Dioden und Speicherkondensator an Wechselspannung.
