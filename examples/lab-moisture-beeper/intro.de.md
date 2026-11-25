# Feuchtigkeitsmelder mit Licht und Ton

Zwei blanke Drähte liegen in einer Windel. Solange sie trocken ist, passiert nichts; wird sie nass, geht ein blaues Licht an und ein Piepser ertönt. Ein paar Transistoren erledigen das.

**Vermittelt:** Transistor als Schalter, Inverter, einen Oszillator freigeben, Leitfähigkeit von Wasser

## Was zu tun ist

Klick auf **Sim**. Dreh den Knopf **WET** langsam auf (die Sonde wird nasser) und wieder zurück.

## Was du sehen solltest

- Trocken: dunkel und still.
- Nass: Die blaue LED leuchtet, und ein Ton von etwa 785 Hz erklingt.

## Warum es funktioniert

Wasser mit etwas Salz darin leitet. Ist die Sonde nass, fließt Strom durch sie in die Basis des ersten Transistors und schaltet ihn ein: Die blaue LED leuchtet. Derselbe Transistor nimmt einem zweiten den Basisstrom weg, der bis dahin die Basiswiderstände des Tongenerators auf Masse hielt. Freigegeben, legt der Tongenerator los.
