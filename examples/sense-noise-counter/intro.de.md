---
level: intermediate
age: 12+
prereqs: [sense-clap-switch]
teaches: [edge-detection, counting, time-window]
---
## Was du siehst
Das Programm hört jeweils zehn Sekunden lang zu und zählt, wie viele einzelne Geräusche es gehört hat. Jedes gezählte Geräusch lässt die Blip-LED einmal aufblitzen; am Ende jedes Zeitfensters geht die Anzahl an den seriellen Monitor, und die Warn-LED leuchtet, wenn es unruhig war — fünf Geräusche oder mehr.

## Probier das
1. Starte das Programm und drücke innerhalb von zehn Sekunden dreimal Klatschen. Du siehst drei Blitze und danach eine 3 im seriellen Monitor.
2. Klatsche sechsmal in einem Zeitfenster: Die Warn-LED geht an.
3. Halte den Geräuschpegel zwei Sekunden lang hoch. Das zählt als EIN Geräusch — finde die Zeile, die dafür sorgt.

## Was passiert hier
„Ist es gerade laut?" ist ein Pegel; „wie oft wurde es laut?" braucht Ereignisse. Das Programm merkt sich den vorherigen Messwert in einer Variablen und zählt nur, wenn der Eingang von leise auf laut wechselt — eine steigende Flanke. Ein langes Geräusch bleibt laut und erzeugt deshalb genau eine Flanke.

Alle 10 ms abzutasten ist schnell genug, um ein Klatschen zu erwischen, aber langsam genug, dass das kurze Flackern des Moduls selten eine zweite Flanke erzeugt.

## Warum das wichtig ist
Flanken in einem Zeitfenster zu zählen ist die Grundlage vieler echter Messungen: Ein Fahrradcomputer zählt Radumdrehungen pro Sekunde, ein Regenmesser Kippungen pro Stunde und ein Geigerzähler Klicks pro Minute.

## Weiter geht's
- [sense-noise-light](../sense-noise-light) — mit dem analogen Ausgang messen, WIE laut es ist, statt zu zählen.
- [two-toggle-keys](../two-toggle-keys) — dieselbe Flankenerkennung für zwei Taster gleichzeitig.
- Experiment: Gib die Anzahl zusätzlich jede Sekunde aus, damit du sie während des Zeitfensters steigen siehst.
