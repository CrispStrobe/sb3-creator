---
level: advanced
age: 14+
prereqs: [lab-diff-pair, 17-comparator]
teaches: [differential-pair, comparator, op-amp, fine-tuning, sensitivity]
---
## Was du siehst
Wieder das Differenzpaar: zwei Transistoren mit einem gemeinsamen Emitterwiderstand, eine Basis an einem festen Spannungsteiler auf halber Betriebsspannung, die andere an einem Drehknopf. Diesmal leuchten an den Kollektoren keine LEDs. Sie führen zu den beiden Eingängen eines Operationsverstärkers, und dessen Ausgang schaltet eine grüne LED (Ausgang hoch) oder eine rote (Ausgang tief). Ein Spannungsmesser zeigt den Unterschied zwischen den beiden Basen.

## Probier das
1. Klick auf **Sim**: Grün leuchtet, und der Spannungsmesser zeigt, dass der Eingang nur einen Bruchteil eines Millivolts über der Referenz liegt.
2. Dreh den Knopf in winzigen Schritten herunter. Wo springt das Licht auf Rot? Lies genau dort den Spannungsmesser ab.
3. Dreh den Knopf von einem Anschlag zum anderen. Wie weit bewegt sich die Eingangsspannung insgesamt?
4. Vergleiche mit [lab-diff-pair](../lab-diff-pair): Welchen Unterschied brauchten die LEDs dort?

## Was passiert hier
Das Paar macht aus dem Unterschied zwischen seinen Basen einen Unterschied zwischen seinen Kollektorspannungen. Für sich allein ist das ein sanfter Übergang: Etwa ein Zehntel Volt schiebt den Strom von einer Seite auf die andere. Der Operationsverstärker vervielfacht den Kollektorunterschied aber enorm, sodass schon ein paar hundert Mikrovolt an den Basen seinen Ausgang ganz nach oben oder unten treiben. So entsteht ein sehr empfindlicher Komparator. Um so etwas Empfindliches einzustellen, braucht man einen sanften Knopf: Das Potentiometer sitzt zwischen zwei Begrenzungswiderständen, ein ganzer Dreh überstreicht weniger als ein Volt, und jeder kleine Schritt verschiebt den Eingang nur um wenige Millivolt. Grobbereich plus Feinregler – diesen Trick findet man in vielen Messgeräten.

## Weiter geht's
- [lab-diff-blinker](../lab-diff-blinker) — führt man den Ausgang zum Paar zurück, fängt der Komparator an zu blinken.
- [lab-diff-pair](../lab-diff-pair) — das nackte Paar mit je einer LED auf jeder Seite.
