---
level: advanced
age: 14+
prereqs: [lab-function-generator]
teaches: [voltage-to-frequency, integrator, adc-by-counting, linearity]
---
## Was du siehst
Ein Regler und eine blinkende LED. Dreh den Regler auf, dann blitzt die LED schneller — im Verhältnis zur eingestellten Spannung.

## Probier das
1. Klick auf **Sim** und zähl ein paar Sekunden lang die Blitze.
2. Dreh den Regler halb auf und zähl noch einmal. Dann ganz auf.
3. Dreh ihn ganz zu: gar keine Blitze.
4. Setz einen Oszilloskop-Tastkopf an den Integrierer-Ausgang und beobachte den Sägezahn.

## Was passiert hier
Die Eingangsspannung treibt einen Strom in einen Integrierer, dessen Ausgang deshalb nach unten läuft — schneller bei größerer Spannung. Erreicht die Rampe eine untere Grenze, kippt ein Schmitt-Trigger, zieht die Rampe über eine Diode wieder hoch und lässt los. Die LED blitzt einmal pro Durchlauf. Weil die Rampe immer dieselbe Höhe durchläuft, folgt die Zahl der Blitze pro Sekunde der Eingangsspannung. Zähl sie eine feste Zeit lang, und du hast eine analoge Spannung in eine Zahl umgewandelt.

## Weiter geht's
- [lab-function-generator](../lab-function-generator) — derselbe Integrierer und Trigger, die Dreiecke erzeugen.
- [lab-2bit-adc](../lab-2bit-adc) — eine Spannung stattdessen mit Komparatoren umwandeln.
