---
level: intermediate
age: 10+
prereqs: [arduino-01-blink]
teaches: [millis-timing, non-blocking-code, led]
---
## Was du siehst
LED an D13 wird mit millis() statt delay() umgeschaltet, sodass anderer Code parallel laufen kann.

## Probier das
1. Starte das Programm und beobachte das Verhalten.
2. Ändere einen Parameter und schau, wie sich die Ausgabe ändert.
3. Lies den Abschnitt „Was passiert hier", um das Prinzip zu verstehen.

## Was passiert hier
Dieser Sketch demonstriert ein grundlegendes Arduino-Programmiermuster. Siehe die Quellkommentare in der .bw-Datei für die detaillierte Erklärung.

## Warum das wichtig ist
Dieses Muster zu verstehen ist unverzichtbar für echte Embedded-Projekte, in denen Timing, Eingabeverarbeitung und Zustandsverwaltung zählen.

## Weiter geht's
- Experimentiere mit verschiedenen Pin-Nummern und Zeitwerten.
- Kombiniere dieses Muster mit anderen Beispielen für komplexere Projekte.
