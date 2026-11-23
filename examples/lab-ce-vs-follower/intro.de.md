---
level: intermediate
age: 14+
prereqs: [lab-transistor-curves]
teaches: [common-emitter, emitter-follower, voltage-gain, inversion]
---
## Was du siehst
Ein Eingangsregler, zwei Transistoren in zwei verschiedenen Schaltungen, drei Spannungsmesser. Dreh am Regler, und die beiden Ausgänge laufen in entgegengesetzte Richtungen.

## Probier das
1. Klick auf **Sim** und lies die drei Messgeräte ab.
2. Dreh das Potentiometer ein Stück auf. Um wie viel hat sich der Eingang geändert, um wie viel jeder Ausgang?
3. Teile die Änderung am Kollektor durch die Änderung am Eingang. Vergleiche mit 2,2 kΩ ÷ 1 kΩ.
4. Dreh den Regler ganz zu. Warum folgen beide Ausgänge nicht mehr?

## Was passiert hier
In der Emitterschaltung legt der Emitterwiderstand den Strom fest (Emitterspannung ÷ 1 kΩ), und dieser Strom fließt durch den 2,2-kΩ-Kollektorwiderstand — die Kollektorspannung ändert sich also 2,2-mal so stark, in Gegenrichtung. Beim Emitterfolger ist der Ausgang einfach der Eingang minus eine Diodenspannung: keine Verstärkung, aber den Strom liefert der Transistor, nicht der Regler. Verstärker nutzen oft beides: erst eine Verstärkerstufe, dann einen Folger für die Last.

## Weiter geht's
- [lab-push-pull](../lab-push-pull) — zwei Folger werden zur Endstufe.
- [lab-transistor-curves](../lab-transistor-curves) — woher der Arbeitspunkt kommt.
