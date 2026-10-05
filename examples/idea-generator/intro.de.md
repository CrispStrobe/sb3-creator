---
level: beginner
age: 10+
prereqs: [01-blink, 11-toggle-button]
teaches: [pseudo-random, serial-output, choices]
---
## Was du siehst
Langeweile? Drück den Taster, und der MCU schlägt im seriellen Monitor ein Projekt vor, zusammengesetzt aus drei zufälligen Wörtern — „paint a secret robot", „program a blinking game". Drei Listen mit je vier Wörtern ergeben 64 verschiedene Ideen.

## Probier das
1. Starte das Programm, öffne den seriellen Monitor und drücke ein paar Mal den Taster.
2. Ersetze die Wörter durch eigene, gern auf Deutsch: Tätigkeiten, Orte, Essen — was du willst.
3. Füge einer Liste ein fünftes Wort hinzu. Was muss sich im Programm noch ändern, damit das neue Wort gewählt werden kann?

## Was passiert hier
Während du wartest, zählt eine Zahl namens `seed` tausendmal pro Sekunde hoch. Der Moment, in dem du drückst, hält sie bei einem Wert an, den du absichtlich nie treffen könntest. Eine kurze Formel — mal 11, dann den Rest beim Teilen durch 251 behalten — rührt die Zahl vor jedem Wort um, und die Frage, in welchem Viertel von 1..250 sie gelandet ist, macht daraus eine Wahl zwischen 1 und 4. Dieselbe Formel wird dreimal hintereinander benutzt, einmal pro Liste.

Jedes Wort steht in einer eigenen Zeile, eine ganze Idee sind also drei Zeilen im seriellen Monitor.

## Warum das wichtig ist
Zufällige Auswahl aus Listen steckt in Wortspielen, Quiz-Apps, Zufallswiedergabe und automatisch erzeugten Spielleveln. Außerdem sieht man schön, dass „zufällig" auf einem Computer ein Rezept ist und keine Zauberei.

## Weiter geht's
- [dice-pips](../dice-pips) — dieselbe Zufallsformel auf LEDs.
- [reaction-duel](../reaction-duel) — dieselbe Formel entscheidet, wann ein Rennen startet.
- Experiment: Lass die Lampe nur leuchten, wenn die Idee „robot" enthält.
