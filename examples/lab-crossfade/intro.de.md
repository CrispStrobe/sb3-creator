---
level: intermediate
age: 12+
prereqs: [pc54-opamp-follower, pc06-rc-charge]
teaches: [voltage-follower, RC-ramp, source-and-sink, LED-forward-voltage]
---
## Was du siehst
Zwei Taster und zwei LEDs. Halte TO GREEN gedrückt, und das Licht gleitet langsam von Rot nach Grün; halte TO RED, und es gleitet zurück. Lass los, und es bleibt, wo es ist.

## Probier das
1. Starte die Simulation: Rot leuchtet, Grün ist aus.
2. Halte TO GREEN etwa zwei Sekunden und sieh zu, wie das Licht überblendet. Lass in der Mitte los: Die Farbmischung friert ein.
3. Beobachte dabei das Voltmeter. Wo steht es, wenn beide LEDs gleich hell aussehen?
4. Halte TO RED, um zurückzublenden.

## Was dahintersteckt
Die Taster laden oder entladen einen Kondensator über 100 kΩ, was etwa eine Sekunde dauert: Das ist die langsame Rampe. Ein Kondensator kann LEDs nicht selbst treiben (sie würden ihn sofort leeren), also kopiert ein Spannungsfolger seine Spannung auf einen kräftigen Ausgang. Eine LED hängt von diesem Ausgang nach +9 V, die andere vom Ausgang nach Masse. Ist der Ausgang niedrig, bekommt die obere (rote) LED den Großteil der Spannung; ist er hoch, die untere (grüne). Dazwischen teilen sie sich die Spannung. Achte darauf, dass der Folger weder ganz oben noch ganz unten ankommt: Echte OPV-Ausgänge bleiben vor ihren Versorgungsspannungen stehen, und die LED-Ströme drücken sie noch weiter nach innen.

## Weiter geht's
- [pc54-opamp-follower](../pc54-opamp-follower): der Spannungsfolger für sich.
- [lab-opamp-follower](../lab-opamp-follower): warum ein Folger seine Quelle nicht leersaugt.
