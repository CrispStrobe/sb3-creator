---
level: advanced
age: 14+
prereqs: [38-npn-switch, 17-comparator]
teaches: [differential-pair, long-tailed-pair, common-mode, op-amp-input-stage]
---
## Was du siehst
Zwei Transistoren, deren Emitter sich einen Widerstand teilen, links eine rote LED, rechts eine grüne. Die linke Basis liegt auf halber Betriebsspannung, die rechte hängt an einem Drehknopf.

## Probier das
1. Klick auf **Sim**: steht der Knopf in der Mitte, leuchten beide LEDs halb hell.
2. Dreh den Knopf langsam hoch. Innerhalb weniger Zehntel Volt wandert das Licht ganz auf die grüne Seite.
3. Dreh ihn unter die Mitte: jetzt bekommt Rot alles.
4. Beobachte die Spannung am gemeinsamen Emitterwiderstand: sie folgt der jeweils höheren Basis.

## Was passiert hier
Der gemeinsame Widerstand legt den Gesamtstrom fest, etwa 3,7 mA. Die beiden Transistoren entscheiden nur, wie er aufgeteilt wird, und der mit der höheren Basis bekommt mehr – exponentiell mehr, schon 0,1 V Unterschied verschieben fast alles. Steigen beide Eingänge gemeinsam, ändert sich nichts, denn die Aufteilung hängt nur von ihrem Unterschied ab. Deshalb beginnt jeder Operationsverstärker mit genau diesem Paar.

## Weiter geht's
- [17-comparator](../17-comparator) — ein fertiger Komparator-Chip.
- [lab-schmitt-clap](../lab-schmitt-clap) — derselbe gemeinsame Emitterwiderstand, mit Rückkopplung.
