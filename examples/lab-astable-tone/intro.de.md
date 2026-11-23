---
level: beginner
age: 10+
prereqs: [lab-astable-blinker]
teaches: [astable, frequency, sound, morse]
---
## Was du siehst
Zwei Transistoren, eine Morsetaste, eine gelbe LED und ein kleiner Piezo-Ohrhörer. Zwei Schiebeschalter wählen kleine oder große Koppelkondensatoren.

## Probier das
1. Klick auf **Sim**. Stille: Die Taste ist nicht gedrückt.
2. Halte die Taste. Du hörst einen hohen Ton, und die LED scheint dauernd zu leuchten.
3. Tippe kurz und lang: Morsezeichen.
4. Stell beide Schiebeschalter auf die großen Elkos und halte die Taste. Jetzt blinkt die LED, und der Hörer klickt etwa dreimal pro Sekunde.

## Was passiert hier
Ein Hörer macht nur dann ein Geräusch, wenn sich der Strom durch ihn ändert; ein gleichbleibender Strom ist stumm. Die beiden Transistoren schalten sich gegenseitig immer wieder ein und aus. Mit kleinen 10-nF-Kondensatoren passiert das etwa 1500-mal pro Sekunde, und die Klicks verschmelzen zu einem Ton. Mit 4,7 µF ist es fast 500-mal langsamer, und du hörst einzelne Klicks wie bei einem Metronom. Die Tonhöhe hängt von Widerstand mal Kapazität ab: größere Werte, tieferer Ton.

## Weiter geht's
- [lab-astable-blinker](../lab-astable-blinker) — dieselbe Schaltung, langsam genug zum Zuschauen.
- [pc67-555-tongenerator](../pc67-555-tongenerator) — ein Ton aus einem Timer-Baustein.
