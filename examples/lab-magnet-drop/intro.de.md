# Ein Magnet fällt durch eine Spule: der Impuls kippt ein Flipflop

Ein Magnet, der durch eine Drahtspule fällt, erzeugt darin einen kurzen Spannungsimpuls, ganz ohne Batterie und Kontakt. Gibt man diesen Impuls auf ein Transistor-Flipflop, merkt sich das Flipflop, dass der Magnet hindurchgefallen ist.

**Vermittelt:** elektromagnetische Induktion, Flussänderung, ein Flipflop als Speicher

## Was zu tun ist

Klick auf **Sim**. Grün leuchtet. Drück in der Instrumentenspalte **Magnet fallen lassen** und warte einen Moment, während er fällt. Drück dann den Taster auf der Platine (Reset). Schließ das Oszilloskop an die Spule an, um die beiden Impulse zu sehen.

## Was du sehen solltest

- Etwa eine Fünftelsekunde nach dem Fallenlassen tauschen die LEDs: Rot an, Grün aus.
- So bleibt es, bis du den Reset-Taster drückst.
- Auf dem Oszilloskop: ein Impuls, wenn der Magnet in die Spule eintritt, und ein umgekehrter, größerer, wenn er sie verlässt.

## Warum es funktioniert

Die Spule „spürt“, wie viel vom Feld des Magneten durch sie hindurchgeht. Während der Magnet näherkommt, wächst diese Menge und eine Spannung entsteht; beim Verlassen schrumpft sie und die Spannung kehrt sich um. Je schneller die Änderung, desto größer die Spannung. Der erste Impuls schaltet Q1 ein, der Q2 ausschaltet, der wiederum Q1 an hält: Das Flipflop speichert das Ereignis. Fahrradtachos und Gitarren-Tonabnehmer nutzen dieselbe Induktion.
