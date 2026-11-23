# Eine LED, die sieht: Fotostromverstärker und Dämmerungsschalter

Eine LED funktioniert auch rückwärts: Fällt Licht auf sie, liefert sie einen winzigen Strom, höchstens einige Mikroampere. Ein Operationsverstärker mit 1 MΩ im Rückkopplungszweig macht daraus Volt, und ein zweiter vergleicht das Ergebnis mit einer einstellbaren Schwelle. Heraus kommen ein Lichtmesser und ein Dämmerungsschalter, ganz ohne speziellen Lichtsensor.

**Vermittelt:** Fotostrom, Transimpedanzverstärker, Komparatoren mit einstellbarer Schwelle

## Was zu tun ist

Klick auf **Sim** und lies das Messgerät ab: 4 V bei der voreingestellten Helligkeit. Schieb den Licht-Regler des Sensors langsam herunter und beobachte, wie das Messgerät folgt. Irgendwo unterhalb der Hälfte geht die Nachtlampe an. Mit dem Knopf verschiebst du diesen Punkt.

## Was du sehen solltest

- Das Messgerät zeigt ein Volt pro Mikroampere Fotostrom.
- Unterhalb von etwa halber Helligkeit leuchtet die gelbe Nachtlampe.
- Der Knopf stellt die Einschaltschwelle ein.

## Warum es funktioniert

Der Operationsverstärker hält seinen invertierenden Eingang auf 0 V, indem er genau den Fotostrom durch den 1-MΩ-Widerstand zurückschickt. Dafür muss sein Ausgang auf Strom mal Widerstand liegen. Der Sensor ist hier eine ganz normale rote LED; sie leuchtet nie, weil der Operationsverstärker ihre beiden Anschlüsse auf 0 V hält.
