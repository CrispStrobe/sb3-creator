---
level: beginner
age: 10+
prereqs: [pc67-555-tongenerator, pc03-series-resistors]
teaches: [series-resistors, parallel-resistors, 555-timer, pitch, frequency]
---
## Was du siehst
Ein 555-Tongenerator mit nur zwei Tasten, und trotzdem spielt er vier Töne. Keine Taste wählt direkt einen Ton: Jede ändert, wie die Zeitwiderstände verschaltet sind.

## Probier das
1. Starte die Simulation und hör zu (oder schau aufs Oszilloskop): Ohne Taste spielt der tiefste Ton.
2. Bevor du etwas drückst, berechne R2 für jeden Fall: KEY 2 überbrückt R_a, KEY 1 legt R_c parallel zur Kette, beide tun beides.
3. Drück KEY 2, dann KEY 1, dann beide. Prüfe, dass die Töne in der Reihenfolge steigen, in der deine Widerstände fallen.
4. Spiel eine Melodie aus vier Tönen.

## Was dahintersteckt
Der 555 lädt seinen Kondensator über R1 + R2 und entlädt ihn über R2, zwischen einem und zwei Dritteln der Versorgung. Größeres R2 heißt langsameres Laden und tieferer Ton: f = 1,44 / ((R1 + 2·R2) · C). Ein überbrückter Widerstand fällt aus der Reihenschaltung heraus; ein parallel geschalteter Widerstand senkt den Gesamtwert immer. So ergeben zwei Taster vier verschiedene Werte: 80 kΩ, 47 kΩ, 29,6 kΩ und 23,5 kΩ, vom tiefsten zum höchsten Ton.

## Weiter geht's
- [pc67-555-tongenerator](../pc67-555-tongenerator): derselbe Chip mit einer festen Tonhöhe.
- [lab-pitch-probe](../lab-pitch-probe): Jedes Material kann der Zeitwiderstand sein.
