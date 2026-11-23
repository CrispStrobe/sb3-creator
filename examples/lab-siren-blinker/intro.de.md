---
level: intermediate
age: 12+
prereqs: [lab-astable-blinker, pc67-555-tongenerator]
teaches: [modulation, 555-control-voltage, diode-switch, siren]
---
## Was du siehst
Ein Rot-Grün-Blinker aus zwei Transistoren, ein Tongenerator mit dem 555 und einem Piezo, dazwischen eine Diode und ein Regelwiderstand. Der Ton springt zwischen einem tiefen und einem hohen Ton, im Takt der Lampen.

## Probier das
1. Klick auf **Sim** und hör zu: hoch, tief, hoch, tief. Achte darauf, welche Farbe zu welchem Ton gehört.
2. Dreh den Regelwiderstand herunter: Der hohe Ton wird höher. Dreh ihn hoch: Die beiden Töne rücken zusammen.
3. Leg ein Oszilloskop an den Steuereingang des 555 und an den Transistor der grünen LED. Die Steuerspannung fällt genau dann, wenn Grün leuchtet.

## Was passiert hier
Der 555 erzeugt allein einen Ton. Sein Steuereingang legt die beiden Spannungen fest, bei denen er umschaltet; normalerweise liegt er bei zwei Dritteln der Versorgung. Leitet die grüne Seite des Blinkers, liegt ihr Kollektor fast bei 0 V, und die Diode lässt den Steuereingang über den Regelwiderstand herunterziehen. Niedrigere Schaltschwellen bedeuten, dass der Kondensator des 555 weniger weit laden muss, also schaltet er schneller: ein höherer Ton. Leuchtet Rot, ist der Kollektor der grünen Seite hoch und die Diode sperrt, und der 555 spielt seinen normalen Ton. Ein Oszillator, der einen anderen umschaltet: So funktionieren Sirenen, Wechseltonalarme und Zweiklanghörner.

## Weiter geht's
- [pc68-555-sirene](../pc68-555-sirene) — eine Sirene, die gleitet statt springt.
- [lab-astable-blinker](../lab-astable-blinker) — der Blinker allein.
