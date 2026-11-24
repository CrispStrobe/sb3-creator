---
level: advanced
age: 14+
prereqs: [lab-buffered-voltmeter]
teaches: [ammeter, shunt, amplifier, calibration]
---
## Was du siehst
Eine kleine Schaltung zum Messen (eine 4,5-V-Batterie und ein 47-Ω-Widerstand), deren Strom über einen 1-Ω-Messwiderstand zurückfließt. Ein Verstärker mit Operationsverstärker und einem Knopf „Kalibrieren“, ein Messinstrument und ein Schalter, der den Verstärker entweder vom Messwiderstand speist oder von einer kleinen Spannung, die mit einer roten LED erzeugt wird.

## Probier das
1. Klick auf **Sim**. Das Instrument zeigt etwa 4,7: Bei 20 mA pro Volt fließen also etwa 94 mA durch die Schaltung.
2. Schalt auf die Kalibrierspannung: Das Instrument zeigt 4,34, den Wert, für den diese Spannung steht (87 mA).
3. Dreh den Kalibrierknopf ein wenig: Die Anzeige wandert. Dreh zurück, bis wieder 4,34 dasteht, und schalt dann zurück aufs Messen.

## Was passiert hier
Jeder Strom hinterlässt an einem Widerstand in seinem Weg eine kleine Spannung. Bei nur 1 Ω merkt die Schaltung davon kaum etwas, aber die Spannung ist winzig, unter einem Zehntel Volt. Deshalb verstärkt der Operationsverstärker sie etwa fünfzigfach für das Instrument. Wie prüft man den Faktor ohne einen großen, bekannten Strom? Eine LED hält eine fast feste Spannung, und ein Teiler macht daraus eine kleine, gleichbleibende Spannung. Steht sie für 87 mA, dreht man den Knopf, bis das Instrument 87 mA zeigt; ab dann wird jeder Strom richtig angezeigt.

## Weiter geht's
- [lab-buffered-voltmeter](../lab-buffered-voltmeter) — der Operationsverstärker hilft beim Messen von Spannung.
- [lab-linear-ohmmeter](../lab-linear-ohmmeter) — und von Widerständen.
