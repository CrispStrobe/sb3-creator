---
level: advanced
age: 14+
prereqs: [lab-ce-vs-follower]
teaches: [push-pull, crossover-distortion, class-ab, bias]
---
## Was du siehst
Eine Sinusspannung und zwei Gegentakt-Endstufen, jede mit einem NPN, der nach oben drückt, und einem PNP, der nach unten zieht. Eine Stufe hat zwei kleine Dioden zwischen den Basen, die andere nicht.

## Probier das
1. Klick auf **Sim** und setze Oszilloskop-Tastköpfe an den Eingang und an beide Lasten.
2. Vergleiche die beiden Ausgänge in der Nähe der Nulldurchgänge.
3. Such bei der Stufe ohne Dioden das flache Stück. Wie breit ist es, in Volt?

## Was passiert hier
Ein NPN-Emitterfolger arbeitet nur, solange seine Basis etwa 0,7 V über dem Ausgang liegt, ein PNP nur, solange seine Basis 0,7 V darunter liegt. Liegen beide Basen am selben Signal, leitet um null herum keiner — der Ausgang klebt bei 0 V und der Sinus bekommt an jedem Nulldurchgang eine Stufe (Übernahmeverzerrung; man hört sie als rauen Klang). Die zwei Dioden halten die Basen etwa 1,4 V auseinander, damit jeder Transistor schon ganz leicht leitet, wenn der andere übergibt. Das ist Klasse AB: ein kleiner Ruhestrom für ein sauberes Signal.

## Weiter geht's
- [lab-ce-vs-follower](../lab-ce-vs-follower) — ein einzelner Emitterfolger.
