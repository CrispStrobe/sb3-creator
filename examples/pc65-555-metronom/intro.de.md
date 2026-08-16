---
level: intermediate
age: 12+
prereqs: [51-555-astable]
teaches: [555-timer, astable, potentiometer, frequency-control]
---
## Was du siehst
Ein 555-Timer im astabilen Modus als einstellbares Metronom. Ein Potentiometer steuert die Frequenz: voll aufgedreht ein schnelles Klicken, zurückgedreht ein langsames Ticken.

## Probier das
1. Klick auf **Sim** — der Summer tickt mit einer Frequenz, die von der Poti-Stellung abhängt.
2. Drehe das Poti ganz auf — das Ticken wird schneller.
3. Drehe es zurück — das Ticken verlangsamt sich.

## Was passiert hier
Im astabilen Modus schwingt der 555 frei zwischen Laden und Entladen des Kondensators. Die Frequenz beträgt f = 1,44 / ((R₁ + 2·R_pot) × C). Das Potentiometer ändert R₂ und damit die Lade-/Entladezeit.

## Weiter geht's
- [51-555-astable](../51-555-astable) — die Grundschaltung des astabilen 555.
- [pc67-555-tongenerator](../pc67-555-tongenerator) — höhere Frequenz, echter Ton statt Klicken.
- [ttl-clock-module](../ttl-clock-module) — ein vollständiges Taktmodul auf 555-Basis.
