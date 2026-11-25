# Ein Magnet als Gashebel und ein Sanftanlauf für den Motor

Zwei Arten, einen Motor sanft anzutreiben. Erstens ein Magnet als Gashebel: Je näher er einem Hallsensor kommt, desto schneller dreht der Motor, ohne dass etwas berührt wird. Zweitens ein Sanftanlauf: ein Schalter, der den Motor nicht ruckartig anwirft, sondern ihn über eine Sekunde hochlaufen lässt.

**Vermittelt:** lineare Hallsensoren, RC-Rampen, Motortreiber

## Was zu tun ist

Klick auf **Sim**. Beweg den Feldregler des Hallsensors von 0 auf 1 und beobachte den Motor. Stell dann den Betriebsart-Schalter auf Sanftanlauf, schieb den Startschalter auf Start, warte und schieb ihn zurück auf Stopp.

## Was du sehen solltest

- Kein Feld: Der Motor steht. Stärkeres Feld: schneller.
- Sanftanlauf: Der Motor läuft über etwa eine Sekunde hoch und beim Ausschalten sanft aus.

## Warum es funktioniert

Der Ausgang des Hallsensors steigt mit dem Feld; der Operationsverstärker zieht seinen Ruhewert von 4,5 V ab und verdoppelt den Rest, und der LM386 macht daraus Motorleistung. Beim Sanftanlauf lädt sich ein Kondensator langsam über einen Widerstand; der Operationsverstärker gibt seine Spannung weiter, ohne ihn zu belasten, also folgt der Antrieb der langsamen Rampe hinauf und beim Ausschalten der langsamen Rampe hinab.
