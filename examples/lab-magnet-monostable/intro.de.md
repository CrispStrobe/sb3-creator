# Ein fallender Magnet startet einen Zeitschalter

Ein Magnet, der durch eine Spule fällt, erzeugt einen kurzen Impuls. Hier startet er ein Monoflop aus zwei Transistoren: Die LED leuchtet etwa eine Drittelsekunde, geht von selbst wieder aus, und die Schaltung wartet auf den nächsten Magneten. Ein Poti stellt ein, wie groß der Impuls sein muss.

**Vermittelt:** das Monoflop, Empfindlichkeit über den Arbeitspunkt

## Was zu tun ist

Klick auf **Sim**. Drück in der Instrumentenspalte **Magnet fallen lassen**, warte auf die LED und lass ihn noch einmal fallen. Dreh dann das Empfindlichkeits-Poti etwa bis zur Hälfte zurück und lass den Magneten erneut fallen.

## Was du sehen solltest

- Etwa 0,2 s nach jedem Fallenlassen (die Fallzeit) leuchtet die rote LED etwa 0,3 s lang und geht dann von selbst aus.
- Das klappt bei jedem Wurf wieder.
- Mit halb zurückgedrehtem Poti löst derselbe Magnet nichts mehr aus.

## Warum es funktioniert

In Ruhe leitet der rechte Transistor und hält den linken gesperrt. Das Poti hebt die Basis des linken Transistors knapp unter seine Schaltschwelle. Der Spulenimpuls, über einen Kondensator weitergegeben, schiebt sie darüber: Der linke Transistor schaltet ein, sein fallender Kollektor zieht über den 10-µF-Kondensator die Basis des rechten unter null, und der rechte sperrt. Bis sich dieser Kondensator über 47 kΩ wieder aufgeladen hat, bleibt die Schaltung so, dann kippt sie zurück. Mit zurückgedrehtem Poti liegt die Basis zu weit unter der Schwelle, als dass der Impuls sie erreicht.
