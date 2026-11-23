# Verstärker als Hupe: ein LM386 treibt einen Lautsprecher

Ein Audioverstärker soll ein leises Signal laut machen. Führt man einen Teil seines Ausgangs über einen Kondensator an den Eingang zurück, wartet er nicht mehr auf ein Signal, sondern erzeugt selbst einen Ton. Ein großer Kondensator bringt diesen Ton zum Lautsprecher, und ein Taster gibt der Hupe einen zweiten, höheren Ton.

**Vermittelt:** Schwingung durch Mitkopplung, Wechselspannungskopplung, warum ein Lautsprecher einen Kondensator braucht, die RC-Zeitkonstante bestimmt die Tonhöhe

## Was zu tun ist

Klick auf **Sim** und hör hin: ein tiefer Ton. Halte den Taster gedrückt, dann wird er höher. Öffne das Oszilloskop und vergleiche seine beiden Kanäle vor und hinter dem großen Kondensator.

## Was du sehen solltest

- Einen gleichmäßigen Ton von etwa 175 Hz, etwa 440 Hz, solange der Taster gedrückt ist.
- Kanal 1 (vor dem Kondensator) schwingt um 4,5 V, die halbe Batteriespannung.
- Kanal 2 (am Lautsprecher) zeigt dieselbe Schwingung, aber um 0 V herum.

## Warum es funktioniert

Der Verstärker vervielfacht die Spannung an seinem Eingang um das 20-Fache. Jedes Mal, wenn sein Ausgang umschwingt, schiebt der kleine Kondensator den Eingang in dieselbe Richtung, und der Verstärker schwingt noch kräftiger. Der Schub klingt über den Widerstand nach Masse ab, der Verstärker gibt nach und kippt zur anderen Seite: ein Oszillator. Ein kleinerer Widerstand lässt den Schub schneller abklingen; der Taster, der einen zweiten Widerstand dazuschaltet, macht den Ton deshalb höher. Der Ausgang des Verstärkers ruht auf der halben Versorgungsspannung; der große Kondensator lässt nur die Änderungen durch, sodass der Lautsprecher den Ton bekommt, aber keinen Gleichstrom.
