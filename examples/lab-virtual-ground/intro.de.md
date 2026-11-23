---
level: intermediate
age: 14+
prereqs: [pc02-voltage-divider, pc54-opamp-follower]
teaches: [virtual-ground, buffer, loading, reference]
---
## Was du siehst
Zwei Arten, „die halbe Batterie" zu erzeugen. Links hält ein Operationsverstärker den Mittelpunkt fest, rechts versucht es ein einfaches Widerstandspaar. An jedem Mittelpunkt hängen LEDs.

## Probier das
1. Klick auf **Sim** und lies beide Spannungsmesser ab.
2. Warum liegt der rechte so weit neben 4,5 V?
3. Miss links zwischen Mittelpunkt und jedem Batteriepol. Was zeigt das Messgerät?

## Was passiert hier
Viele Operationsverstärker-Schaltungen brauchen eine Versorgung, die symmetrisch um null liegt. Ein Spannungsteiler liefert den Mittelpunkt, aber nur, solange niemand Strom entnimmt: Die gelbe LED rechts drückt Strom in die Mitte und zieht sie nach oben. Links kopiert der Spannungsfolger die 4,5 V des Teilers an seinen Ausgang und liefert oder schluckt jeden Strom, den die Lasten brauchen. Nenn diesen Punkt „Masse", und aus einer Batterie wird eine ±4,5-V-Versorgung.

## Weiter geht's
- [pc54-opamp-follower](../pc54-opamp-follower) — der Folger allein.
- [pc02-voltage-divider](../pc02-voltage-divider) — der unbelastete Teiler.
