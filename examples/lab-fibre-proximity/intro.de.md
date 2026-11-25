# Annäherungsschalter: zwei Lichtleiterenden und ein Relais

Zwei Lichtleiterstücke, Ende an Ende: Solange sie sich fast berühren, gelangt Licht von einem ins andere und ein Relais zieht an. Zieh sie auseinander, und es fällt ab. Ein Schalter ohne bewegten Kontakt am Fühler.

**Vermittelt:** Lichtkopplung zwischen Lichtleitern, Relais, Schalthysterese

## Was zu tun ist

Klick auf **Sim**. Bewege den Regler des Lichtwegs (den Spalt zwischen den beiden Lichtleiterenden) langsam von 0 Richtung 5 mm und dann langsam zurück.

## Was du sehen solltest

- Dicht beieinander: Das Relais ist angezogen und die gelbe LED leuchtet.
- Spalt öffnen: Das Relais fällt zwischen 1,5 und 2 mm ab.
- Wieder schließen: Es zieht erst unter 1,5 mm an, etwas näher als dort, wo es abgefallen ist.

## Warum es funktioniert

Licht tritt aus einem Lichtleiterende als Kegel aus. Der zweite Lichtleiter fängt nur den Teil, der auf seinen Kern fällt, und der schrumpft mit dem Abstand schnell. Der Fototransistor macht aus dem Licht einen Strom, der Transistor und Relais schaltet. Ein Relais braucht zum Anziehen mehr Spulenstrom als zum Halten. Deshalb schaltet es bei leicht verschiedenen Abständen ein und aus und flattert nicht an der Schwelle.
