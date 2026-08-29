---
level: beginner
age: 10+
prereqs: [arduino-02-button]
teaches: [internal-pullup, digital-input, inverted-logic]
---
## Was du siehst
Nutzt den internen Pull-Up-Widerstand des Arduino an D2 — kein externer Widerstand nötig. Die Logik ist invertiert: gedrückt=LOW.

## Probier das
1. Starte das Programm und beobachte das Verhalten.
2. Ändere einen Parameter und schau, wie sich die Ausgabe ändert.
3. Lies den Abschnitt „Was passiert hier", um das Prinzip zu verstehen.

## Was passiert hier
Dieser Sketch demonstriert ein grundlegendes Arduino-Programmiermuster. Siehe die Quellkommentare in der .bw-Datei für die detaillierte Erklärung.

Die Deklaration sagt es ausdrücklich: `PIN btn = D2 INPUT ACTIVE LOW`. Das ist keine Zierde — sie sorgt dafür, dass der Simulator den Pin nach oben und nicht nach unten zieht, und sie gibt `read btn` die Bedeutung „gedrückt". Ausgegeben wird `1 - read btn`, also weiterhin der rohe Pinwert wie im Original-Sketch.

## Warum das wichtig ist
Dieses Muster zu verstehen ist unverzichtbar für echte Embedded-Projekte, in denen Timing, Eingabeverarbeitung und Zustandsverwaltung zählen.

## Weiter geht's
- Experimentiere mit verschiedenen Pin-Nummern und Zeitwerten.
- Kombiniere dieses Muster mit anderen Beispielen für komplexere Projekte.
