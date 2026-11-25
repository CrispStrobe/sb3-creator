# Vogelzwitschern aus einem angestoßenen Ton

Ein langsames Transistorpaar kippt alle paar Sekunden um. Bei jedem Umkippen gibt ein Kondensator einem Tongenerator aus einem LM386-Verstärker einen kurzen Stoß: Der Ton beginnt hoch, rutscht nach unten, während der Stoß abklingt, und verstummt dann. Ein kurzer, fallender Pfiff, immer wieder, wie ein Vogel.

**Vermittelt:** ein Kondensator macht aus einer Flanke einen abklingenden Impuls, ein Oszillator wird mit einer Diode getastet, eine fallende Tonhöhe aus einem fallenden Ladestrom

## Was zu tun ist

Klick auf **Sim** und hör zu. Dreh zwischen zwei Pfiffen am Tonhöhen-Poti.

## Was du sehen solltest

- Ein Zwitschern direkt nach dem Einschalten, dann Stille, nach etwa einer Drittelsekunde ein weiteres und danach alle paar Sekunden eines.
- Jedes Zwitschern steigt schnell auf etwa 2,5 bis 3,3 kHz und rutscht in weniger als einer Zehntelsekunde auf etwa 1,1 kHz herab.

## Warum es funktioniert

Solange der Stoß-Knoten tief liegt, hält eine Diode den Zeitkondensator des Tongenerators fest, und es ist still. Kippt das langsame Transistorpaar um, hebt ein Kondensator diesen Knoten um mehrere Volt an: Die Diode lässt los, und eine zweite Diode speist zusätzlichen Strom in den Zeitkondensator, sodass der Ton schnell läuft. Der Stoß klingt ab, während sich sein Kondensator auflädt, der Ton wird langsamer, und liegt der Knoten wieder tief, stoppt die Diode den Ton.
