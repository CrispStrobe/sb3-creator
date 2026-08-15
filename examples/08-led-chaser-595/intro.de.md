---
level: intermediate
age: 14+
prereqs: [01-blink]
teaches: [shift-register, serial-data, led-pattern]
---
## Was du siehst
Acht LEDs leuchten nacheinander auf — erst nach links wandernd, dann umkehrend nach rechts — ein klassisches Lauflicht (auch „Knight Rider"-Muster). Der MCU nutzt nur drei Pins, um alle acht LEDs über ein 74HC595-Schieberegister zu steuern.

## Probier das
1. Starte das Programm und beobachte, wie das Licht über die acht LEDs hin- und herwandert.
2. Ändere die Wartezeit, um das Muster schneller oder langsamer zu machen.
3. Lade ein anderes Bitmuster (z. B. 0b11000011) und sieh, wie sich zwei LEDs zusammen bewegen.

## Was passiert hier
Der 74HC595 ist ein 8-Bit-Schieberegister mit parallelem Ausgangs-Latch. Der MCU sendet Daten bitweise über den DATA-Pin und taktet nach jedem Bit den CLOCK-Pin. Nachdem alle acht Bits drin sind, überträgt ein Puls am LATCH-Pin den Inhalt des Schieberegisters gleichzeitig auf die Ausgangspins. So werden aus drei MCU-Pins acht Ausgangspins. Das Programm schiebt ein einzelnes „1"-Bit durch alle acht Positionen und kehrt dann die Richtung um — so entsteht das Lauflicht.

## Warum das wichtig ist
Schieberegister sind die Methode, mit der reale Produkte viele Ausgänge mit wenigen Pins ansteuern — LED-Matrizen, Siebensegmentanzeigen, Anzeigepanels. Seriell-zu-Parallel-Wandlung zu verstehen ist wesentlich für jedes Projekt, dem die GPIO-Pins ausgehen, was bei kleinen MCUs schnell passiert.

## Weiter geht's
- [01-blink](../01-blink) — Einzelpin-Ausgabe wiederholen, bevor man serielle Daten angeht.
- [12-dual-blink](../12-dual-blink) — direkte Multi-Pin-Steuerung ohne Schieberegister zum Vergleich.
- Experiment: Hänge einen zweiten 74HC595 an, um das Muster auf 16 LEDs zu erweitern — mit denselben drei MCU-Pins.
