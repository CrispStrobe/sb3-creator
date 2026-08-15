---
level: beginner
age: 8+
prereqs: []
teaches: [mcu-basics, gpio, atmega168p]
---
## Was du siehst
Eine LED an einem Pin blinkt einmal pro Sekunde, genau wie das klassische 01-blink-Beispiel. Der Unterschied ist der Chip: Das Programm läuft auf einem ATmega168P, dem Mikrocontroller in vielen Arduino-Boards, statt auf einem STC12.

## Probier das
1. Starte das Programm und überprüfe, dass die LED gleichmäßig mit 1 Hz blinkt.
2. Ändere die Wartezeit auf 200 ms und beobachte, wie das Blinken schneller wird.
3. Vergleiche diesen Code nebeneinander mit 01-blink — beachte, wie die Logik identisch ist, sich aber Pinnamen und Chip-Deklaration unterscheiden.

## Was passiert hier
Der ATmega168P ist ein AVR-Mikrocontroller, der häufig in Arduino Nano und älteren Arduino Uno Boards steckt. Er verwendet andere Pinnamen und Registerkonventionen als der STC12, aber die Grundidee ist dieselbe: Einen GPIO-Pin mit einer Verzögerung dazwischen ein- und ausschalten. Brickwright abstrahiert die chip-spezifischen Details hinter derselben Blocksprache, sodass das Programm nahezu identisch aussieht. Die DEVICE-Deklaration sagt dem Compiler, welchen Chip er ansteuern soll.

## Warum das wichtig ist
Die Erkenntnis, dass dasselbe Programm auf verschiedenen Chips funktioniert, ist entscheidend. Der Algorithmus ändert sich nicht — nur die Hardware-Details. Genau dafür gibt es Hochsprachen und Abstraktionen: Man schreibt die Logik einmal und kann verschiedene Plattformen ansteuern.

## Weiter geht's
- [01-blink](../01-blink) — dasselbe Programm auf einem STC12-Chip zum Vergleich.
- [12-dual-blink](../12-dual-blink) — zwei LEDs im Wechsel blinken lassen als nächsten Schritt.
- Experiment: Schlag das ATmega168P-Pinout nach und versuche, einen anderen Pin blinken zu lassen.
