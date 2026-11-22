---
level: beginner
age: 10+
prereqs: [38-npn-switch]
teaches: [conductivity, sensor, transistor-amplifier, inverter]
---
## Was du siehst
Ein Wasserfühler – zwei blanke Drähte – speist einen Transistor. Eine blaue LED bedeutet „nass“, eine rote „trocken“. Weil der Simulator kein Wasser kennt, ist der Fühler ein Schiebewiderstand: bei 0 ist er trockene Luft (10 MΩ), bei 1 berühren sich die Drähte.

## Probier das
1. Klick auf **Sim**: der Fühler ist trocken, die rote LED warnt „zu trocken“.
2. Schieb den Fühler langsam Richtung 1. Ab etwa 1 MΩ beginnt die blaue LED zu glimmen; bei rund 100 kΩ (Leitungswasser, feuchte Erde) übernimmt sie.
3. Schließ die Drähte kurz (Schieber auf 1): blau ist an, rot ist aus.

## Was passiert hier
Wasser mit etwas Salz oder Schmutz darin leitet, trockene Luft nicht. Selbst nass lässt der Fühler nur Mikroampere durch – viel zu wenig für eine LED. Der erste Transistor verstärkt diesen Strom etwa hundertfach und lässt die blaue LED leuchten. Gleichzeitig sinkt seine Kollektorspannung, und genau die beobachtet der zweite Transistor: ist der erste aus, ist der zweite an. Ein Fühler liefert so zwei entgegengesetzte Antworten, „nass“ für einen Regenmelder und „trocken“ für eine Pflanze, die Wasser braucht.

## Weiter geht's
- [lab-touch-darlington](../lab-touch-darlington) — noch mehr Verstärkung für noch größere Widerstände.
- [38-npn-switch](../38-npn-switch) — der Transistorschalter für sich allein.
