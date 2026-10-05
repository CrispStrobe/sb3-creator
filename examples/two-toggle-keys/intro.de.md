---
level: beginner
age: 10+
prereqs: [11-toggle-button]
teaches: [edge-detection, polling, non-blocking]
---
## Was du siehst
Zwei Taster, zwei Lampen. Jeder Taster schaltet seine eigene Lampe ein und aus, und die beiden kommen sich nie in die Quere — du kannst sogar einen Taster gedrückt halten und den anderen weiter benutzen.

## Probier das
1. Starte das Programm und drücke A, dann B, dann wieder A. Jede Lampe folgt ihrem eigenen Taster.
2. Halte A gedrückt und drücke mehrmals B. B funktioniert weiter.
3. Sieh dir 11-toggle-button an, das `wait until` benutzt. Warum würden zwei Kopien dieser Schleife in einem Skript nicht für zwei Taster funktionieren?

## Was passiert hier
`wait until key pressed` hält das ganze Programm an, bis genau dieser eine Taster gedrückt wird — währenddessen wird der andere ignoriert. Dieses Programm wartet nie auf einen Taster. Fünfzigmal pro Sekunde sieht es sich beide an und vergleicht für jeden, was es jetzt sieht, mit dem, was es beim letzten Mal gesehen hat. Nur ein Wechsel von losgelassen zu gedrückt — eine Flanke — schaltet die Lampe um. Ein gehaltener Taster erzeugt keine neue Flanke, deshalb passiert nichts, bis er losgelassen und wieder gedrückt wird.

Die 20 ms zwischen zwei Blicken verbergen außerdem das Prellen, das kurze An-Aus-Geklapper, das ein echter Taster beim Schließen macht.

## Warum das wichtig ist
Echte Geräte überwachen viele Eingänge gleichzeitig: ein Gamecontroller, eine Tastatur, ein Maschinenpult. Alles in einer Schleife abzufragen und auf Änderungen zu reagieren, ist das Grundmuster hinter all diesen Geräten.

## Weiter geht's
- [11-toggle-button](../11-toggle-button) — ein Taster mit blockierendem Warten.
- [sense-noise-counter](../sense-noise-counter) — dieselbe Flankenerkennung an einem Geräuschsensor.
- Experiment: Füge einen dritten Taster hinzu, der beide Lampen auf einmal ausschaltet.
