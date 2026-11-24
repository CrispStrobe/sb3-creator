# Der MOSFET spürt eine Ladung

Ein Draht am Gate eines MOSFET. Bring ein geladenes Lineal in die Nähe, und die LED schaltet ein und bleibt an, solange das Lineal bleibt. Nimm es weg, und die LED geht aus.

**Vermittelt:** das Gate als Kondensator, influenzierte Ladung, warum MOSFETs statische Ladung fürchten

## Was zu tun ist

Klick auf **Sim**. Dreh den Knopf der Sonde langsam von 0 hoch (das Lineal kommt näher), warte, und dann zurück auf 0.

## Was du sehen solltest

- Etwa bei einem Drittel überschreitet das Gate rund 2 V, und die LED schaltet voll ein.
- Halte den Knopf still: Die LED bleibt an; die Gatespannung fließt nicht ab.
- Zurück auf 0: Das Gate geht auf 0 V, und die LED geht aus.

## Warum es funktioniert

In ein MOSFET-Gate kann kein Strom fließen: Es ist eine Platte eines winzigen Kondensators. Das Lineal influenziert eine Ladung auf Draht und Gate, und diese Ladung kann nirgends hin, darum behält das Gate seine Spannung, solange das Lineal bleibt. Anders als der Darlington-Detektor, der nur auf Bewegung reagiert, zeigt der MOSFET, wo das Lineal ist. Er zeigt auch, warum man MOSFETs vorsichtig anfasst: Ein geladener Finger kann Dutzende Volt auf ein Gate bringen.
