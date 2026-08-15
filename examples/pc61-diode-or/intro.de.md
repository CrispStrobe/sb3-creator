---
level: beginner
age: 12+
prereqs: [pc08-diode-polarity]
teaches: [diode-logic, or-gate, signal-combining]
---
## Was du siehst
Zwei Eingangssignale fuehren jeweils ueber eine Diode zu einem gemeinsamen Ausgang. Wenn einer der Eingaenge high ist, ist der Ausgang high. Beide muessen low sein, damit der Ausgang low ist — das ist ein OR-Gatter aus Dioden.

## Probier das
1. Setze beide Eingaenge auf low und pruefe, dass der Ausgang low ist.
2. Setze einen Eingang auf high (egal welchen) und beobachte, wie der Ausgang auf high geht.
3. Setze beide Eingaenge auf high und pruefe, dass der Ausgang immer noch high ist — OR interessiert sich nicht dafuer, welcher Eingang aktiv ist, nur dass mindestens einer es ist.

## Was passiert hier
Jede Diode leitet, wenn ihre Anode (Eingangsseite) etwa 0,7 V hoeher ist als die Kathode (Ausgangsseite). Wenn ein Eingang auf high geht, leitet seine Diode und zieht den Ausgang auf high. Die andere Diode ist in Sperrrichtung und blockiert, sodass sich die Eingaenge nicht gegenseitig beeinflussen. Ein Pull-down-Widerstand haelt den Ausgang auf low, wenn kein Eingang aktiv ist. Die Ausgangsspannung ist wegen des Diodenspannungsabfalls etwa 0,7 V niedriger als der Eingang.

## Warum das wichtig ist
Diodenlogik war die Art, wie die fruehesten Computer Gatter implementierten, bevor Transistoren guenstig waren. Heute taucht sie immer noch in Stromversorgungspfaden auf (Auswahl der hoeheren von zwei Versorgungsspannungen) und in Signalkombinationsschaltungen. Sie zu verstehen zeigt, dass Logik keine Magie ist — sondern nur geschickter Einsatz von Einweg-Stromfluss.

## Weiter geht's
- [pc08-diode-polarity](../pc08-diode-polarity) — die Einweg-Leitung, die das ermoeglicht.
- [pc49-diode-clamp](../pc49-diode-clamp) — Dioden zur Spannungsbegrenzung statt fuer Logik.
- Experiment: Fuege eine dritte Eingangsdiode hinzu und pruefe, dass das Gatter immer noch funktioniert — Dioden-OR skaliert auf beliebig viele Eingaenge.
