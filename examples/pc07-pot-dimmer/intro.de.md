---
level: beginner
age: 10+
prereqs: [pc02-voltage-divider, pc01-led-resistor]
teaches: [potentiometer, variable-resistance, dimming]
---
## Was du siehst
Ein Potentiometer (einstellbarer Widerstand) steuert, wie hell eine LED leuchtet. Drehen am Knopf ändert die Spannung am Schleifer, was den Strom durch die LED verändert.

## Probier das
1. Klick auf **Sim** und beachte die Helligkeit der LED.
2. Verstelle die Position des Potentiometers und beobachte, wie die LED heller oder dunkler wird.
3. Setze das Poti auf 0 % — der Schleifer liegt auf Masse, es fließt kein Strom, und die LED bleibt dunkel.

## Was passiert hier
Ein Potentiometer ist ein Widerstand mit einem Schleifkontakt (dem Schleifer). Ein Ende hängt an der Versorgung, das andere an Masse, und der Schleifer greift eine Spannung irgendwo dazwischen ab — ein stufenlos einstellbarer Spannungsteiler. Die Schleiferspannung geht über einen 220-Ω-Widerstand zur LED. Höhere Schleiferspannung bedeutet mehr Strom und eine hellere LED. Bei 50 % liegt der Schleifer bei etwa 2,5 V, was rund (2,5 − 2,0) / 220 ≈ 2,3 mA ergibt — ein schwaches Leuchten. Bei 100 % entspricht es einer direkten Verbindung über 220 Ω.

## Warum das wichtig ist
Potentiometer sind der einfachste Weg, dem Benutzer eine analoge Steuerung zu geben — Lautstärkeregler, Dimmschalter und Joysticks nutzen sie alle. Den Spannungsteiler im Poti zu verstehen ist der Schlüssel zu ihrem richtigen Einsatz.

## Weiter geht's
- [pc02-voltage-divider](../pc02-voltage-divider) — die feste Variante desselben Prinzips.
- [pc48-ldr-comparator](../pc48-ldr-comparator) — ein lichtabhängiger Widerstand im Teiler als automatischer Sensor.
- Experiment: Ersetze den 220-Ω-Widerstand durch 1 kΩ und beobachte, wie sich der Dimmbereich verändert.
