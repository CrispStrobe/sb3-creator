---
level: advanced
age: 14+
prereqs: [pc05-npn-switch]
teaches: [sound-module, transistor-stages, colour-organ, audio-reactive]
---
## Was du siehst
Eine Lichtorgel: drei LED-Gruppen (rot, grün, blau) reagieren auf Schallpegel. Leise → nur Rot leuchtet. Lauter → Grün kommt dazu. Laut → alle drei Farben. Ein Klangmodul liefert das analoge Signal, drei NPN-Transistorstufen mit verschiedenen Basiswiderständen bilden die Schwellen.

## Probier das
1. Klick auf **Sim** — die LEDs reagieren auf den Schallpegel des Moduls.
2. Ändere den Pegel: niedrig → nur Rot; mittel → Rot+Grün; hoch → alle drei.
3. Die Basiswiderstände bestimmen die Schwellen: 10 kΩ (empfindlich, Rot), 22 kΩ (mittel, Grün), 47 kΩ (am wenigsten empfindlich, Blau).

## Was passiert hier
Das Klangmodul gibt ein analoges Spannungssignal (AO) proportional zum Schallpegel aus. Jede Transistorstufe hat einen anderen Basiswiderstand: ein kleinerer Widerstand bedeutet mehr Basisstrom bei gleicher Eingangsspannung, also früheres Durchschalten. So entstehen drei Schwellen — eine qualitative Frequenzaufteilung durch Empfindlichkeitsstufen.

## Weiter geht's
- [pc05-npn-switch](../pc05-npn-switch) — der Transistorschalter als Baustein.
- [pc72-tagschaltung](../pc72-tagschaltung) — ein Sensor steuert einen Transistor (Licht statt Schall).
