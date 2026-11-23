---
level: beginner
age: 10+
prereqs: [pc36-series-interlock, pc61-diode-or]
teaches: [logic-gates, not, nand, nor, shunt-switching, truth-table]
---
## Was du siehst
Drei Lampen und fünf Taster, kein Chip und kein Transistor. Am Anfang leuchten alle Lampen. Die Taster liegen parallel zu den Lampen, nicht davor.

## Probier das
1. Klick auf **Sim**: alle drei LEDs sind an. Sind alle Eingänge 0, liefern NICHT, NAND und NOR jeweils 1.
2. Drück den NICHT-Taster: seine LED geht aus.
3. Drück beim NAND-Kanal erst nur A, dann nur B, dann beide. Nur beide zusammen schalten ihn aus.
4. Beim NOR-Kanal reicht schon ein einzelner Taster.
5. Beobachte den Batteriestrom. Er ist am größten, wenn alle Lampen dunkel sind!

## Was passiert hier
Ein geschlossener Taster parallel zur Lampe stiehlt ihr den Strom: die Lampe ist genau dann dunkel, wenn der Tasterweg leitet. Zwei Taster in Reihe leiten nur, wenn beide gedrückt sind (UND); schließen sie die Lampe kurz, ergibt das NICHT-UND. Zwei parallele leiten, wenn einer gedrückt ist (ODER), das ergibt NICHT-ODER. Der Vorwiderstand bleibt immer im Kreis, die Batterie wird also nie kurzgeschlossen – aber er führt jetzt mehr Strom als bei leuchtender Lampe. Deshalb verschwendet Kurzschluss-Logik Energie.

## Weiter geht's
- [pc36-series-interlock](../pc36-series-interlock) — Taster in Reihe als UND.
- [pc93-nand-is-universal](../pc93-nand-is-universal) — jedes Gatter aus NAND.
- [lab-touch-off](../lab-touch-off) — ein Transistor übernimmt das Kurzschließen.
