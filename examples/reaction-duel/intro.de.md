---
level: intermediate
age: 10+
prereqs: [25-reaction-timer, dice-pips]
teaches: [reaction-time, pseudo-random, game-logic]
---
## Was du siehst
Ein Reaktionsspiel für zwei. Beide legen einen Finger auf ihren Taster. Nach einer zufälligen Wartezeit leuchtet die Start-LED, und wer zuerst drückt, gewinnt — seine LED blinkt, und seine Reaktionszeit in Millisekunden erscheint im seriellen Monitor. Wer zu früh drückt, schenkt die Runde dem Gegner.

## Probier das
1. Spiele ein paar Runden mit jemandem, oder drücke A und B selbst, um beide Seiten zu testen.
2. Drücke A, bevor die Start-LED leuchtet. Die Runde ist für A verloren, und der Monitor sagt es.
3. Finde die Zeile, die die zufällige Wartezeit bestimmt, und ändere sie so, dass die Wartezeit 1 bis 3 Sekunden beträgt.

## Was passiert hier
Die Wartezeit ist zufällig, damit niemand den Rhythmus lernen und absichtlich früh drücken kann. Sie stammt aus derselben kleinen Formel wie beim Würfel: mal 11, dann den Rest beim Teilen durch 251 behalten. Die Reaktionszeit jeder Runde wird wieder in diese Zahl gemischt, deshalb hängt die nächste Wartezeit davon ab, wie schnell die beiden wirklich waren.

Während des Wartens prüft das Programm alle 10 ms beide Taster. Seine Schleife endet, sobald ENTWEDER die Zeit abgelaufen ist ODER jemand gedrückt hat — zwei Bedingungen, verbunden mit ODER. Nach dem Start zählt eine zweite Schleife Millisekunden, bis einer der Taster gedrückt wird.

## Warum das wichtig ist
Faire Spiele brauchen unvorhersehbare Zeitpunkte und klare Regeln gegen Schummeln. Dasselbe Muster — warten, auf eine zu frühe Eingabe achten, dann die Antwort messen — steckt in echten Reaktionstests für Sport und Verkehrssicherheit.

## Weiter geht's
- [25-reaction-timer](../25-reaction-timer) — die Version für eine Person.
- [two-toggle-keys](../two-toggle-keys) — zwei Taster lesen, ohne dass einer den anderen blockiert.
- Experiment: Spielt „best of five" — führt für jeden einen Punktestand und lasst am Ende die LED des Gesamtsiegers blinken.
