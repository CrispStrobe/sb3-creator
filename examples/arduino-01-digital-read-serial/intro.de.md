---
level: beginner
age: 10+
prereqs: [arduino-01-blink]
teaches: [digital-input, button, pull-down-resistor, serial-print]
---
## Was du siehst
Ein Taster an Pin D2 mit Pull-Down-Widerstand. Das Programm liest den Tasterzustand und gibt 0 oder 1 auf dem seriellen Terminal aus.

## Probier das
1. Starte das Programm — das Terminal zeigt 0 (Taster nicht gedrückt).
2. Drücke den Taster — das Terminal zeigt 1.
3. Entferne den Pull-Down-Widerstand und beobachte: die Werte werden unberechenbar, wenn der Taster losgelassen wird (ein schwebender Eingang).

## Was passiert hier
Wenn der Taster gedrückt ist, verbindet er D2 über den Taster mit 5 V, also liest digitalRead HIGH (1). Wenn losgelassen, hält der 10-kΩ-Pull-Down-Widerstand D2 auf 0 V, also liest digitalRead LOW (0). Ohne Widerstand schwebt der Pin — er fängt Rauschen auf und liest zufällig.

## Warum das wichtig ist
Taster sind der einfachste digitale Eingang. Pull-Down- (und Pull-Up-) Widerstände zu verstehen ist unverzichtbar — jeder digitale Eingang braucht einen definierten Zustand.

## Weiter geht's
- [arduino-01-analog-read-serial](../arduino-01-analog-read-serial) — einen Analogwert statt digital lesen.
- Experiment: probiere einen Pull-UP-Widerstand (Taster nach GND, Widerstand nach 5V) — die Logik kehrt sich um.
