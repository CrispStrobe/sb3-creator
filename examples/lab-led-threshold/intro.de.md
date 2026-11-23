# LED-Schwellen: vier Farben an einer einstellbaren Spannung

Vier LEDs, rot, gelb, grün und blau, jede mit eigenem Widerstand, alle an derselben einstellbaren Spannung. Dreh den Knopf langsam auf, und sie leuchten nacheinander auf, in der Reihenfolge ihrer Farbe. Blau braucht die meiste Spannung, Rot die wenigste. Die Farbe des Lichts hängt von der Energie der Photonen ab, und die bestimmt das Material, das auch die nötige Spannung der LED festlegt.

**Vermittelt:** Flussspannung hängt von der Farbe ab, die exponentielle Diodenkennlinie, warum LEDs einen Vorwiderstand brauchen

## Was zu tun ist

Klick auf **Sim** und dreh den Knopf von 0 bis zum Anschlag. Achte darauf, welche LED zuerst leuchtet, und lies Strom- und Spannungsmesser an der roten ab. Auf halbem Weg leuchten drei LEDs, Blau ist noch dunkel.

## Was du sehen solltest

- Rot leuchtet zuerst, dann Gelb, dann Grün; Blau erst ab etwa 60 % des Knopfwegs.
- Sobald eine LED leuchtet, ändert sich ihre Spannung kaum noch, während der Strom weiter steigt.
- Auf halbem Weg: Rot etwa 1,5 V und 1,6 mA, Blau dunkel.

## Warum es funktioniert

Eine LED ist eine Diode: Unterhalb ihres Knicks fließt fast kein Strom, darüber steigt er steil an. Der Operationsverstärker als Spannungsfolger gibt die Knopfspannung weiter, ohne belastet zu werden. So bekommt jede LED dieselbe Spannung, und der Vergleich ist fair.
