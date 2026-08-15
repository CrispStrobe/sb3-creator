---
level: beginner
age: 8+
prereqs: []
teaches: [digital-output, gpio, delay, led]
---
## Was du siehst
Eine LED an Pin D13 blinkt einmal pro Sekunde. Das ist das Arduino-„Hello World" — wenn deine LED blinkt, funktioniert dein Board.

## Probier das
1. Starte das Programm und beobachte die LED mit 1 Hz blinken.
2. Ändere die Wartezeit von 1 Sekunde auf 0,1 Sekunden — das Blinken wird schneller.
3. Probiere 2 Sekunden an, 0,5 Sekunden aus — ein asymmetrisches Muster.

## Was passiert hier
Der Arduino setzt Pin D13 auf HIGH (5 V), wodurch Strom durch den Widerstand und die LED fließt. Nach einer Sekunde setzt er den Pin auf LOW (0 V) und die LED erlischt. Die Endlosschleife wiederholt das endlos. Pin 13 steuert bei den meisten Arduinos auch die eingebaute LED.

## Warum das wichtig ist
Blink beweist, dass die Toolchain durchgängig funktioniert: Code kompiliert, wird hochgeladen, läuft und steuert Hardware.

## Weiter geht's
- [arduino-01-fade](../arduino-01-fade) — Helligkeit mit PWM steuern statt nur ein/aus.
- [arduino-01-digital-read-serial](../arduino-01-digital-read-serial) — einen Taster lesen statt eine LED zu treiben.
