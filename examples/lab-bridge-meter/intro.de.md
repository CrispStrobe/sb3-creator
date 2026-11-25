---
level: advanced
age: 14+
prereqs: [lab-linear-ohmmeter]
teaches: [precision-rectifier, full-wave, op-amp, polarity]
---
## Was du siehst
Ein Operationsverstärker an zwei Batterien (plus und minus 9 V), ein Drehknopf oder ein Sinusgenerator als Eingang, und in der Rückkopplung eine Brücke aus zwei Dioden und zwei LEDs mit einem Messinstrument in der Mitte.

## Probier das
1. Klick auf **Sim**. Der Knopf liefert ein halbes Volt: Das Instrument zeigt ein halbes Milliampere, die rote LED leuchtet.
2. Dreh den Knopf unter die Mitte. Das Instrument zeigt dasselbe wie vorher, aber jetzt trägt die grüne LED den Strom.
3. Stell den Knopf in die Mitte: Zeiger auf null, beide LEDs dunkel.
4. Schalt auf den Generator um. Rot und Grün wechseln sich ab, jede fünfzigmal pro Sekunde, und das Instrument zeigt einen ruhigen Mittelwert.

## Was passiert hier
Der Operationsverstärker hält seinen Minus-Eingang auf derselben Spannung wie den Plus-Eingang. Der 1-kΩ-Widerstand von dort nach Masse führt deshalb einen Strom, der nur vom Eingang abhängt: 1 mA pro Volt. Zu diesem Widerstand kommt der Strom nur durch die Brücke. In der einen Richtung nimmt er die linke Diode, das Instrument und die rote LED, in der anderen die rechte Diode, das Instrument und die grüne LED. In beiden Fällen durchquert er das Instrument in derselben Richtung. Der Ausgang des Operationsverstärkers geht einfach so weit hoch oder runter, wie nötig ist, um den Strom durch Diode und LED zu drücken. Deren Spannungsabfälle tauchen am Instrument also nie auf: Auch ein winziger Eingang wird richtig gemessen. So richten gute Wechselspannungsmesser gleich.

## Weiter geht's
- [lab-linear-ohmmeter](../lab-linear-ohmmeter) — derselbe Trick: Der Operationsverstärker erzwingt einen Strom.
- [lab-sound-meter](../lab-sound-meter) — eine Einweg-Version, die Schall misst.
