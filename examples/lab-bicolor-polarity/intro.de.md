---
level: beginner
age: 10+
prereqs: [28-diode-polarity]
teaches: [led-polarity, anti-parallel, polarity-tester]
---
## Was du siehst
Eine rote und eine grüne LED, gegeneinander geschaltet hinter einem Widerstand, zwischen zwei Prüfspitzen. Ein Relais vertauscht die Anschlüsse der Batterie an den Prüfspitzen, solange du den Taster hältst.

## Probier das
1. Klick auf **Sim**: die rote LED leuchtet – Spitze A ist Plus.
2. Halte den Taster **Spitzen tauschen**: das Relais zieht an, jetzt leuchtet die grüne LED.
3. Lass los, und die rote kommt zurück.
4. Ersetze Batterie und Relais durch einen Funktionsgenerator mit 1 Hz: die Farben wechseln sich ab. Bei 50 Hz scheinen beide gleichzeitig zu leuchten.

## Was passiert hier
Eine LED ist eine Diode: Strom fließt von der Anode zur Kathode, aber nicht umgekehrt. Die beiden LEDs zeigen in entgegengesetzte Richtungen, also hat bei jeder Polung genau eine von ihnen einen Weg. Die Farbe verrät dir die Polung. Die dunkle LED ist dabei nie in Gefahr: sie sieht in Sperrrichtung nur die kleine Durchlassspannung ihrer leuchtenden Partnerin.

## Weiter geht's
- [28-diode-polarity](../28-diode-polarity) — eine einzelne Diode in Durchlass- und Sperrrichtung.
