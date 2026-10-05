---
level: intermediate
age: 11+
prereqs: [05-counter, clock-ds3231]
teaches: [memory, buses, variables]
---
## Was du siehst
Bei jedem Start gibt das Programm aus, wie oft es schon gestartet wurde — „Started 1 times“, dann 2, 3 … — und lässt die Lampe so oft blinken. Starte es neu, und die Zahl steigt, obwohl jede Variable wieder bei 0 beginnt.

## Probier das
1. Starte das Programm ein paarmal neu. Zählt der Zähler weiter?
2. Füge einen Taster hinzu, der den Zähler auf 0 zurücksetzt.
3. Speichere eine zweite Zahl an Adresse 1: zum Beispiel den Rekord eines Spiels.

## Was dahintersteckt
Variablen liegen im Arbeitsspeicher des Chips (RAM), und der vergisst alles, wenn der Strom weg ist. Ein EEPROM behält seine Bytes jahrzehntelang ohne Strom. Dieses hier, ein AT24C02, fasst 256 Bytes mit den Nummern 0 bis 255 und hängt an denselben zwei I2C-Leitungen wie andere Chips.

`byte 0 of memory` liest das Byte an Adresse 0, und `store starts at 0 in memory` schreibt es. Ein Byte fasst eine Zahl von 0 bis 255; von einer größeren Zahl bleiben nur die letzten 8 Bit (aus 300 wird 44). Ein fabrikneues EEPROM liest überall 255, deshalb gilt 255 hier als „noch nie gestartet“.

Das Schreiben dauert für den Chip ein paar Millisekunden, in denen er nicht antwortet. Das Programm fragt seine Adresse immer wieder, bis er antwortet — dann ist das Byte sicher.

## Warum das wichtig ist
Einstellungen, Kalibrierwerte, Rekorde und Zähler wie der Kilometerstand im Auto überleben das Ausschalten, weil sie in genau so einem Speicher liegen.

## Weiter geht's
- [clock-ds3231](../clock-ds3231) — ein Uhrenchip am selben Bus.
- [i2c-scanner](../i2c-scanner) — sieh zu, wie beide Chips antworten.
- Experiment: Bewahre die letzten zehn Temperaturen eines Thermometers auf und gib sie beim Start aus.
