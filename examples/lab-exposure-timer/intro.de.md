# Belichtungsuhr: mehr Licht, kürzere Zeit

Eine Belichtungsuhr für die Dunkelkammer soll nicht eine feste Zeit laufen, sondern eine feste Lichtmenge liefern. Hier lädt ein Fototransistor den Zeitkondensator eines 555-Monoflops. Bei hellem Licht lädt er schnell, und die Lampe geht früh aus; bei schwachem Licht dauert es länger. Licht mal Zeit bleibt ungefähr gleich.

**Vermittelt:** sensorgesteuerte Zeiten, umgekehrte Proportionalität, der Begriff der Dosis

## Was zu tun ist

Klick auf **Sim**, drück den Start-Taster und miss, wie lange die weiße Lampen-LED leuchtet. Stell den Licht-Schieberegler des Fototransistors auf voll und drück noch einmal, dann auf ein Zehntel und drück wieder.

## Was du sehen solltest

- Volles Licht: etwa eine Viertelsekunde.
- Halbes Licht: etwa eine halbe Sekunde.
- Ein Zehntel: etwa 2,4 Sekunden.
- Licht mal Zeit: immer etwa 0,25.

## Warum es funktioniert

Ein Fototransistor lässt einen Strom durch, der proportional zum Licht ist. Ein konstanter Strom lädt einen Kondensator gleichmäßig, also ist die Zeit bis zur Schwelle des 555 umgekehrt proportional zum Licht. Der Widerstand mit 1 MΩ beendet die Belichtung auch bei völliger Dunkelheit nach etwa 24 Sekunden.
