---
level: beginner
age: 8+
prereqs: []
teaches: [arduino-mega, gpio, blink]
---
## Was du siehst
Eine LED an Pin D13 eines Arduino Mega blinkt einmal pro Sekunde an und aus. Der Mega fuehrt dasselbe Blinkmuster wie der Nano aus, aber auf einem Board mit viel mehr Pins und Speicher.

## Probier das
1. Starte das Programm und beobachte das LED-Blinken mit 1 Hz.
2. Aendere die Wartezeit auf 100 ms fuer einen schnellen Stroboskopeffekt.
3. Verschiebe die LED auf einen der hoehernummerierten Pins des Mega (z.B. D50) und passe die Deklaration an — der Mega hat Pins, die der Nano nicht hat.

## Was passiert hier
Der Arduino Mega verwendet einen ATmega2560 mit 54 digitalen I/O-Pins, 16 Analogeingaengen und 256 KB Flash — viel mehr als der ATmega328P des Nano. Aber Blink funktioniert identisch: Pin auf high setzen, warten, auf low setzen, warten, wiederholen. Die zusaetzliche Kapazitaet zaehlt bei groesseren Projekten, nicht bei diesem. Der Punkt ist, dass dieselbe Programmstruktur auf verschiedenen Arduino-Boards funktioniert.

## Warum das wichtig ist
Der Mega ist das Board, zu dem man greift, wenn einem Nano die Pins oder der Speicher ausgehen. Zu wissen, dass dasselbe Blink-Programm auf beiden funktioniert, bedeutet, dass deine Faehigkeiten direkt uebertragbar sind. Der Unterschied ist Skalierung, nicht Konzept.

## Weiter geht's
- [mega02-adc-print](../mega02-adc-print) — die 16 Analogkanaele des Mega nutzen.
- [mega03-port-current](../mega03-port-current) — 8 LEDs von einem Port treiben und Stromgrenzen kennenlernen.
- Experiment: Lasse LEDs an zwei verschiedenen Ports gleichzeitig blinken und pruefe, dass der Mega beide ohne Timing-Konflikte bewaeltigt.
